export const BOARD_SIZE = 8;

// A single cell on the board: 0 = empty, colorIndex = filled (1-based)
export type Board = number[][];

// A piece shape: array of [row, col] offsets from origin
export type PieceShape = [number, number][];

export interface Piece {
  id: string;
  shape: PieceShape;
  colorIndex: number;
}

export interface PuzzleLevel {
  id: string;
  date: string; // YYYY-MM-DD
  orderInDay: number; // 1, 2, or 3
  initialBoard: Board;
  pieces: Piece[];
  title?: string;
}

export type PlacementResult =
  | { success: true; board: Board; linesCleared: number; score: number }
  | { success: false; reason: 'invalid_position' | 'out_of_bounds' };

export interface GameState {
  board: Board;
  pieces: Piece[]; // remaining pieces to place
  placedCount: number;
  score: number;
  linesCleared: number;
  isComplete: boolean;
  isFailed: boolean;
  revivalUsed: boolean;
}
