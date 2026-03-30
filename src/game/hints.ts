/**
 * Hint system: find the best placement for the current board state.
 *
 * Uses a 1-depth lookahead: for each piece at each valid position,
 * simulate placement + line clear, score by lines cleared then board openness.
 */

import { Board, Piece, BOARD_SIZE } from './types';
import { canPlace, placePiece } from './board';

interface PlacementCandidate {
  pieceIndex: number;
  row: number;
  col: number;
  score: number;
}

/**
 * Count empty cells on the board (more empty = more open = better).
 */
function countEmptyCells(board: Board): number {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) count++;
    }
  }
  return count;
}

/**
 * Find the best placement among all remaining pieces.
 * Returns the piece index and target cell, or null if no valid move exists.
 */
export function findBestPlacement(
  board: Board,
  pieces: Piece[],
): { pieceIndex: number; row: number; col: number } | null {
  let best: PlacementCandidate | null = null;

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!canPlace(board, piece.shape, r, c)) continue;

        const result = placePiece(board, piece, r, c);
        if (!result.success) continue;

        // Score: prioritize line clears, then board openness
        const linesWeight = result.linesCleared * 1000;
        const opennessWeight = countEmptyCells(result.board);
        const candidateScore = linesWeight + opennessWeight;

        if (!best || candidateScore > best.score) {
          best = { pieceIndex: i, row: r, col: c, score: candidateScore };
        }
      }
    }
  }

  return best ? { pieceIndex: best.pieceIndex, row: best.row, col: best.col } : null;
}

/**
 * Get the cells that would be occupied by placing a piece at (row, col).
 */
export function getPlacementCells(piece: Piece, row: number, col: number): [number, number][] {
  return piece.shape.map(([dr, dc]) => [row + dr, col + dc]);
}
