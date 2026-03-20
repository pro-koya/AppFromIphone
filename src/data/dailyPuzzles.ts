import { PuzzleLevel } from '../game/types';
import { SHAPES } from '../game/pieces';
import { createEmptyBoard } from '../game/board';
import { BOARD_SIZE } from '../game/types';

// Helper: create a board with some cells pre-filled
function boardWithCells(cells: Array<[number, number, number]>): number[][] {
  const board = createEmptyBoard();
  for (const [r, c, color] of cells) {
    board[r][c] = color;
  }
  return board;
}

/**
 * Daily puzzle set.
 * Key: YYYY-MM-DD, Value: array of PuzzleLevel (1-3 per day)
 *
 * Design principle:
 * - Day 1-7: Tutorial difficulty (2-3 pieces, simple shapes, partial board)
 * - Day 8+: Gradually increase difficulty
 * - Always end with a satisfying line clear
 */
const PUZZLE_DATABASE: Record<string, PuzzleLevel[]> = {
  // --- DAY 1 (Tutorial-level) ---
  '2026-03-20': [
    {
      id: 'p20260320-1',
      date: '2026-03-20',
      orderInDay: 1,
      initialBoard: boardWithCells([
        // Bottom rows mostly filled - player needs to complete them
        [7, 0, 1], [7, 1, 1], [7, 2, 1], [7, 3, 1], [7, 4, 1], [7, 5, 1], [7, 6, 1],
        [6, 0, 2], [6, 1, 2], [6, 2, 2], [6, 3, 2], [6, 4, 2], [6, 5, 2],
        [5, 0, 3], [5, 1, 3], [5, 2, 3], [5, 3, 3], [5, 4, 3],
      ]),
      pieces: [
        { id: 'h1', shape: SHAPES.DOT, colorIndex: 1 },
        { id: 'h2', shape: SHAPES.H2, colorIndex: 2 },
        { id: 'h3', shape: SHAPES.H3, colorIndex: 3 },
      ],
    },
    {
      id: 'p20260320-2',
      date: '2026-03-20',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 1, 2], [7, 2, 2], [7, 3, 2], [7, 4, 2], [7, 5, 2], [7, 6, 2],
        [6, 0, 3], [6, 1, 3], [6, 2, 3], [6, 3, 3], [6, 4, 3], [6, 5, 3],
        [5, 0, 1], [5, 1, 1], [5, 2, 1], [5, 3, 1],
        [4, 0, 4], [4, 1, 4], [4, 2, 4],
        [3, 0, 5], [3, 1, 5],
      ]),
      pieces: [
        { id: 'v1', shape: SHAPES.V2, colorIndex: 4 },
        { id: 'h4', shape: SHAPES.H4, colorIndex: 1 },
        { id: 'sq', shape: SHAPES.SQ2x2, colorIndex: 2 },
      ],
    },
    {
      id: 'p20260320-3',
      date: '2026-03-20',
      orderInDay: 3,
      initialBoard: boardWithCells([
        // Right column mostly filled
        [0, 7, 1], [1, 7, 1], [2, 7, 1], [3, 7, 1], [4, 7, 1], [5, 7, 1], [6, 7, 1],
        [0, 6, 2], [1, 6, 2], [2, 6, 2], [3, 6, 2], [4, 6, 2], [5, 6, 2],
        [0, 5, 3], [1, 5, 3], [2, 5, 3], [3, 5, 3],
      ]),
      pieces: [
        { id: 'v3', shape: SHAPES.V3, colorIndex: 3 },
        { id: 'dot1', shape: SHAPES.DOT, colorIndex: 2 },
        { id: 'dot2', shape: SHAPES.DOT, colorIndex: 1 },
      ],
    },
  ],

  // --- DAY 2 ---
  '2026-03-21': [
    {
      id: 'p20260321-1',
      date: '2026-03-21',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 0, 1], [7, 1, 1], [7, 2, 1], [7, 3, 1], [7, 4, 1], [7, 5, 1],
        [6, 0, 2], [6, 1, 2], [6, 2, 2], [6, 3, 2], [6, 4, 2],
        [5, 0, 3], [5, 1, 3], [5, 2, 3],
      ]),
      pieces: [
        { id: 'l4', shape: SHAPES.L4, colorIndex: 4 },
        { id: 'h2', shape: SHAPES.H2, colorIndex: 1 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 2 },
      ],
    },
    {
      id: 'p20260321-2',
      date: '2026-03-21',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 0, 1], [7, 1, 1], [7, 2, 1], [7, 3, 1], [7, 4, 1], [7, 5, 1], [7, 7, 1],
        [6, 0, 2], [6, 1, 2], [6, 2, 2], [6, 3, 2], [6, 4, 2], [6, 6, 2], [6, 7, 2],
        [5, 0, 3], [5, 1, 3], [5, 2, 3], [5, 3, 3],
      ]),
      pieces: [
        { id: 't3', shape: SHAPES.T3, colorIndex: 5 },
        { id: 'v2', shape: SHAPES.V2, colorIndex: 3 },
        { id: 'h2b', shape: SHAPES.H2, colorIndex: 2 },
      ],
    },
  ],

  // --- DAY 3 ---
  '2026-03-22': [
    {
      id: 'p20260322-1',
      date: '2026-03-22',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 0, 4], [7, 1, 4], [7, 2, 4], [7, 3, 4], [7, 4, 4], [7, 5, 4], [7, 6, 4],
        [6, 0, 5], [6, 1, 5], [6, 2, 5], [6, 3, 5], [6, 4, 5], [6, 5, 5], [6, 6, 5],
        [5, 0, 1], [5, 1, 1], [5, 2, 1], [5, 3, 1], [5, 4, 1], [5, 5, 1],
      ]),
      pieces: [
        { id: 'plus', shape: SHAPES.PLUS, colorIndex: 2 },
        { id: 'h2c', shape: SHAPES.H2, colorIndex: 4 },
        { id: 'v2c', shape: SHAPES.V2, colorIndex: 5 },
      ],
    },
    {
      id: 'p20260322-2',
      date: '2026-03-22',
      orderInDay: 2,
      initialBoard: boardWithCells([
        // Cross pattern to clear
        [3, 0, 1], [3, 1, 1], [3, 2, 1], [3, 4, 1], [3, 5, 1], [3, 6, 1], [3, 7, 1],
        [0, 3, 2], [1, 3, 2], [2, 3, 2], [4, 3, 2], [5, 3, 2], [6, 3, 2], [7, 3, 2],
      ]),
      pieces: [
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 3 },
        { id: 'dot2', shape: SHAPES.DOT, colorIndex: 4 },
      ],
    },
    {
      id: 'p20260322-3',
      date: '2026-03-22',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 1, 2], [7, 2, 2], [7, 3, 2], [7, 5, 2], [7, 6, 2], [7, 7, 2],
        [6, 0, 3], [6, 1, 3], [6, 2, 3], [6, 4, 3], [6, 5, 3], [6, 6, 3], [6, 7, 3],
        [5, 0, 4], [5, 1, 4], [5, 2, 4], [5, 3, 4], [5, 4, 4], [5, 5, 4], [5, 6, 4],
      ]),
      pieces: [
        { id: 'v2d', shape: SHAPES.V2, colorIndex: 2 },
        { id: 'v2e', shape: SHAPES.V2, colorIndex: 3 },
        { id: 'h2d', shape: SHAPES.H2, colorIndex: 4 },
      ],
    },
  ],
};

/**
 * Get puzzles for a given date. Falls back to a generated set if date not found.
 */
export function getPuzzlesForDate(dateStr: string): PuzzleLevel[] {
  if (PUZZLE_DATABASE[dateStr]) {
    return PUZZLE_DATABASE[dateStr];
  }
  // Fallback: generate simple puzzles from date hash
  return generateFallbackPuzzles(dateStr);
}

/**
 * Deterministic fallback puzzle generator based on date string.
 * Always produces 2 solvable puzzles using simple shapes.
 */
function generateFallbackPuzzles(dateStr: string): PuzzleLevel[] {
  const hash = dateStr.replace(/-/g, '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colorA = (hash % 6) + 1;
  const colorB = ((hash + 2) % 6) + 1;
  const colorC = ((hash + 4) % 6) + 1;

  const board1 = createEmptyBoard();
  // Pre-fill bottom 2 rows partially
  for (let c = 0; c < 6; c++) board1[7][c] = colorA;
  for (let c = 0; c < 5; c++) board1[6][c] = colorB;
  for (let c = 0; c < 4; c++) board1[5][c] = colorC;

  const board2 = createEmptyBoard();
  for (let c = 0; c < 7; c++) board2[7][c] = colorA;
  for (let c = 0; c < 6; c++) board2[6][c] = colorB;
  for (let c = 0; c < 5; c++) board2[5][c] = colorC;
  for (let c = 0; c < 3; c++) board2[4][c] = colorA;

  return [
    {
      id: `fallback-${dateStr}-1`,
      date: dateStr,
      orderInDay: 1,
      initialBoard: board1,
      pieces: [
        { id: 'fb-h2', shape: SHAPES.H2, colorIndex: colorA },
        { id: 'fb-h3', shape: SHAPES.H3, colorIndex: colorB },
        { id: 'fb-v2', shape: SHAPES.V2, colorIndex: colorC },
      ],
    },
    {
      id: `fallback-${dateStr}-2`,
      date: dateStr,
      orderInDay: 2,
      initialBoard: board2,
      pieces: [
        { id: 'fb2-h1', shape: SHAPES.DOT, colorIndex: colorA },
        { id: 'fb2-h3', shape: SHAPES.H3, colorIndex: colorB },
        { id: 'fb2-sq', shape: SHAPES.SQ2x2, colorIndex: colorC },
      ],
    },
  ];
}
