import { BOARD_SIZE, PuzzleLevel } from './types';

/**
 * Calculate star thresholds for a puzzle based on its pieces and board state.
 *
 * The thresholds scale with:
 * - Total piece cells (base score potential)
 * - Pre-filled board cells (line-clearing potential)
 *
 * Returns [twoStarThreshold, threeStarThreshold].
 */
export function getStarThresholds(puzzle: PuzzleLevel): [number, number] {
  const totalPieceCells = puzzle.pieces.reduce(
    (sum, p) => sum + p.shape.length,
    0,
  );

  let preFilledCells = 0;
  for (const row of puzzle.initialBoard) {
    for (const cell of row) {
      if (cell !== 0) preFilledCells++;
    }
  }

  // Base score = just placing pieces with no line clears
  const baseScore = totalPieceCells * 10;

  // Estimated line-clearing potential from board density
  const linesPossible = Math.max(
    1,
    Math.floor((preFilledCells + totalPieceCells) / BOARD_SIZE),
  );

  // 2 stars: at least some line clears
  const twoStar = baseScore + linesPossible * 50;

  // 3 stars: efficient play with combos / multi-line clears
  const threeStar = baseScore + linesPossible * 150;

  return [twoStar, threeStar];
}

/**
 * Calculate the star rating (1-3) for a completed puzzle.
 * 1 star = completed, 2 stars = good, 3 stars = excellent.
 */
export function calculateStarRating(
  score: number,
  puzzle: PuzzleLevel,
): number {
  const [twoStar, threeStar] = getStarThresholds(puzzle);
  if (score >= threeStar) return 3;
  if (score >= twoStar) return 2;
  return 1;
}
