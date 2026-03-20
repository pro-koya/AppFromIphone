import { create } from 'zustand';
import { GameState, PuzzleLevel, Piece } from '../game/types';
import { placePiece, hasAnyValidMove, createEmptyBoard } from '../game/board';
import { getPuzzlesForDate } from '../data/dailyPuzzles';
import { getTodayString } from '../utils/date';
import { Storage, DailyProgress } from '../utils/storage';
import { Analytics } from '../analytics';

interface DailyState {
  date: string;
  puzzles: PuzzleLevel[];
  currentPuzzleIndex: number;
  isDayComplete: boolean;
  totalDayScore: number;
  completedPuzzleIds: string[];
}

interface GameStore {
  // Daily state
  daily: DailyState | null;
  currentGame: GameState | null;
  selectedPieceIndex: number | null;
  streak: number;
  isLoading: boolean;

  // Actions
  loadDailyState: () => Promise<void>;
  startCurrentPuzzle: () => void;
  selectPiece: (index: number) => void;
  placePieceAt: (row: number, col: number) => void;
  useRevival: () => void;
  retryCurrentPuzzle: () => void;
  advanceToNextPuzzle: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  daily: null,
  currentGame: null,
  selectedPieceIndex: null,
  streak: 0,
  isLoading: true,

  loadDailyState: async () => {
    set({ isLoading: true });
    const today = getTodayString();
    const [savedProgress, streakData] = await Promise.all([
      Storage.getDailyProgress(today),
      Storage.getStreak(),
    ]);

    const puzzles = getPuzzlesForDate(today);

    let currentPuzzleIndex = savedProgress?.currentPuzzleIndex ?? 0;
    const completedPuzzleIds = savedProgress?.completedPuzzleIds ?? [];
    const isDayComplete = savedProgress?.isDayComplete ?? false;
    const totalDayScore = savedProgress?.totalScore ?? 0;

    // Clamp index to valid range
    if (currentPuzzleIndex >= puzzles.length) {
      currentPuzzleIndex = puzzles.length - 1;
    }

    const daily: DailyState = {
      date: today,
      puzzles,
      currentPuzzleIndex,
      isDayComplete,
      totalDayScore,
      completedPuzzleIds,
    };

    set({ daily, streak: streakData.currentStreak, isLoading: false });
  },

  startCurrentPuzzle: () => {
    const { daily } = get();
    if (!daily) return;

    const puzzle = daily.puzzles[daily.currentPuzzleIndex];
    if (!puzzle) return;

    const gameState: GameState = {
      board: puzzle.initialBoard.map(row => [...row]),
      pieces: [...puzzle.pieces],
      placedCount: 0,
      score: 0,
      linesCleared: 0,
      isComplete: false,
      isFailed: false,
      revivalUsed: false,
    };

    set({ currentGame: gameState, selectedPieceIndex: null });
    Analytics.logEvent('puzzle_start', {
      puzzle_id: puzzle.id,
      date: daily.date,
      order: puzzle.orderInDay,
    });
  },

  selectPiece: (index: number) => {
    const { currentGame } = get();
    if (!currentGame || currentGame.isComplete || currentGame.isFailed) return;
    if (index < 0 || index >= currentGame.pieces.length) return;
    set({ selectedPieceIndex: index });
  },

  placePieceAt: (row: number, col: number) => {
    const { currentGame, selectedPieceIndex, daily } = get();
    if (!currentGame || selectedPieceIndex === null) return;
    if (currentGame.isComplete || currentGame.isFailed) return;

    const piece = currentGame.pieces[selectedPieceIndex];
    if (!piece) return;

    const result = placePiece(currentGame.board, piece, row, col);
    if (!result.success) return;

    const remainingPieces = currentGame.pieces.filter((_, i) => i !== selectedPieceIndex);
    const newPlacedCount = currentGame.placedCount + 1;
    const newScore = currentGame.score + result.score;
    const newLinesCleared = currentGame.linesCleared + result.linesCleared;

    // Check completion: all pieces placed
    const isComplete = remainingPieces.length === 0;

    // Check failure: pieces remain but no valid move
    const isFailed = !isComplete && !hasAnyValidMove(result.board, remainingPieces);

    const newGame: GameState = {
      board: result.board,
      pieces: remainingPieces,
      placedCount: newPlacedCount,
      score: newScore,
      linesCleared: newLinesCleared,
      isComplete,
      isFailed,
      revivalUsed: currentGame.revivalUsed,
    };

    set({ currentGame: newGame, selectedPieceIndex: null });

    if (isComplete && daily) {
      Analytics.logEvent('puzzle_complete', {
        puzzle_id: daily.puzzles[daily.currentPuzzleIndex].id,
        score: newScore,
        lines_cleared: newLinesCleared,
      });
    } else if (isFailed && daily) {
      Analytics.logEvent('puzzle_fail', {
        puzzle_id: daily.puzzles[daily.currentPuzzleIndex].id,
        revival_used: currentGame.revivalUsed,
      });
    }
  },

  useRevival: () => {
    const { currentGame } = get();
    if (!currentGame || currentGame.revivalUsed) return;
    // Revival: remove the piece that has the most valid placements (most forgiving)
    // Simple heuristic: remove last piece (user likely got stuck on it)
    if (currentGame.pieces.length === 0) return;

    const updatedGame: GameState = {
      ...currentGame,
      pieces: currentGame.pieces.slice(0, -1), // remove last piece
      isFailed: false,
      revivalUsed: true,
    };

    // Re-check if now complete or still failed
    const isNowComplete = updatedGame.pieces.length === 0;
    const isNowFailed =
      !isNowComplete && !hasAnyValidMove(updatedGame.board, updatedGame.pieces);

    set({
      currentGame: { ...updatedGame, isComplete: isNowComplete, isFailed: isNowFailed },
      selectedPieceIndex: null,
    });

    Analytics.logEvent('revival_ad_watched', {});
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

    const updatedDaily: DailyState = {
      ...daily,
      currentPuzzleIndex: isDayComplete ? daily.currentPuzzleIndex : nextIndex,
      completedPuzzleIds: newCompletedIds,
      totalDayScore: newTotalScore,
      isDayComplete,
    };

    // Persist progress
    const progress: DailyProgress = {
      date: daily.date,
      completedPuzzleIds: newCompletedIds,
      currentPuzzleIndex: updatedDaily.currentPuzzleIndex,
      totalScore: newTotalScore,
      isDayComplete,
    };
    await Storage.saveDailyProgress(progress);

    if (isDayComplete) {
      await Storage.addClearHistory(daily.date);
      const streak = await Storage.updateStreak(daily.date);
      set({ daily: updatedDaily, currentGame: null, streak: streak.currentStreak });
      Analytics.logEvent('daily_complete', {
        date: daily.date,
        total_score: newTotalScore,
        streak: streak.currentStreak,
      });
    } else {
      set({ daily: updatedDaily, currentGame: null });
    }
  },
}));
