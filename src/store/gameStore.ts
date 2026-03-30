import { create } from 'zustand';
import { GameState, PuzzleLevel, Piece, PlacementAnimInfo, MoveSnapshot } from '../game/types';
import { placePiece, hasAnyValidMove, createEmptyBoard, isBoardEmpty, calculateScoreWithCombo } from '../game/board';
import { getPuzzlesForDate, generateEndlessPuzzle } from '../data/dailyPuzzles';
import { getTodayString } from '../utils/date';
import { Storage, DailyProgress, EndlessPausedState } from '../utils/storage';
import { Analytics } from '../analytics';
import { findBestPlacement, getPlacementCells } from '../game/hints';
import { calculateStarRating } from '../game/starRating';

interface DailyState {
  date: string;
  puzzles: PuzzleLevel[];
  currentPuzzleIndex: number;
  isDayComplete: boolean;
  totalDayScore: number;
  completedPuzzleIds: string[];
  /** Star ratings per puzzle ID (1-3) */
  puzzleStars: Record<string, number>;
}

interface EndlessState {
  seed: number;
  currentLevel: number;
  totalScore: number;
  currentPuzzle: PuzzleLevel;
  highScore: number;
  bestLevel: number;
  isGameOver: boolean;
  isGenerating: boolean;
}

interface GameStore {
  // Daily state
  daily: DailyState | null;
  currentGame: GameState | null;
  selectedPieceIndex: number | null;
  streak: number;
  isLoading: boolean;
  /** Flag: streak was broken and can be saved via rewarded ad */
  streakBroken: { previousStreak: number } | null;

  // Endless state
  endless: EndlessState | null;
  mode: 'daily' | 'endless';

  // Actions
  loadDailyState: (targetDate?: string) => Promise<void>;
  startCurrentPuzzle: (options?: { revivalUsed?: boolean }) => void;
  selectPiece: (index: number) => void;
  placePieceAt: (row: number, col: number) => void;
  placePieceByIndex: (pieceIndex: number, row: number, col: number) => PlacementAnimInfo | null;
  useRevival: () => void;
  retryCurrentPuzzle: () => void;
  advanceToNextPuzzle: () => Promise<void>;

  // Hint & Undo
  getHint: () => { pieceIndex: number; row: number; col: number; cells: [number, number][] } | null;
  undoLastMove: () => boolean;

  // Streak protection
  protectStreak: () => Promise<void>;

  // Endless actions
  startEndless: () => Promise<void>;
  startEndlessPuzzle: (options?: { revivalUsed?: boolean }) => void;
  advanceEndless: () => Promise<void>;
  endEndlessRun: () => Promise<{ totalScore: number; level: number; newHighScore: boolean }>;
  retryEndless: () => Promise<void>;
  pauseEndless: () => Promise<void>;
  resumeEndless: () => Promise<boolean>;
}

function createGameState(
  puzzle: PuzzleLevel,
  revivalUsed = false,
): GameState {
  return {
    board: puzzle.initialBoard.map(row => [...row]),
    pieces: [...puzzle.pieces],
    placedCount: 0,
    score: 0,
    linesCleared: 0,
    isComplete: false,
    isFailed: false,
    revivalUsed,
    consecutiveClearCount: 0,
    moveHistory: [],
    undoUsed: false,
    hintsUsed: 0,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  daily: null,
  currentGame: null,
  selectedPieceIndex: null,
  streak: 0,
  isLoading: true,
  streakBroken: null,
  endless: null,
  mode: 'daily' as const,

  loadDailyState: async (targetDate?: string) => {
    const existingDaily = get().daily;
    if (!existingDaily) {
      set({ isLoading: true });
    }
    const date = targetDate ?? getTodayString();

    // 1) Reuse in-memory puzzles if same date
    if (existingDaily && existingDaily.date === date) {
      const [savedProgress, streakData] = await Promise.all([
        Storage.getDailyProgress(date),
        Storage.getStreak(),
      ]);
      let idx = savedProgress?.currentPuzzleIndex ?? 0;
      if (idx >= existingDaily.puzzles.length) idx = existingDaily.puzzles.length - 1;
      set({
        daily: {
          date,
          puzzles: existingDaily.puzzles,
          currentPuzzleIndex: idx,
          isDayComplete: savedProgress?.isDayComplete ?? false,
          totalDayScore: savedProgress?.totalScore ?? 0,
          completedPuzzleIds: savedProgress?.completedPuzzleIds ?? [],
          puzzleStars: existingDaily.puzzleStars,
        },
        streak: streakData.currentStreak,
        isLoading: false,
        mode: 'daily',
      });
      return;
    }

    // 2) Try AsyncStorage cache (instant), then progress + streak in parallel
    const [cachedPuzzles, savedProgress, streakData, brokenStreak, starRatings] = await Promise.all([
      Storage.getCachedPuzzles(date),
      Storage.getDailyProgress(date),
      Storage.getStreak(),
      Storage.checkStreakBroken(date),
      Storage.getStarRatings(date),
    ]);

    if (cachedPuzzles && cachedPuzzles.length > 0) {
      // Cache hit — use immediately
      let idx = savedProgress?.currentPuzzleIndex ?? 0;
      if (idx >= cachedPuzzles.length) idx = cachedPuzzles.length - 1;
      set({
        daily: {
          date,
          puzzles: cachedPuzzles as PuzzleLevel[],
          currentPuzzleIndex: idx,
          isDayComplete: savedProgress?.isDayComplete ?? false,
          totalDayScore: savedProgress?.totalScore ?? 0,
          completedPuzzleIds: savedProgress?.completedPuzzleIds ?? [],
          puzzleStars: starRatings,
        },
        streak: streakData.currentStreak,
        streakBroken: brokenStreak ? { previousStreak: brokenStreak } : null,
        isLoading: false,
        mode: 'daily',
      });
      return;
    }

    // 3) Cache miss — generate puzzles off main thread, then cache
    const puzzles = await new Promise<PuzzleLevel[]>((resolve) => {
      setTimeout(() => resolve(getPuzzlesForDate(date)), 0);
    });
    // Save to cache for next app launch
    Storage.saveCachedPuzzles(date, puzzles);

    let currentPuzzleIndex = savedProgress?.currentPuzzleIndex ?? 0;
    if (currentPuzzleIndex >= puzzles.length) {
      currentPuzzleIndex = puzzles.length - 1;
    }

    set({
      daily: {
        date,
        puzzles,
        currentPuzzleIndex,
        isDayComplete: savedProgress?.isDayComplete ?? false,
        totalDayScore: savedProgress?.totalScore ?? 0,
        completedPuzzleIds: savedProgress?.completedPuzzleIds ?? [],
        puzzleStars: starRatings,
      },
      streak: streakData.currentStreak,
      streakBroken: brokenStreak ? { previousStreak: brokenStreak } : null,
      isLoading: false,
      mode: 'daily',
    });
  },

  startCurrentPuzzle: (options) => {
    const { daily } = get();
    if (!daily) return;

    const puzzle = daily.puzzles[daily.currentPuzzleIndex];
    if (!puzzle) return;

    const gameState = createGameState(puzzle, options?.revivalUsed ?? false);

    set({ currentGame: gameState, selectedPieceIndex: null });
    Analytics.logEvent('puzzle_start', {
      puzzle_id: puzzle.id,
      date: daily.date,
      order: puzzle.orderInDay,
      revival_used: gameState.revivalUsed,
    });
  },

  selectPiece: (index: number) => {
    const { currentGame } = get();
    if (!currentGame || currentGame.isComplete || currentGame.isFailed) return;
    if (index < 0 || index >= currentGame.pieces.length) return;
    set({ selectedPieceIndex: index });
  },

  placePieceByIndex: (pieceIndex: number, row: number, col: number): PlacementAnimInfo | null => {
    const { currentGame, daily, endless, mode } = get();
    if (!currentGame) return null;
    if (currentGame.isComplete || currentGame.isFailed) return null;
    if (pieceIndex < 0 || pieceIndex >= currentGame.pieces.length) return null;

    const piece = currentGame.pieces[pieceIndex];
    if (!piece) return null;

    const result = placePiece(currentGame.board, piece, row, col);
    if (!result.success) return null;

    // Save move snapshot for undo (before modifying state)
    const snapshot: MoveSnapshot = {
      board: currentGame.board.map(r => [...r]),
      pieces: [...currentGame.pieces],
      score: currentGame.score,
      linesCleared: currentGame.linesCleared,
      consecutiveClearCount: currentGame.consecutiveClearCount,
      placedCount: currentGame.placedCount,
    };

    // Combo tracking: increment if lines cleared, reset if not
    const newConsecutiveClearCount = result.linesCleared > 0
      ? currentGame.consecutiveClearCount + 1
      : 0;

    // Calculate score with combo multiplier
    const { score: moveScore, comboMultiplier } = calculateScoreWithCombo(
      result.linesCleared,
      piece.shape.length,
      newConsecutiveClearCount,
    );

    const remainingPieces = currentGame.pieces.filter((_, i) => i !== pieceIndex);
    const newPlacedCount = currentGame.placedCount + 1;
    const newScore = currentGame.score + moveScore;
    const newLinesCleared = currentGame.linesCleared + result.linesCleared;

    // 成功条件: ボードが空になればクリア（ピースが残っていてもOK）
    const boardEmpty = isBoardEmpty(result.board);
    const isComplete = boardEmpty;
    const isFailed = !boardEmpty && remainingPieces.length === 0 ? true
                   : !boardEmpty && !hasAnyValidMove(result.board, remainingPieces);

    const newGame: GameState = {
      board: result.board,
      pieces: remainingPieces,
      placedCount: newPlacedCount,
      score: newScore,
      linesCleared: newLinesCleared,
      isComplete,
      isFailed,
      revivalUsed: currentGame.revivalUsed,
      consecutiveClearCount: newConsecutiveClearCount,
      moveHistory: [...currentGame.moveHistory, snapshot],
      undoUsed: currentGame.undoUsed,
      hintsUsed: currentGame.hintsUsed,
    };

    set({ currentGame: newGame, selectedPieceIndex: null });

    // Analytics
    if (mode === 'endless' && endless) {
      if (isComplete) {
        Analytics.logEvent('endless_puzzle_complete', {
          level: endless.currentLevel,
          score: newScore,
          lines_cleared: newLinesCleared,
          revival_used: currentGame.revivalUsed,
        });
      } else if (isFailed) {
        Analytics.logEvent('endless_puzzle_fail', {
          level: endless.currentLevel,
          revival_used: currentGame.revivalUsed,
        });
      }
    } else if (daily) {
      if (isComplete) {
        Analytics.logEvent('puzzle_complete', {
          puzzle_id: daily.puzzles[daily.currentPuzzleIndex].id,
          score: newScore,
          lines_cleared: newLinesCleared,
          revival_used: currentGame.revivalUsed,
        });
      } else if (isFailed) {
        Analytics.logEvent('puzzle_fail', {
          puzzle_id: daily.puzzles[daily.currentPuzzleIndex].id,
          revival_used: currentGame.revivalUsed,
        });
      }
    }

    // Log combo events
    if (comboMultiplier >= 2) {
      Analytics.logEvent('combo_achieved', {
        multiplier: comboMultiplier,
        mode,
      });
    }

    // Return animation info
    const placedCells: [number, number][] = piece.shape.map(([dr, dc]) => [row + dr, col + dc]);
    return {
      placedCells,
      clearedRows: result.clearedRows,
      clearedCols: result.clearedCols,
      linesCleared: result.linesCleared,
      scoreGained: moveScore,
      comboMultiplier,
    };
  },

  placePieceAt: (row: number, col: number) => {
    const { selectedPieceIndex } = get();
    if (selectedPieceIndex === null) return;
    get().placePieceByIndex(selectedPieceIndex, row, col);
  },

  useRevival: () => {
    const { mode } = get();
    Analytics.logEvent('revival_used', { mode });

    if (mode === 'endless') {
      get().startEndlessPuzzle({ revivalUsed: true });
      return;
    }

    get().startCurrentPuzzle({ revivalUsed: true });
  },

  retryCurrentPuzzle: () => {
    get().startCurrentPuzzle();
  },

  advanceToNextPuzzle: async () => {
    const { daily, currentGame } = get();
    if (!daily || !currentGame) return;

    const currentPuzzle = daily.puzzles[daily.currentPuzzleIndex];
    const newCompletedIds = [...daily.completedPuzzleIds, currentPuzzle.id];
    const newTotalScore = daily.totalDayScore + currentGame.score;
    const nextIndex = daily.currentPuzzleIndex + 1;
    const isDayComplete = nextIndex >= daily.puzzles.length;

    // Calculate star rating for this puzzle
    const stars = calculateStarRating(currentGame.score, currentPuzzle);
    const newPuzzleStars = { ...daily.puzzleStars, [currentPuzzle.id]: stars };
    // Persist best star (storage keeps the max)
    Storage.saveStarRating(daily.date, currentPuzzle.id, stars);

    const updatedDaily: DailyState = {
      ...daily,
      currentPuzzleIndex: isDayComplete ? daily.currentPuzzleIndex : nextIndex,
      completedPuzzleIds: newCompletedIds,
      totalDayScore: newTotalScore,
      isDayComplete,
      puzzleStars: newPuzzleStars,
    };

    const progress: DailyProgress = {
      date: daily.date,
      completedPuzzleIds: newCompletedIds,
      currentPuzzleIndex: updatedDaily.currentPuzzleIndex,
      totalScore: newTotalScore,
      isDayComplete,
    };
    await Storage.saveDailyProgress(progress);

    // Save daily record for calendar history
    await Storage.saveDailyRecord(daily.date, {
      completedCount: newCompletedIds.length,
      totalCount: daily.puzzles.length,
      totalScore: newTotalScore,
      isDayComplete,
    });

    if (isDayComplete) {
      await Storage.addClearHistory(daily.date);
      const countedForStreak = daily.date === getTodayString();
      const streakData = countedForStreak
        ? await Storage.updateStreak(daily.date)
        : await Storage.getStreak();

      set({ daily: updatedDaily, currentGame: null, streak: streakData.currentStreak });

      Analytics.logEvent('daily_complete', {
        date: daily.date,
        total_score: newTotalScore,
        streak: streakData.currentStreak,
        counted_for_streak: countedForStreak,
      });
    } else {
      set({ daily: updatedDaily, currentGame: null });
    }
  },

  // ─── Hint system ───
  getHint: () => {
    const { currentGame } = get();
    if (!currentGame || currentGame.isComplete || currentGame.isFailed) return null;
    if (currentGame.hintsUsed >= 2) return null;

    const hint = findBestPlacement(currentGame.board, currentGame.pieces);
    if (!hint) return null;

    const piece = currentGame.pieces[hint.pieceIndex];
    const cells = getPlacementCells(piece, hint.row, hint.col);

    // Mark hint as used
    set({
      currentGame: {
        ...currentGame,
        hintsUsed: currentGame.hintsUsed + 1,
      },
    });

    Analytics.logEvent('hint_used', {
      mode: get().mode,
      hints_used: currentGame.hintsUsed + 1,
    });

    return { ...hint, cells };
  },

  // ─── Undo last move ───
  undoLastMove: (): boolean => {
    const { currentGame } = get();
    if (!currentGame || currentGame.moveHistory.length === 0) return false;
    if (currentGame.undoUsed) return false;

    const lastSnapshot = currentGame.moveHistory[currentGame.moveHistory.length - 1];
    const newGame: GameState = {
      board: lastSnapshot.board,
      pieces: lastSnapshot.pieces,
      placedCount: lastSnapshot.placedCount,
      score: lastSnapshot.score,
      linesCleared: lastSnapshot.linesCleared,
      consecutiveClearCount: lastSnapshot.consecutiveClearCount,
      isComplete: false,
      isFailed: false,
      revivalUsed: currentGame.revivalUsed,
      moveHistory: currentGame.moveHistory.slice(0, -1),
      undoUsed: true,
      hintsUsed: currentGame.hintsUsed,
    };

    set({ currentGame: newGame, selectedPieceIndex: null });

    Analytics.logEvent('undo_used', { mode: get().mode });
    return true;
  },

  // ─── Streak protection ───
  protectStreak: async () => {
    const { streakBroken } = get();
    if (!streakBroken) return;

    await Storage.useStreakShield();
    const streakData = await Storage.getStreak();

    set({
      streak: streakBroken.previousStreak,
      streakBroken: null,
    });

    Analytics.logEvent('streak_protected', {
      streak_saved: streakBroken.previousStreak,
    });
  },

  // ─── Endless mode ───
  startEndless: async () => {
    await Storage.clearEndlessPausedState();
    const seed = Date.now();
    const highScore = await Storage.getEndlessHighScore();
    const bestLevel = await Storage.getEndlessBestLevel();
    const puzzle = generateEndlessPuzzle(1, seed);

    set({
      mode: 'endless',
      endless: {
        seed,
        currentLevel: 1,
        totalScore: 0,
        currentPuzzle: puzzle,
        highScore,
        bestLevel,
        isGameOver: false,
        isGenerating: false,
      },
      currentGame: null,
      selectedPieceIndex: null,
    });

    Analytics.logEvent('endless_start', { seed });
  },

  startEndlessPuzzle: (options) => {
    const { endless } = get();
    if (!endless) return;

    const puzzle = endless.currentPuzzle;
    const gameState = createGameState(puzzle, options?.revivalUsed ?? false);

    set({ currentGame: gameState, selectedPieceIndex: null });
    Analytics.logEvent('endless_puzzle_start', {
      level: endless.currentLevel,
      revival_used: gameState.revivalUsed,
    });
  },

  advanceEndless: async () => {
    const { endless, currentGame } = get();
    if (!endless || !currentGame) return;

    const newTotalScore = endless.totalScore + currentGame.score;
    const nextLevel = endless.currentLevel + 1;

    // Show loading state immediately, defer heavy generation to next frame
    set({
      endless: {
        ...endless,
        currentLevel: nextLevel,
        totalScore: newTotalScore,
        isGenerating: true,
      },
      currentGame: null,
    });

    // Defer puzzle generation so the loading UI can render first
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const nextPuzzle = generateEndlessPuzzle(nextLevel, get().endless!.seed);
        set({
          endless: {
            ...get().endless!,
            currentPuzzle: nextPuzzle,
            isGenerating: false,
          },
        });
        resolve();
      }, 50);
    });
  },

  endEndlessRun: async () => {
    const { endless, currentGame } = get();
    if (!endless) return { totalScore: 0, level: 0, newHighScore: false };

    await Storage.clearEndlessPausedState();
    const finalScore = endless.totalScore + (currentGame?.score ?? 0);
    const finalLevel = endless.currentLevel;
    const { newHighScore } = await Storage.saveEndlessRecord(finalScore, finalLevel);

    set({
      endless: {
        ...endless,
        totalScore: finalScore,
        isGameOver: true,
        highScore: newHighScore ? finalScore : endless.highScore,
        bestLevel: finalLevel > endless.bestLevel ? finalLevel : endless.bestLevel,
      },
    });

    Analytics.logEvent('endless_game_over', {
      score: finalScore,
      level: finalLevel,
      new_high_score: newHighScore,
    });

    return { totalScore: finalScore, level: finalLevel, newHighScore };
  },

  retryEndless: async () => {
    const { endless } = get();
    if (!endless) return;
    // Restart with new seed
    await get().startEndless();
  },

  pauseEndless: async () => {
    const { endless, currentGame } = get();
    if (!endless || !currentGame) return;

    const pausedState: EndlessPausedState = {
      seed: endless.seed,
      currentLevel: endless.currentLevel,
      totalScore: endless.totalScore,
      highScore: endless.highScore,
      bestLevel: endless.bestLevel,
      currentPuzzleJson: JSON.stringify(endless.currentPuzzle),
      currentGameJson: JSON.stringify(currentGame),
    };
    await Storage.saveEndlessPausedState(pausedState);
    Analytics.logEvent('endless_pause', { level: endless.currentLevel });
  },

  resumeEndless: async () => {
    const paused = await Storage.getEndlessPausedState();
    if (!paused) return false;

    const currentPuzzle = JSON.parse(paused.currentPuzzleJson);
    const currentGame = JSON.parse(paused.currentGameJson) as GameState;

    set({
      mode: 'endless',
      endless: {
        seed: paused.seed,
        currentLevel: paused.currentLevel,
        totalScore: paused.totalScore,
        currentPuzzle,
        highScore: paused.highScore,
        bestLevel: paused.bestLevel,
        isGameOver: false,
        isGenerating: false,
      },
      currentGame,
      selectedPieceIndex: null,
    });

    await Storage.clearEndlessPausedState();
    Analytics.logEvent('endless_resume', { level: paused.currentLevel });
    return true;
  },
}));
