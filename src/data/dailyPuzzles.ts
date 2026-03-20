import { PuzzleLevel, Piece, PieceShape } from '../game/types';
import { SHAPES } from '../game/pieces';
import { createEmptyBoard } from '../game/board';
import { BOARD_SIZE } from '../game/types';

// ---------------------------------------------------------------------------
// Hand-crafted puzzles (tutorial quality, first few days)
// ---------------------------------------------------------------------------

function boardWithCells(cells: Array<[number, number, number]>): number[][] {
  const board = createEmptyBoard();
  for (const [r, c, color] of cells) {
    board[r][c] = color;
  }
  return board;
}

const PUZZLE_DATABASE: Record<string, PuzzleLevel[]> = {
  '2026-03-20': [
    {
      id: 'p20260320-1',
      date: '2026-03-20',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 0, 1], [7, 1, 1], [7, 2, 1], [7, 3, 1], [7, 4, 1], [7, 5, 1], [7, 6, 1],
        [6, 0, 2], [6, 1, 2], [6, 2, 2], [6, 3, 2], [6, 4, 2], [6, 5, 2],
      ]),
      pieces: [
        { id: 'h1', shape: SHAPES.DOT, colorIndex: 1 },
        { id: 'h2', shape: SHAPES.H2, colorIndex: 2 },
      ],
    },
    {
      id: 'p20260320-2',
      date: '2026-03-20',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 1, 2], [7, 2, 2], [7, 3, 2], [7, 4, 2], [7, 5, 2],
        [6, 0, 3], [6, 1, 3], [6, 2, 3], [6, 3, 3], [6, 4, 3],
        [5, 0, 1], [5, 1, 1], [5, 2, 1], [5, 3, 1],
      ]),
      pieces: [
        { id: 'v1', shape: SHAPES.H2, colorIndex: 2 },
        { id: 'h4', shape: SHAPES.H3, colorIndex: 3 },
        { id: 'sq', shape: SHAPES.H4, colorIndex: 1 },
      ],
    },
    {
      id: 'p20260320-3',
      date: '2026-03-20',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 0, 4], [7, 1, 4], [7, 2, 4], [7, 3, 4],
        [6, 0, 5], [6, 1, 5], [6, 2, 5], [6, 3, 5], [6, 4, 5],
        [5, 0, 2], [5, 1, 2], [5, 2, 2], [5, 3, 2], [5, 4, 2], [5, 5, 2],
        [4, 0, 3], [4, 1, 3], [4, 2, 3], [4, 3, 3], [4, 4, 3], [4, 5, 3], [4, 6, 3],
      ]),
      pieces: [
        { id: 'h4a', shape: SHAPES.H4, colorIndex: 4 },
        { id: 'h3a', shape: SHAPES.H3, colorIndex: 5 },
        { id: 'h2a', shape: SHAPES.H2, colorIndex: 2 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 3 },
      ],
    },
  ],
  '2026-03-21': [
    {
      id: 'p20260321-1',
      date: '2026-03-21',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 0, 1], [7, 1, 1], [7, 2, 1], [7, 3, 1], [7, 4, 1], [7, 5, 1],
        [6, 0, 3], [6, 1, 3], [6, 2, 3], [6, 3, 3], [6, 4, 3], [6, 5, 3], [6, 6, 3],
      ]),
      pieces: [
        { id: 'h2a', shape: SHAPES.H2, colorIndex: 1 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 3 },
      ],
    },
    {
      id: 'p20260321-2',
      date: '2026-03-21',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 1, 2], [7, 2, 2], [7, 3, 2], [7, 4, 2], [7, 5, 2],
        [6, 0, 4], [6, 1, 4], [6, 2, 4], [6, 3, 4], [6, 4, 4],
        [5, 0, 1], [5, 1, 1], [5, 2, 1], [5, 3, 1],
      ]),
      pieces: [
        { id: 'h2', shape: SHAPES.H2, colorIndex: 2 },
        { id: 'h3', shape: SHAPES.H3, colorIndex: 4 },
        { id: 'h4', shape: SHAPES.H4, colorIndex: 1 },
      ],
    },
    {
      id: 'p20260321-3',
      date: '2026-03-21',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 0, 5], [7, 1, 5], [7, 2, 5], [7, 3, 5],
        [6, 0, 6], [6, 1, 6], [6, 2, 6], [6, 3, 6], [6, 4, 6],
        [5, 0, 3], [5, 1, 3], [5, 2, 3], [5, 3, 3], [5, 4, 3], [5, 5, 3],
        [4, 0, 2], [4, 1, 2], [4, 2, 2], [4, 3, 2], [4, 4, 2], [4, 5, 2], [4, 6, 2],
      ]),
      pieces: [
        { id: 'h4', shape: SHAPES.H4, colorIndex: 5 },
        { id: 'h3', shape: SHAPES.H3, colorIndex: 6 },
        { id: 'h2', shape: SHAPES.H2, colorIndex: 3 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 2 },
      ],
    },
  ],
  '2026-03-22': [
    {
      id: 'p20260322-1',
      date: '2026-03-22',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 2, 1], [7, 3, 1], [7, 4, 1], [7, 5, 1], [7, 6, 1], [7, 7, 1],
        [6, 4, 2], [6, 5, 2], [6, 6, 2], [6, 7, 2],
      ]),
      pieces: [
        { id: 'h2', shape: SHAPES.H2, colorIndex: 1 },
        { id: 'h4', shape: SHAPES.H4, colorIndex: 2 },
      ],
    },
    {
      id: 'p20260322-2',
      date: '2026-03-22',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 2, 3], [7, 3, 3], [7, 4, 3], [7, 5, 3], [7, 6, 3], [7, 7, 3],
        [6, 4, 4], [6, 5, 4], [6, 6, 4], [6, 7, 4],
        [5, 4, 5], [5, 5, 5], [5, 6, 5], [5, 7, 5],
      ]),
      pieces: [
        { id: 'h2', shape: SHAPES.H2, colorIndex: 3 },
        { id: 'h4a', shape: SHAPES.H4, colorIndex: 4 },
        { id: 'h4b', shape: SHAPES.H4, colorIndex: 5 },
      ],
    },
    {
      id: 'p20260322-3',
      date: '2026-03-22',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 1, 2], [7, 2, 2], [7, 3, 2],
        [6, 0, 3], [6, 1, 3], [6, 2, 3], [6, 3, 3], [6, 4, 3],
        [5, 0, 4], [5, 1, 4], [5, 2, 4], [5, 3, 4], [5, 4, 4], [5, 5, 4],
        [4, 0, 5], [4, 1, 5], [4, 2, 5], [4, 3, 5], [4, 4, 5], [4, 5, 5], [4, 6, 5],
      ]),
      pieces: [
        { id: 'h4', shape: SHAPES.H4, colorIndex: 2 },
        { id: 'h3', shape: SHAPES.H3, colorIndex: 3 },
        { id: 'h2', shape: SHAPES.H2, colorIndex: 4 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 5 },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Procedural puzzle generator
// ---------------------------------------------------------------------------

/**
 * Seeded xorshift32 RNG.
 * Same seed → same sequence, enabling deterministic daily puzzles.
 */
function seededRng(seed: number): () => number {
  let s = (seed === 0 ? 0xdeadbeef : seed) >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s = s >>> 0;
    return s / 0x100000000;
  };
}

function dateToSeed(dateStr: string): number {
  return dateStr
    .replace(/-/g, '')
    .split('')
    .reduce((acc, c, i) => ((acc * 31 + c.charCodeAt(0)) | 0) >>> 0, 0);
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Pattern definitions
//
// Each pattern specifies:
//   rowFills: rows to pre-fill (all cols EXCEPT gapCols are filled)
//   solutions: exact piece+position that fills those gaps
//
// Guarantee: placing each piece at its solution position fills all gaps,
// completing each targeted row → satisfying line clears.
// ---------------------------------------------------------------------------

interface RowFill {
  row: number;
  gapCols: number[];
}

interface PieceSolution {
  shapeName: string;
  solRow: number;
  solCol: number;
}

interface PuzzlePattern {
  rowFills: RowFill[];
  solutions: PieceSolution[];
}

// ---- EASY: 2 rows, 2 pieces, horizontal only ----
const EASY_PATTERNS: PuzzlePattern[] = [
  // E0: right-side staircase (H3 + H2)
  {
    rowFills: [
      { row: 7, gapCols: [5, 6, 7] },
      { row: 6, gapCols: [6, 7] },
    ],
    solutions: [
      { shapeName: 'H3', solRow: 7, solCol: 5 },
      { shapeName: 'H2', solRow: 6, solCol: 6 },
    ],
  },
  // E1: left-side staircase (H2 + H3)
  {
    rowFills: [
      { row: 7, gapCols: [0, 1] },
      { row: 6, gapCols: [0, 1, 2] },
    ],
    solutions: [
      { shapeName: 'H2', solRow: 7, solCol: 0 },
      { shapeName: 'H3', solRow: 6, solCol: 0 },
    ],
  },
  // E2: center staircase (H3 + H2)
  {
    rowFills: [
      { row: 7, gapCols: [3, 4, 5] },
      { row: 6, gapCols: [4, 5] },
    ],
    solutions: [
      { shapeName: 'H3', solRow: 7, solCol: 3 },
      { shapeName: 'H2', solRow: 6, solCol: 4 },
    ],
  },
  // E3: single + double (DOT + H2)
  {
    rowFills: [
      { row: 7, gapCols: [7] },
      { row: 6, gapCols: [6, 7] },
    ],
    solutions: [
      { shapeName: 'DOT', solRow: 7, solCol: 7 },
      { shapeName: 'H2', solRow: 6, solCol: 6 },
    ],
  },
  // E4: single left + triple right (DOT + H3)
  {
    rowFills: [
      { row: 7, gapCols: [0] },
      { row: 6, gapCols: [5, 6, 7] },
    ],
    solutions: [
      { shapeName: 'DOT', solRow: 7, solCol: 0 },
      { shapeName: 'H3', solRow: 6, solCol: 5 },
    ],
  },
  // E5: quadruple left + single right (H4 + DOT)
  {
    rowFills: [
      { row: 7, gapCols: [0, 1, 2, 3] },
      { row: 6, gapCols: [7] },
    ],
    solutions: [
      { shapeName: 'H4', solRow: 7, solCol: 0 },
      { shapeName: 'DOT', solRow: 6, solCol: 7 },
    ],
  },
];

// ---- MEDIUM: 3 rows, 3 pieces, introduces vertical pieces ----
const MEDIUM_PATTERNS: PuzzlePattern[] = [
  // M0: right staircase (H2 + H3 + H4)
  {
    rowFills: [
      { row: 7, gapCols: [6, 7] },
      { row: 6, gapCols: [5, 6, 7] },
      { row: 5, gapCols: [4, 5, 6, 7] },
    ],
    solutions: [
      { shapeName: 'H2', solRow: 7, solCol: 6 },
      { shapeName: 'H3', solRow: 6, solCol: 5 },
      { shapeName: 'H4', solRow: 5, solCol: 4 },
    ],
  },
  // M1: two V2 pieces bridging rows 6-7 (introduces vertical thinking)
  //   Gaps: rows 6-7 at cols 6-7 (2x2 area), row 5 at cols 5-7
  //   V2 at [6,6] fills [6,6][7,6]; V2 at [6,7] fills [6,7][7,7]; H3 fills row 5
  {
    rowFills: [
      { row: 7, gapCols: [6, 7] },
      { row: 6, gapCols: [6, 7] },
      { row: 5, gapCols: [5, 6, 7] },
    ],
    solutions: [
      { shapeName: 'V2', solRow: 6, solCol: 6 },
      { shapeName: 'V2', solRow: 6, solCol: 7 },
      { shapeName: 'H3', solRow: 5, solCol: 5 },
    ],
  },
  // M2: left staircase (H2 + H3 + H4)
  {
    rowFills: [
      { row: 7, gapCols: [0, 1] },
      { row: 6, gapCols: [0, 1, 2] },
      { row: 5, gapCols: [0, 1, 2, 3] },
    ],
    solutions: [
      { shapeName: 'H2', solRow: 7, solCol: 0 },
      { shapeName: 'H3', solRow: 6, solCol: 0 },
      { shapeName: 'H4', solRow: 5, solCol: 0 },
    ],
  },
  // M3: center staircase (H2 + H3 + H4)
  {
    rowFills: [
      { row: 7, gapCols: [3, 4] },
      { row: 6, gapCols: [2, 3, 4] },
      { row: 5, gapCols: [1, 2, 3, 4] },
    ],
    solutions: [
      { shapeName: 'H2', solRow: 7, solCol: 3 },
      { shapeName: 'H3', solRow: 6, solCol: 2 },
      { shapeName: 'H4', solRow: 5, solCol: 1 },
    ],
  },
  // M4: diagonal (DOT + H2 + H3)
  {
    rowFills: [
      { row: 7, gapCols: [7] },
      { row: 6, gapCols: [6, 7] },
      { row: 5, gapCols: [5, 6, 7] },
    ],
    solutions: [
      { shapeName: 'DOT', solRow: 7, solCol: 7 },
      { shapeName: 'H2', solRow: 6, solCol: 6 },
      { shapeName: 'H3', solRow: 5, solCol: 5 },
    ],
  },
  // M5: left diagonal (DOT + H2 + H3)
  {
    rowFills: [
      { row: 7, gapCols: [0] },
      { row: 6, gapCols: [0, 1] },
      { row: 5, gapCols: [0, 1, 2] },
    ],
    solutions: [
      { shapeName: 'DOT', solRow: 7, solCol: 0 },
      { shapeName: 'H2', solRow: 6, solCol: 0 },
      { shapeName: 'H3', solRow: 5, solCol: 0 },
    ],
  },
];

// ---- HARD: 4 rows, 3-4 pieces, includes SQ2x2 and larger shapes ----
const HARD_PATTERNS: PuzzlePattern[] = [
  // H0: 4-row right staircase (H4 + H3 + H2 + DOT)
  {
    rowFills: [
      { row: 7, gapCols: [4, 5, 6, 7] },
      { row: 6, gapCols: [5, 6, 7] },
      { row: 5, gapCols: [6, 7] },
      { row: 4, gapCols: [7] },
    ],
    solutions: [
      { shapeName: 'H4', solRow: 7, solCol: 4 },
      { shapeName: 'H3', solRow: 6, solCol: 5 },
      { shapeName: 'H2', solRow: 5, solCol: 6 },
      { shapeName: 'DOT', solRow: 4, solCol: 7 },
    ],
  },
  // H1: SQ2x2 + H3 + H4 (3 pieces, 4 rows)
  //   SQ at [6,0] fills [6,0][6,1][7,0][7,1]; H3 fills row5; H4 fills row4
  {
    rowFills: [
      { row: 7, gapCols: [0, 1] },
      { row: 6, gapCols: [0, 1] },
      { row: 5, gapCols: [5, 6, 7] },
      { row: 4, gapCols: [4, 5, 6, 7] },
    ],
    solutions: [
      { shapeName: 'SQ2x2', solRow: 6, solCol: 0 },
      { shapeName: 'H3', solRow: 5, solCol: 5 },
      { shapeName: 'H4', solRow: 4, solCol: 4 },
    ],
  },
  // H2: 4-row left staircase (DOT + H2 + H3 + H4)
  {
    rowFills: [
      { row: 7, gapCols: [0] },
      { row: 6, gapCols: [0, 1] },
      { row: 5, gapCols: [0, 1, 2] },
      { row: 4, gapCols: [0, 1, 2, 3] },
    ],
    solutions: [
      { shapeName: 'DOT', solRow: 7, solCol: 0 },
      { shapeName: 'H2', solRow: 6, solCol: 0 },
      { shapeName: 'H3', solRow: 5, solCol: 0 },
      { shapeName: 'H4', solRow: 4, solCol: 0 },
    ],
  },
  // H3: right staircase 3 rows (H4 + H3 + H2)
  {
    rowFills: [
      { row: 7, gapCols: [4, 5, 6, 7] },
      { row: 6, gapCols: [5, 6, 7] },
      { row: 5, gapCols: [6, 7] },
    ],
    solutions: [
      { shapeName: 'H4', solRow: 7, solCol: 4 },
      { shapeName: 'H3', solRow: 6, solCol: 5 },
      { shapeName: 'H2', solRow: 5, solCol: 6 },
    ],
  },
  // H4: SQ2x2 right + H4 left (2 pieces, 3 rows, needs spatial thinking)
  //   SQ at [6,6] fills [6,6][6,7][7,6][7,7]; H4 fills row5 left side
  {
    rowFills: [
      { row: 7, gapCols: [6, 7] },
      { row: 6, gapCols: [6, 7] },
      { row: 5, gapCols: [0, 1, 2, 3] },
    ],
    solutions: [
      { shapeName: 'SQ2x2', solRow: 6, solCol: 6 },
      { shapeName: 'H4', solRow: 5, solCol: 0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Core generator
// ---------------------------------------------------------------------------

function buildPuzzleFromPattern(
  dateStr: string,
  order: 1 | 2 | 3,
  pattern: PuzzlePattern,
  rng: () => number
): PuzzleLevel {
  // Pick colors: shuffle palette so each day looks different
  const colorPool = [1, 2, 3, 4, 5, 6, 7];
  const colors = shuffleArray(colorPool, rng);

  // Build board: fill target rows, leave gaps
  const board = createEmptyBoard();
  pattern.rowFills.forEach((rowFill, i) => {
    const rowColor = colors[i % colors.length];
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!rowFill.gapCols.includes(c)) {
        board[rowFill.row][c] = rowColor;
      }
    }
  });

  // Build pieces (color independent of row — visual richness)
  const pieceColorOffset = pattern.rowFills.length;
  const pieces: Piece[] = pattern.solutions.map((sol, i) => ({
    id: `gen-${dateStr}-${order}-${i}`,
    shape: SHAPES[sol.shapeName as keyof typeof SHAPES],
    colorIndex: colors[(pieceColorOffset + i) % colors.length],
  }));

  // Shuffle piece order so the "hint" from shape matching is less obvious
  const shuffledPieces = shuffleArray(pieces, rng);

  return {
    id: `gen-${dateStr}-${order}`,
    date: dateStr,
    orderInDay: order,
    initialBoard: board,
    pieces: shuffledPieces,
  };
}

function generateFallbackPuzzles(dateStr: string): PuzzleLevel[] {
  const seed = dateToSeed(dateStr);

  // Each order uses an independent RNG stream
  const rng1 = seededRng(seed);
  const rng2 = seededRng(seed ^ 0x12345678);
  const rng3 = seededRng(seed ^ 0x87654321);

  const allPatterns = [EASY_PATTERNS, MEDIUM_PATTERNS, HARD_PATTERNS];
  const rngs = [rng1, rng2, rng3];

  return ([1, 2, 3] as const).map((order, i) => {
    const patterns = allPatterns[i];
    const rng = rngs[i];
    const pattern = patterns[Math.floor(rng() * patterns.length)];
    return buildPuzzleFromPattern(dateStr, order, pattern, rng);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getPuzzlesForDate(dateStr: string): PuzzleLevel[] {
  return PUZZLE_DATABASE[dateStr] ?? generateFallbackPuzzles(dateStr);
}
