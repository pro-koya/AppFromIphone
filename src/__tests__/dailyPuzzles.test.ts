import { getPuzzlesForDate, generateEndlessPuzzle } from '../data/dailyPuzzles';
import { canPlace, isBoardEmpty } from '../game/board';
import { BOARD_SIZE, Piece } from '../game/types';

// ---------------------------------------------------------------------------
// Helper: brute-force DFS solver (verifies puzzle is solvable to empty board)
// ---------------------------------------------------------------------------
function isSolvable(board: number[][], pieces: Piece[]): boolean {
  if (pieces.length === 0) {
    return board.every(row => row.every(cell => cell === 0));
  }

  for (let pi = 0; pi < pieces.length; pi++) {
    const piece = pieces[pi];
    const remaining = pieces.filter((_, i) => i !== pi);

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!canPlace(board, piece.shape, r, c)) continue;

        // Place piece
        const newBoard = board.map(row => [...row]);
        for (const [dr, dc] of piece.shape) {
          newBoard[r + dr][c + dc] = piece.colorIndex;
        }

        // Clear lines (same logic as game)
        const fullRows: number[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
          if (newBoard[row].every(cell => cell !== 0)) fullRows.push(row);
        }
        const fullCols: number[] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (newBoard.every(row => row[col] !== 0)) fullCols.push(col);
        }
        for (const row of fullRows) {
          for (let col = 0; col < BOARD_SIZE; col++) newBoard[row][col] = 0;
        }
        for (const col of fullCols) {
          for (let row = 0; row < BOARD_SIZE; row++) newBoard[row][col] = 0;
        }

        if (isSolvable(newBoard, remaining)) return true;
      }
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Hand-crafted puzzle tests
// ---------------------------------------------------------------------------
describe('getPuzzlesForDate — hand-crafted puzzles', () => {
  const handCraftedDates = [
    '2026-03-20', '2026-03-21', '2026-03-22',
    '2026-03-23', '2026-03-24', '2026-03-25',
    '2026-03-26', '2026-03-27', '2026-03-28', '2026-03-29',
  ];

  for (const date of handCraftedDates) {
    describe(`date ${date}`, () => {
      const puzzles = getPuzzlesForDate(date);

      it('returns exactly 3 puzzles', () => {
        expect(puzzles).toHaveLength(3);
      });

      it('has correct date and orderInDay', () => {
        puzzles.forEach((p, i) => {
          expect(p.date).toBe(date);
          expect(p.orderInDay).toBe(i + 1);
        });
      });

      it('has valid board dimensions', () => {
        for (const p of puzzles) {
          expect(p.initialBoard).toHaveLength(8);
          for (const row of p.initialBoard) {
            expect(row).toHaveLength(8);
          }
        }
      });

      it('has at least 1 piece per puzzle', () => {
        for (const p of puzzles) {
          expect(p.pieces.length).toBeGreaterThanOrEqual(1);
        }
      });

      it('has unique piece IDs within each puzzle', () => {
        for (const p of puzzles) {
          const ids = p.pieces.map(piece => piece.id);
          expect(new Set(ids).size).toBe(ids.length);
        }
      });

      it('all pieces use valid color indices (1-7)', () => {
        for (const p of puzzles) {
          for (const piece of p.pieces) {
            expect(piece.colorIndex).toBeGreaterThanOrEqual(1);
            expect(piece.colorIndex).toBeLessThanOrEqual(7);
          }
        }
      });

      it('is solvable (board becomes empty)', () => {
        for (const p of puzzles) {
          const board = p.initialBoard.map(row => [...row]);
          expect(isSolvable(board, p.pieces)).toBe(true);
        }
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Procedural puzzle generation tests
// ---------------------------------------------------------------------------
describe('getPuzzlesForDate — procedural generation', () => {
  const proceduralDates = ['2026-04-01', '2026-04-15', '2026-05-01'];

  for (const date of proceduralDates) {
    describe(`date ${date}`, () => {
      const puzzles = getPuzzlesForDate(date);

      it('returns exactly 3 puzzles', () => {
        expect(puzzles).toHaveLength(3);
      });

      it('has valid board dimensions', () => {
        for (const p of puzzles) {
          expect(p.initialBoard).toHaveLength(8);
          for (const row of p.initialBoard) {
            expect(row).toHaveLength(8);
          }
        }
      });

      it('has at least 1 piece per puzzle', () => {
        for (const p of puzzles) {
          expect(p.pieces.length).toBeGreaterThanOrEqual(1);
        }
      });
    });
  }

  it('produces deterministic results for the same date', () => {
    const a = getPuzzlesForDate('2026-06-15');
    const b = getPuzzlesForDate('2026-06-15');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces different results for different dates', () => {
    const a = getPuzzlesForDate('2026-06-15');
    const b = getPuzzlesForDate('2026-06-16');
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------------
// Endless mode tests
// ---------------------------------------------------------------------------
describe('generateEndlessPuzzle', () => {
  it('generates a valid puzzle for level 1', () => {
    const puzzle = generateEndlessPuzzle(1, 12345);
    expect(puzzle.initialBoard).toHaveLength(8);
    expect(puzzle.pieces.length).toBeGreaterThanOrEqual(1);
    expect(puzzle.date).toBe('endless');
  });

  it('generates puzzles for high levels without throwing', () => {
    for (const level of [5, 10, 20, 30, 50]) {
      const puzzle = generateEndlessPuzzle(level, 99999);
      expect(puzzle.initialBoard).toHaveLength(8);
      expect(puzzle.pieces.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('is deterministic for same seed and level', () => {
    const a = generateEndlessPuzzle(3, 42);
    const b = generateEndlessPuzzle(3, 42);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces different puzzles for different seeds', () => {
    const a = generateEndlessPuzzle(3, 42);
    const b = generateEndlessPuzzle(3, 999);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('produces different puzzles for different levels', () => {
    const a = generateEndlessPuzzle(1, 42);
    const b = generateEndlessPuzzle(5, 42);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('increases piece count with difficulty', () => {
    const easy = generateEndlessPuzzle(1, 100);
    const hard = generateEndlessPuzzle(10, 100);
    expect(hard.pieces.length).toBeGreaterThanOrEqual(easy.pieces.length);
  });
});
