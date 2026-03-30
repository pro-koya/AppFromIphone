import { BOARD_SIZE, Board, Piece, PieceShape, PlacementResult } from './types';

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

/**
 * Check if a piece can be placed at (row, col) on the board.
 */
export function canPlace(board: Board, shape: PieceShape, row: number, col: number): boolean {
  for (const [dr, dc] of shape) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c] !== 0) return false;
  }
  return true;
}

/**
 * Place a piece on a cloned board. Returns new board or null if invalid.
 */
export function placePiece(
  board: Board,
  piece: Piece,
  row: number,
  col: number
): PlacementResult {
  if (!canPlace(board, piece.shape, row, col)) {
    // Check out-of-bounds
    for (const [dr, dc] of piece.shape) {
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
        return { success: false, reason: 'out_of_bounds' };
      }
    }
    return { success: false, reason: 'invalid_position' };
  }

  const newBoard = cloneBoard(board);
  for (const [dr, dc] of piece.shape) {
    newBoard[row + dr][col + dc] = piece.colorIndex;
  }

  const { board: clearedBoard, linesCleared, clearedRows, clearedCols } = clearLines(newBoard);
  const score = calculateScore(linesCleared, piece.shape.length);

  return { success: true, board: clearedBoard, linesCleared, score, clearedRows, clearedCols };
}

/**
 * Clear completed rows and columns. Returns new board and count cleared.
 */
export function clearLines(board: Board): { board: Board; linesCleared: number; clearedRows: number[]; clearedCols: number[] } {
  const newBoard = cloneBoard(board);
  let linesCleared = 0;

  // Find full rows
  const fullRows: number[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (newBoard[r].every(cell => cell !== 0)) {
      fullRows.push(r);
    }
  }

  // Find full columns
  const fullCols: number[] = [];
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (newBoard.every(row => row[c] !== 0)) {
      fullCols.push(c);
    }
  }

  // Clear full rows
  for (const r of fullRows) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      newBoard[r][c] = 0;
    }
    linesCleared++;
  }

  // Clear full columns
  for (const c of fullCols) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      newBoard[r][c] = 0;
    }
    linesCleared++;
  }

  return { board: newBoard, linesCleared, clearedRows: fullRows, clearedCols: fullCols };
}

function calculateScore(linesCleared: number, pieceSize: number): number {
  const baseScore = pieceSize * 10;
  const lineBonus = linesCleared * 100 * (linesCleared > 1 ? linesCleared : 1);
  return baseScore + lineBonus;
}

/**
 * Calculate score with combo multiplier for consecutive line clears.
 * Combo multiplier increases each consecutive placement that clears lines.
 * Max combo: x5 (capped).
 */
export function calculateScoreWithCombo(
  linesCleared: number,
  pieceSize: number,
  consecutiveClearCount: number,
): { score: number; comboMultiplier: number } {
  const baseScore = pieceSize * 10;
  const lineBonus = linesCleared * 100 * (linesCleared > 1 ? linesCleared : 1);
  const comboMultiplier = linesCleared > 0 ? Math.min(consecutiveClearCount, 5) : 0;
  const comboBonus = comboMultiplier > 1 ? Math.floor(lineBonus * (comboMultiplier - 1) * 0.5) : 0;
  return { score: baseScore + lineBonus + comboBonus, comboMultiplier };
}

/**
 * Check if any remaining piece can be placed anywhere on the board.
 */
export function hasAnyValidMove(board: Board, pieces: Piece[]): boolean {
  for (const piece of pieces) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canPlace(board, piece.shape, r, c)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Check if all pieces have been placed (puzzle complete).
 */
export function isPuzzleComplete(piecesRemaining: number): boolean {
  return piecesRemaining === 0;
}

/**
 * Check if the board is completely empty (all cells are 0).
 * Used as success condition: all target lines cleared = board empty.
 */
export function isBoardEmpty(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) return false;
    }
  }
  return true;
}
