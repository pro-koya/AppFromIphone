/**
 * useGameplay: Shared gameplay hook for GameScreen and EndlessGameScreen.
 *
 * Extracts all duplicated drag, animation, haptic, and placement logic
 * so both screens share a single source of truth.
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { View, Animated, Platform, Vibration } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { CELL_SIZE } from '../components/BoardView';
import { canPlace } from '../game/board';
import { BOARD_SIZE, Piece, PlacementAnimInfo } from '../game/types';
import { Storage } from '../utils/storage';
import { SoundManager } from '../audio/SoundManager';
import { AdManager } from '../ads/AdManager';
import { Colors } from '../theme';

const FINGER_OFFSET_Y = 60;
const BOARD_INTERNAL_PADDING = 2;

interface UseGameplayOptions {
  /** Current puzzle ID — used to detect puzzle changes and reset state */
  currentPuzzleId: string | null;
}

export function useGameplay({ currentPuzzleId }: UseGameplayOptions) {
  const currentGame = useGameStore(s => s.currentGame);
  const selectedPieceIndex = useGameStore(s => s.selectedPieceIndex);

  const [showResultModal, setShowResultModal] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const vibrationEnabled = useRef(true);

  // ─── Settings ───
  useEffect(() => {
    Storage.getSettings().then(s => {
      vibrationEnabled.current = s.vibrationEnabled;
      SoundManager.updateSettings(s);
    });
    SoundManager.loadSettings();
  }, []);

  // ─── Haptics ───
  const hapticLight = useCallback(() => {
    if (!vibrationEnabled.current) return;
    Vibration.vibrate(Platform.OS === 'ios' ? 10 : 20);
  }, []);
  const hapticMedium = useCallback(() => {
    if (!vibrationEnabled.current) return;
    Vibration.vibrate(Platform.OS === 'ios' ? 15 : 40);
  }, []);
  const hapticSuccess = useCallback(() => {
    if (!vibrationEnabled.current) return;
    Vibration.vibrate(Platform.OS === 'ios' ? [0, 10, 40, 10] : [0, 20, 60, 20]);
  }, []);
  const hapticCombo = useCallback((multiplier: number) => {
    if (!vibrationEnabled.current) return;
    // Escalating haptic intensity for combos
    const intensity = Math.min(multiplier, 5);
    const duration = Platform.OS === 'ios' ? 10 + intensity * 5 : 20 + intensity * 10;
    Vibration.vibrate(duration);
  }, []);

  // ─── Drag state ───
  const [draggingPieceIndex, setDraggingPieceIndex] = useState<number | null>(null);
  const [ghostCell, setGhostCell] = useState<{ row: number; col: number } | null>(null);
  const [isGhostValid, setIsGhostValid] = useState(false);
  const draggingPieceRef = useRef<number | null>(null);
  const currentGhostRef = useRef<{ row: number; col: number } | null>(null);

  // ─── Animation state ───
  const [placedCells, setPlacedCells] = useState<Set<string>>(new Set());
  const [clearedLines, setClearedLines] = useState<{ rows: number[]; cols: number[] }>({ rows: [], cols: [] });
  const [clearCellScales, setClearCellScales] = useState<Map<string, Animated.Value> | undefined>(undefined);
  const placementScale = useRef(new Animated.Value(1)).current;
  const clearFlash = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(0);

  // ─── Celebration ───
  const [showCelebration, setShowCelebration] = useState(false);

  // ─── Hint highlight state ───
  const [hintCells, setHintCells] = useState<Set<string> | null>(null);
  const hintPulse = useRef(new Animated.Value(0)).current;

  // ─── Score popup ───
  const [scorePopup, setScorePopup] = useState<{ value: number; key: number } | null>(null);
  const scorePopupOpacity = useRef(new Animated.Value(0)).current;
  const scorePopupY = useRef(new Animated.Value(0)).current;
  const scorePopupScale = useRef(new Animated.Value(1)).current;
  const popupKeyRef = useRef(0);

  // ─── Combo text ───
  const [comboText, setComboText] = useState<string | null>(null);
  const comboOpacity = useRef(new Animated.Value(0)).current;
  const comboScale = useRef(new Animated.Value(0.5)).current;

  // ─── Floating piece ───
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const dragOpacity = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  // ─── Board measurement ───
  const boardRef = useRef<View>(null);
  const boardPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // ─── Puzzle ID tracking ───
  const puzzleIdRef = useRef<string | null>(null);

  // ─── Reset all animation state ───
  const resetAnimState = useCallback(() => {
    setDraggingPieceIndex(null);
    setGhostCell(null);
    setIsGhostValid(false);
    setPlacedCells(new Set());
    setClearedLines({ rows: [], cols: [] });
    setClearCellScales(undefined);
    setScorePopup(null);
    setComboText(null);
    setHintCells(null);
    setShowCelebration(false);
    draggingPieceRef.current = null;
    currentGhostRef.current = null;
    dragOpacity.setValue(0);
    prevScore.current = 0;
  }, [dragOpacity]);

  // ─── Puzzle change → reset ───
  useEffect(() => {
    if (!currentPuzzleId) return;
    if (puzzleIdRef.current && puzzleIdRef.current !== currentPuzzleId) {
      resetAnimState();
      setShowResultModal(false);
      setTimeout(() => measureBoard(), 100);
    }
    puzzleIdRef.current = currentPuzzleId;
  }, [currentPuzzleId, resetAnimState]);

  // ─── Complete / fail detection ───
  useEffect(() => {
    if (currentGame?.isComplete || currentGame?.isFailed) {
      if (currentGame?.isComplete) {
        hapticSuccess();
        SoundManager.playSuccess();
        setShowCelebration(true);
      } else {
        SoundManager.playFail();
      }
      setShowResultModal(true);
    }
  }, [currentGame?.isComplete, currentGame?.isFailed, hapticSuccess]);

  // ─── Ad ready subscription ───
  useEffect(() => {
    return AdManager.onRewardedReadyChange(setAdReady);
  }, []);

  // ─── Score bounce ───
  useEffect(() => {
    if (currentGame && currentGame.score !== prevScore.current) {
      prevScore.current = currentGame.score;
      scoreScale.setValue(1.3);
      Animated.spring(scoreScale, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [currentGame?.score, scoreScale]);

  // ─── Board measure ───
  const measureBoard = useCallback(() => {
    boardRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0) {
        boardPos.current = { x, y, width, height };
      }
    });
  }, []);

  // ─── Piece geometry ───
  const getPieceBounds = useCallback((piece: Piece) => {
    const minR = Math.min(...piece.shape.map(([r]) => r));
    const minC = Math.min(...piece.shape.map(([, c]) => c));
    const maxR = Math.max(...piece.shape.map(([r]) => r));
    const maxC = Math.max(...piece.shape.map(([, c]) => c));
    const rows = maxR - minR + 1;
    const cols = maxC - minC + 1;
    return { minR, minC, rows, cols, pieceW: cols * CELL_SIZE, pieceH: rows * CELL_SIZE };
  }, []);

  const touchToFloatPos = useCallback((touchX: number, touchY: number, pieceW: number, pieceH: number) => ({
    x: touchX - pieceW / 2,
    y: touchY - FINGER_OFFSET_Y - pieceH / 2,
  }), []);

  const floatPosToGhostCell = useCallback((floatX: number, floatY: number): { row: number; col: number } | null => {
    const bp = boardPos.current;
    if (!bp.width) return null;
    const col = Math.round((floatX - bp.x - BOARD_INTERNAL_PADDING) / CELL_SIZE);
    const row = Math.round((floatY - bp.y - BOARD_INTERNAL_PADDING) / CELL_SIZE);
    if (row < -1 || row > BOARD_SIZE || col < -1 || col > BOARD_SIZE) return null;
    return { row, col };
  }, []);

  // ─── Score popup trigger ───
  const triggerScorePopup = useCallback((score: number, linesCleared: number, comboMultiplier: number) => {
    if (score <= 0) return;

    const key = ++popupKeyRef.current;
    setScorePopup({ value: score, key });
    scorePopupOpacity.setValue(1);
    scorePopupY.setValue(0);
    scorePopupScale.setValue(1.4);

    Animated.parallel([
      Animated.timing(scorePopupY, { toValue: -60, duration: 800, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scorePopupScale, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(scorePopupOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start(() => setScorePopup(null));

    // Combo text — show for consecutive clears (combo multiplier) or multi-line single clears
    if (comboMultiplier >= 2) {
      const text = comboMultiplier >= 5
        ? 'x5 MAX COMBO!'
        : `x${comboMultiplier} COMBO!`;
      setComboText(text);
      comboOpacity.setValue(1);
      comboScale.setValue(0.3);
      hapticCombo(comboMultiplier);

      Animated.sequence([
        Animated.spring(comboScale, { toValue: 1.1, tension: 300, friction: 8, useNativeDriver: true }),
        Animated.timing(comboScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.delay(600),
        Animated.timing(comboOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setComboText(null));
    } else if (linesCleared >= 2) {
      const texts = ['', '', 'DOUBLE!', 'TRIPLE!', 'QUAD!', 'AMAZING!'];
      const text = texts[Math.min(linesCleared, 5)];
      setComboText(text);
      comboOpacity.setValue(1);
      comboScale.setValue(0.3);

      Animated.sequence([
        Animated.spring(comboScale, { toValue: 1.1, tension: 300, friction: 8, useNativeDriver: true }),
        Animated.timing(comboScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.delay(600),
        Animated.timing(comboOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setComboText(null));
    }
  }, [scorePopupOpacity, scorePopupY, scorePopupScale, comboOpacity, comboScale, hapticCombo]);

  // ─── Placement animation ───
  const triggerPlacementAnim = useCallback((result: PlacementAnimInfo) => {
    hapticLight();
    SoundManager.playPlace();

    // Clear hint highlight on any placement
    setHintCells(null);

    const cellKeys = new Set(result.placedCells.map(([r, c]) => `${r},${c}`));
    setPlacedCells(cellKeys);
    placementScale.setValue(0.3);
    Animated.spring(placementScale, {
      toValue: 1,
      tension: 300,
      friction: 12,
      useNativeDriver: true,
    }).start(() => setPlacedCells(new Set()));

    triggerScorePopup(result.scoreGained, result.linesCleared, result.comboMultiplier);

    if (result.clearedRows.length > 0 || result.clearedCols.length > 0) {
      hapticMedium();
      SoundManager.playLineClear();

      const cellScaleMap = new Map<string, Animated.Value>();
      const animations: Animated.CompositeAnimation[] = [];
      const addedKeys = new Set<string>();

      for (const row of result.clearedRows) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const key = `${row},${c}`;
          if (!addedKeys.has(key)) {
            addedKeys.add(key);
            const scaleVal = new Animated.Value(1);
            cellScaleMap.set(key, scaleVal);
            animations.push(
              Animated.sequence([
                Animated.delay(c * 25),
                Animated.timing(scaleVal, { toValue: 1.15, duration: 80, useNativeDriver: true }),
                Animated.timing(scaleVal, { toValue: 0, duration: 200, useNativeDriver: true }),
              ])
            );
          }
        }
      }
      for (const col of result.clearedCols) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          const key = `${r},${col}`;
          if (!addedKeys.has(key)) {
            addedKeys.add(key);
            const scaleVal = new Animated.Value(1);
            cellScaleMap.set(key, scaleVal);
            animations.push(
              Animated.sequence([
                Animated.delay(r * 25),
                Animated.timing(scaleVal, { toValue: 1.15, duration: 80, useNativeDriver: true }),
                Animated.timing(scaleVal, { toValue: 0, duration: 200, useNativeDriver: true }),
              ])
            );
          }
        }
      }

      setClearedLines({ rows: result.clearedRows, cols: result.clearedCols });
      setClearCellScales(cellScaleMap);

      clearFlash.setValue(0.8);
      Animated.timing(clearFlash, { toValue: 0, duration: 300, useNativeDriver: true }).start();

      Animated.parallel(animations).start(() => {
        setClearedLines({ rows: [], cols: [] });
        setClearCellScales(undefined);
      });
    }
  }, [triggerScorePopup, hapticLight, hapticMedium, placementScale, clearFlash]);

  // ─── Hint highlight animation ───
  const showHint = useCallback((cells: [number, number][]) => {
    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
    setHintCells(cellSet);
    hintPulse.setValue(0);

    // Pulse animation: 3 cycles then fade
    Animated.sequence([
      Animated.timing(hintPulse, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(hintPulse, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      Animated.timing(hintPulse, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(hintPulse, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      Animated.timing(hintPulse, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(hintPulse, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setHintCells(null));
  }, [hintPulse]);

  // ─── Drag callbacks ───
  const handleDragStart = useCallback((pieceIndex: number, pageX: number, pageY: number) => {
    measureBoard();
    const game = useGameStore.getState().currentGame;
    if (!game || game.isComplete || game.isFailed) return;
    const piece = game.pieces[pieceIndex];
    if (!piece) return;

    draggingPieceRef.current = pieceIndex;
    setDraggingPieceIndex(pieceIndex);

    const { pieceW, pieceH } = getPieceBounds(piece);
    const pos = touchToFloatPos(pageX, pageY, pieceW, pieceH);
    dragX.setValue(pos.x);
    dragY.setValue(pos.y);
    dragOpacity.setValue(1);
    dragScale.setValue(0.85);
    Animated.spring(dragScale, {
      toValue: 1.05,
      tension: 300,
      friction: 15,
      useNativeDriver: true,
    }).start();
  }, [measureBoard, getPieceBounds, touchToFloatPos, dragX, dragY, dragOpacity, dragScale]);

  const handleDragMove = useCallback((pageX: number, pageY: number) => {
    const pieceIndex = draggingPieceRef.current;
    if (pieceIndex === null) return;
    const game = useGameStore.getState().currentGame;
    if (!game) return;
    const piece = game.pieces[pieceIndex];
    if (!piece) return;

    const { pieceW, pieceH } = getPieceBounds(piece);
    const pos = touchToFloatPos(pageX, pageY, pieceW, pieceH);
    dragX.setValue(pos.x);
    dragY.setValue(pos.y);

    const ghost = floatPosToGhostCell(pos.x, pos.y);
    const prev = currentGhostRef.current;
    if (ghost) {
      if (!prev || prev.row !== ghost.row || prev.col !== ghost.col) {
        currentGhostRef.current = ghost;
        const valid = canPlace(game.board, piece.shape, ghost.row, ghost.col);
        setGhostCell(ghost);
        setIsGhostValid(valid);
      }
    } else if (prev) {
      currentGhostRef.current = null;
      setGhostCell(null);
      setIsGhostValid(false);
    }
  }, [getPieceBounds, touchToFloatPos, floatPosToGhostCell, dragX, dragY]);

  const handleDragEnd = useCallback((pageX: number, pageY: number) => {
    const pieceIndex = draggingPieceRef.current;
    draggingPieceRef.current = null;
    currentGhostRef.current = null;

    if (pieceIndex === null) {
      setDraggingPieceIndex(null);
      setGhostCell(null);
      dragOpacity.setValue(0);
      return;
    }

    const game = useGameStore.getState().currentGame;
    if (!game) {
      setDraggingPieceIndex(null);
      setGhostCell(null);
      dragOpacity.setValue(0);
      return;
    }

    const piece = game.pieces[pieceIndex];
    if (!piece) {
      setDraggingPieceIndex(null);
      setGhostCell(null);
      dragOpacity.setValue(0);
      return;
    }

    const { pieceW, pieceH } = getPieceBounds(piece);
    const pos = touchToFloatPos(pageX, pageY, pieceW, pieceH);
    const ghost = floatPosToGhostCell(pos.x, pos.y);
    const isValid = ghost && canPlace(game.board, piece.shape, ghost.row, ghost.col);

    if (isValid && ghost) {
      const result = useGameStore.getState().placePieceByIndex(pieceIndex, ghost.row, ghost.col);
      const snapX = boardPos.current.x + BOARD_INTERNAL_PADDING + ghost.col * CELL_SIZE;
      const snapY = boardPos.current.y + BOARD_INTERNAL_PADDING + ghost.row * CELL_SIZE;

      Animated.parallel([
        Animated.timing(dragX, { toValue: snapX, duration: 80, useNativeDriver: true }),
        Animated.timing(dragY, { toValue: snapY, duration: 80, useNativeDriver: true }),
        Animated.timing(dragOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(dragScale, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();

      if (result) {
        triggerPlacementAnim(result);
      }
    } else {
      Animated.parallel([
        Animated.timing(dragOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.spring(dragScale, { toValue: 0.3, tension: 200, friction: 15, useNativeDriver: true }),
      ]).start();
    }

    setDraggingPieceIndex(null);
    setGhostCell(null);
    setIsGhostValid(false);
  }, [triggerPlacementAnim, getPieceBounds, touchToFloatPos, floatPosToGhostCell, dragX, dragY, dragOpacity, dragScale]);

  // ─── Tap-to-place ───
  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (selectedPieceIndex === null) return;
      const result = useGameStore.getState().placePieceByIndex(selectedPieceIndex, row, col);
      if (result) {
        triggerPlacementAnim(result);
      }
    },
    [selectedPieceIndex, triggerPlacementAnim]
  );

  // ─── Floating piece data for rendering ───
  const getFloatingPieceData = useCallback(() => {
    if (draggingPieceIndex === null || !currentGame) return null;
    const piece = currentGame.pieces[draggingPieceIndex];
    if (!piece) return null;

    const { minR, minC, rows, cols } = getPieceBounds(piece);
    const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (const [r, c] of piece.shape) {
      grid[r - minR][c - minC] = true;
    }
    const pieceColor = Colors.pieces[(piece.colorIndex - 1) % Colors.pieces.length] ?? Colors.pieces[0];
    return { grid, pieceColor };
  }, [draggingPieceIndex, currentGame, getPieceBounds]);

  return {
    // Modal
    showResultModal,
    setShowResultModal,
    adReady,

    // Drag
    draggingPieceIndex,
    ghostCell,
    isGhostValid,

    // Animation
    placedCells,
    placementScale,
    clearedLines,
    clearFlash,
    clearCellScales,
    scoreScale,

    // Hint
    hintCells,
    hintPulse,
    showHint,

    // Score popup
    scorePopup,
    scorePopupOpacity,
    scorePopupY,
    scorePopupScale,

    // Combo
    comboText,
    comboOpacity,
    comboScale,

    // Floating piece
    dragX,
    dragY,
    dragOpacity,
    dragScale,
    getFloatingPieceData,

    // Board
    boardRef,
    measureBoard,

    // Handlers
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleCellPress,
    resetAnimState,

    // Haptics
    hapticSuccess,

    // Celebration
    showCelebration,
  };
}
