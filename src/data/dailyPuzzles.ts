import { PuzzleLevel, Piece, PieceShape, BOARD_SIZE } from '../game/types';
import { SHAPES } from '../game/pieces';
import { createEmptyBoard, canPlace } from '../game/board';

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
  // --- Day 4: Vertical pieces (V2, V4) ---
  '2026-03-23': [
    {
      id: 'p20260323-1',
      date: '2026-03-23',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 0, 1], [7, 1, 1], [7, 2, 1], [7, 3, 1], [7, 4, 1], [7, 5, 1],
        [6, 0, 2], [6, 1, 2], [6, 2, 2], [6, 3, 2], [6, 4, 2], [6, 5, 2], [6, 6, 2],
      ]),
      pieces: [
        { id: 'v2a', shape: SHAPES.V2, colorIndex: 2 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 1 },
      ],
    },
    {
      id: 'p20260323-2',
      date: '2026-03-23',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 0, 3], [7, 1, 3], [7, 2, 3], [7, 3, 3],
        [6, 0, 4], [6, 1, 4], [6, 2, 4], [6, 3, 4], [6, 4, 4], [6, 5, 4],
        [5, 0, 5], [5, 1, 5], [5, 2, 5], [5, 3, 5], [5, 4, 5], [5, 5, 5], [5, 6, 5],
      ]),
      pieces: [
        { id: 'v2a', shape: SHAPES.V2, colorIndex: 5 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 4 },
        { id: 'h4a', shape: SHAPES.H4, colorIndex: 3 },
      ],
    },
    {
      id: 'p20260323-3',
      date: '2026-03-23',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 1, 2], [7, 2, 2],
        [6, 0, 3], [6, 1, 3], [6, 2, 3], [6, 3, 3], [6, 4, 3],
        [5, 0, 4], [5, 1, 4], [5, 2, 4], [5, 3, 4], [5, 4, 4], [5, 5, 4],
        [4, 0, 5], [4, 1, 5], [4, 2, 5], [4, 3, 5], [4, 4, 5], [4, 5, 5], [4, 6, 5],
      ]),
      pieces: [
        { id: 'v4a', shape: SHAPES.V4, colorIndex: 5 },
        { id: 'v2a', shape: SHAPES.V2, colorIndex: 4 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 3 },
        { id: 'h4a', shape: SHAPES.H4, colorIndex: 2 },
      ],
    },
  ],
  // --- Day 5: Left-side gaps ---
  '2026-03-24': [
    {
      id: 'p20260324-1',
      date: '2026-03-24',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 2, 1], [7, 3, 1], [7, 4, 1], [7, 5, 1], [7, 6, 1], [7, 7, 1],
        [6, 1, 2], [6, 2, 2], [6, 3, 2], [6, 4, 2], [6, 5, 2], [6, 6, 2], [6, 7, 2],
      ]),
      pieces: [
        { id: 'v2a', shape: SHAPES.V2, colorIndex: 2 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 1 },
      ],
    },
    {
      id: 'p20260324-2',
      date: '2026-03-24',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 4, 3], [7, 5, 3], [7, 6, 3], [7, 7, 3],
        [6, 2, 4], [6, 3, 4], [6, 4, 4], [6, 5, 4], [6, 6, 4], [6, 7, 4],
        [5, 1, 5], [5, 2, 5], [5, 3, 5], [5, 4, 5], [5, 5, 5], [5, 6, 5], [5, 7, 5],
      ]),
      pieces: [
        { id: 'v3a', shape: SHAPES.V3, colorIndex: 5 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 4 },
        { id: 'h3a', shape: SHAPES.H3, colorIndex: 3 },
      ],
    },
    {
      id: 'p20260324-3',
      date: '2026-03-24',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 5, 2], [7, 6, 2], [7, 7, 2],
        [6, 3, 3], [6, 4, 3], [6, 5, 3], [6, 6, 3], [6, 7, 3],
        [5, 2, 4], [5, 3, 4], [5, 4, 4], [5, 5, 4], [5, 6, 4], [5, 7, 4],
        [4, 1, 5], [4, 2, 5], [4, 3, 5], [4, 4, 5], [4, 5, 5], [4, 6, 5], [4, 7, 5],
      ]),
      pieces: [
        { id: 'v4a', shape: SHAPES.V4, colorIndex: 5 },
        { id: 'v2a', shape: SHAPES.V2, colorIndex: 4 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 3 },
        { id: 'h4a', shape: SHAPES.H4, colorIndex: 2 },
      ],
    },
  ],
  // --- Day 6: L3 and J3 shapes ---
  '2026-03-25': [
    {
      id: 'p20260325-1',
      date: '2026-03-25',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 0, 1], [7, 1, 1], [7, 2, 1], [7, 3, 1], [7, 7, 1],
        [6, 0, 2], [6, 1, 2], [6, 2, 2], [6, 3, 2], [6, 4, 2], [6, 6, 2], [6, 7, 2],
      ]),
      pieces: [
        { id: 'l3a', shape: SHAPES.L3, colorIndex: 2 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 1 },
      ],
    },
    {
      id: 'p20260325-2',
      date: '2026-03-25',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 0, 3], [7, 5, 3], [7, 6, 3], [7, 7, 3],
        [6, 0, 4], [6, 1, 4], [6, 2, 4], [6, 3, 4], [6, 5, 4], [6, 6, 4], [6, 7, 4],
        [5, 0, 5], [5, 1, 5], [5, 2, 5], [5, 3, 5], [5, 4, 5], [5, 6, 5], [5, 7, 5],
      ]),
      pieces: [
        { id: 'j3a', shape: SHAPES.J3, colorIndex: 4 },
        { id: 'h2a', shape: SHAPES.H2, colorIndex: 3 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 5 },
      ],
    },
    {
      id: 'p20260325-3',
      date: '2026-03-25',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 1, 2],
        [6, 0, 3], [6, 1, 3], [6, 2, 3], [6, 3, 3], [6, 4, 3], [6, 5, 3],
        [5, 0, 4], [5, 1, 4], [5, 2, 4], [5, 3, 4], [5, 4, 4], [5, 5, 4], [5, 7, 4],
        [4, 0, 5], [4, 1, 5], [4, 2, 5], [4, 3, 5], [4, 4, 5], [4, 5, 5], [4, 6, 5],
      ]),
      pieces: [
        { id: 'l3a', shape: SHAPES.L3, colorIndex: 4 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 5 },
        { id: 'h4a', shape: SHAPES.H4, colorIndex: 2 },
        { id: 'h2a', shape: SHAPES.H2, colorIndex: 3 },
      ],
    },
  ],
  // --- Day 7: Center gaps and SQ2x2 ---
  '2026-03-26': [
    {
      id: 'p20260326-1',
      date: '2026-03-26',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 0, 1], [7, 1, 1], [7, 4, 1], [7, 5, 1], [7, 6, 1], [7, 7, 1],
        [6, 0, 2], [6, 1, 2], [6, 2, 2], [6, 4, 2], [6, 5, 2], [6, 6, 2], [6, 7, 2],
      ]),
      pieces: [
        { id: 'v2a', shape: SHAPES.V2, colorIndex: 2 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 1 },
      ],
    },
    {
      id: 'p20260326-2',
      date: '2026-03-26',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 0, 3], [7, 1, 3], [7, 6, 3], [7, 7, 3],
        [6, 0, 4], [6, 1, 4], [6, 2, 4], [6, 3, 4], [6, 6, 4], [6, 7, 4],
        [5, 0, 5], [5, 1, 5], [5, 2, 5], [5, 3, 5], [5, 4, 5], [5, 5, 5], [5, 6, 5],
      ]),
      pieces: [
        { id: 'sq', shape: SHAPES.SQ2x2, colorIndex: 4 },
        { id: 'h2a', shape: SHAPES.H2, colorIndex: 3 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 5 },
      ],
    },
    {
      id: 'p20260326-3',
      date: '2026-03-26',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 4, 2], [7, 5, 2], [7, 6, 2], [7, 7, 2],
        [6, 0, 3], [6, 1, 3], [6, 4, 3], [6, 5, 3], [6, 6, 3], [6, 7, 3],
        [5, 0, 4], [5, 1, 4], [5, 2, 4], [5, 3, 4], [5, 6, 4], [5, 7, 4],
        [4, 0, 5], [4, 1, 5], [4, 2, 5], [4, 3, 5], [4, 4, 5], [4, 6, 5], [4, 7, 5],
      ]),
      pieces: [
        { id: 'sq', shape: SHAPES.SQ2x2, colorIndex: 3 },
        { id: 'dot1', shape: SHAPES.DOT, colorIndex: 2 },
        { id: 'h2a', shape: SHAPES.H2, colorIndex: 4 },
        { id: 'dot2', shape: SHAPES.DOT, colorIndex: 5 },
      ],
    },
  ],
  // --- Day 8: T3 shape ---
  '2026-03-27': [
    {
      id: 'p20260327-1',
      date: '2026-03-27',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 0, 1], [7, 1, 1], [7, 2, 1], [7, 3, 1], [7, 5, 1], [7, 7, 1],
        [6, 0, 2], [6, 1, 2], [6, 2, 2], [6, 3, 2], [6, 4, 2], [6, 7, 2],
      ]),
      pieces: [
        { id: 't3a', shape: SHAPES.T3, colorIndex: 2 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 1 },
      ],
    },
    {
      id: 'p20260327-2',
      date: '2026-03-27',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 0, 3], [7, 1, 3], [7, 5, 3], [7, 6, 3], [7, 7, 3],
        [6, 0, 4], [6, 1, 4], [6, 2, 4], [6, 5, 4], [6, 6, 4], [6, 7, 4],
        [5, 0, 5], [5, 1, 5], [5, 2, 5], [5, 4, 5], [5, 5, 5], [5, 6, 5], [5, 7, 5],
      ]),
      pieces: [
        { id: 't3a', shape: SHAPES.T3, colorIndex: 4 },
        { id: 'h2a', shape: SHAPES.H2, colorIndex: 3 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 5 },
      ],
    },
    {
      id: 'p20260327-3',
      date: '2026-03-27',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 1, 2], [7, 2, 2],
        [6, 0, 3], [6, 1, 3], [6, 2, 3], [6, 3, 3],
        [5, 0, 4], [5, 1, 4], [5, 2, 4], [5, 3, 4], [5, 4, 4], [5, 5, 4],
        [4, 0, 5], [4, 1, 5], [4, 2, 5], [4, 3, 5], [4, 4, 5], [4, 5, 5], [4, 6, 5],
      ]),
      pieces: [
        { id: 't3a', shape: SHAPES.T3, colorIndex: 4 },
        { id: 'h3a', shape: SHAPES.H3, colorIndex: 3 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 5 },
        { id: 'h5a', shape: SHAPES.H5, colorIndex: 2 },
      ],
    },
  ],
  // --- Day 9: S4 and Z4 shapes ---
  '2026-03-28': [
    {
      id: 'p20260328-1',
      date: '2026-03-28',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 0, 1], [7, 1, 1], [7, 2, 1], [7, 3, 1], [7, 7, 1],
        [6, 0, 2], [6, 1, 2], [6, 2, 2], [6, 3, 2], [6, 4, 2], [6, 5, 2],
      ]),
      pieces: [
        { id: 's4a', shape: SHAPES.S4, colorIndex: 2 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 1 },
      ],
    },
    {
      id: 'p20260328-2',
      date: '2026-03-28',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 0, 3], [7, 1, 3], [7, 5, 3], [7, 6, 3], [7, 7, 3],
        [6, 0, 4], [6, 1, 4], [6, 4, 4], [6, 5, 4], [6, 6, 4], [6, 7, 4],
        [5, 0, 5], [5, 1, 5], [5, 2, 5], [5, 3, 5], [5, 4, 5], [5, 5, 5],
      ]),
      pieces: [
        { id: 'z4a', shape: SHAPES.Z4, colorIndex: 4 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 3 },
        { id: 'h2a', shape: SHAPES.H2, colorIndex: 5 },
      ],
    },
    {
      id: 'p20260328-3',
      date: '2026-03-28',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 1, 2], [7, 5, 2], [7, 6, 2], [7, 7, 2],
        [6, 0, 3], [6, 1, 3], [6, 2, 3], [6, 3, 3], [6, 6, 3], [6, 7, 3],
        [5, 0, 4], [5, 1, 4], [5, 2, 4], [5, 3, 4], [5, 4, 4], [5, 7, 4],
        [4, 0, 5], [4, 1, 5], [4, 2, 5], [4, 3, 5], [4, 4, 5], [4, 5, 5], [4, 6, 5],
      ]),
      pieces: [
        { id: 's4a', shape: SHAPES.S4, colorIndex: 3 },
        { id: 'dot1', shape: SHAPES.DOT, colorIndex: 2 },
        { id: 'h2a', shape: SHAPES.H2, colorIndex: 4 },
        { id: 'dot2', shape: SHAPES.DOT, colorIndex: 5 },
      ],
    },
  ],
  // --- Day 10: Mixed expert ---
  '2026-03-29': [
    {
      id: 'p20260329-1',
      date: '2026-03-29',
      orderInDay: 1,
      initialBoard: boardWithCells([
        [7, 0, 1], [7, 1, 1], [7, 2, 1], [7, 3, 1], [7, 4, 1],
        [6, 0, 2], [6, 1, 2], [6, 2, 2], [6, 3, 2], [6, 4, 2], [6, 5, 2],
        [5, 0, 3], [5, 1, 3], [5, 2, 3], [5, 3, 3], [5, 4, 3], [5, 5, 3], [5, 7, 3],
      ]),
      pieces: [
        { id: 'l3a', shape: SHAPES.L3, colorIndex: 3 },
        { id: 'h3a', shape: SHAPES.H3, colorIndex: 1 },
      ],
    },
    {
      id: 'p20260329-2',
      date: '2026-03-29',
      orderInDay: 2,
      initialBoard: boardWithCells([
        [7, 0, 4], [7, 1, 4], [7, 2, 4], [7, 3, 4],
        [6, 0, 5], [6, 1, 5], [6, 2, 5], [6, 3, 5], [6, 4, 5], [6, 7, 5],
        [5, 0, 6], [5, 1, 6], [5, 2, 6], [5, 3, 6], [5, 4, 6], [5, 6, 6], [5, 7, 6],
        [4, 0, 1], [4, 1, 1], [4, 2, 1], [4, 3, 1], [4, 4, 1], [4, 5, 1], [4, 6, 1],
      ]),
      pieces: [
        { id: 'l3a', shape: SHAPES.L3, colorIndex: 6 },
        { id: 'dot', shape: SHAPES.DOT, colorIndex: 1 },
        { id: 'h4a', shape: SHAPES.H4, colorIndex: 4 },
      ],
    },
    {
      id: 'p20260329-3',
      date: '2026-03-29',
      orderInDay: 3,
      initialBoard: boardWithCells([
        [7, 0, 2], [7, 1, 2],
        [6, 0, 3], [6, 1, 3], [6, 2, 3], [6, 3, 3],
        [5, 0, 4], [5, 1, 4], [5, 2, 4], [5, 3, 4], [5, 4, 4], [5, 5, 4],
        [4, 0, 5], [4, 1, 5], [4, 2, 5], [4, 3, 5], [4, 4, 5], [4, 5, 5],
        [3, 0, 6], [3, 1, 6], [3, 2, 6], [3, 3, 6], [3, 4, 6], [3, 5, 6], [3, 6, 6],
      ]),
      pieces: [
        { id: 'v5a', shape: SHAPES.V5, colorIndex: 6 },
        { id: 'v2a', shape: SHAPES.V2, colorIndex: 5 },
        { id: 'h3a', shape: SHAPES.H3, colorIndex: 3 },
        { id: 'h5a', shape: SHAPES.H5, colorIndex: 2 },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Seeded RNG
// ---------------------------------------------------------------------------

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
    .reduce((acc, c) => ((acc * 31 + c.charCodeAt(0)) | 0) >>> 0, 0);
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  return shuffleArray(arr, rng).slice(0, n);
}

// ---------------------------------------------------------------------------
// Difficulty configuration
// ---------------------------------------------------------------------------

interface DifficultyConfig {
  targetRowCount: number;
  targetColCount: number;
  pieceCount: number;
  // Shapes restricted to single-row only (H-shapes, DOT)
  singleRowShapes: string[];
  // Shapes that span 2+ rows (require adjacent target rows)
  crossRowShapes: string[];
}

// Target rows are always CONSECUTIVE to ensure cross-row shapes can be placed.
// This also creates natural spatial puzzles where pieces interact across rows.

const DIFFICULTY_CONFIGS: Record<string, DifficultyConfig> = {
  easy: {
    targetRowCount: 2, targetColCount: 0,
    pieceCount: 2,
    singleRowShapes: ['DOT', 'H2', 'H3'],
    crossRowShapes: ['V2'],
  },
  medium: {
    targetRowCount: 3, targetColCount: 0,
    pieceCount: 3,
    singleRowShapes: ['H2', 'H3'],
    crossRowShapes: ['V2', 'L3', 'J3', 'T3'],
  },
  hard: {
    targetRowCount: 4, targetColCount: 0,
    pieceCount: 5,
    singleRowShapes: ['H2', 'H3', 'H4'],
    crossRowShapes: ['V2', 'V3', 'L3', 'J3', 'T3', 'SQ2x2', 'L4', 'J4', 'S4', 'Z4'],
  },
  expert: {
    targetRowCount: 5, targetColCount: 0,
    pieceCount: 6,
    singleRowShapes: ['H2', 'H3', 'H4'],
    crossRowShapes: ['V2', 'V3', 'L3', 'J3', 'T3', 'SQ2x2', 'L4', 'J4', 'T4', 'S4', 'Z4'],
  },
  master: {
    targetRowCount: 6, targetColCount: 0,
    pieceCount: 7,
    singleRowShapes: ['H2', 'H3', 'H4'],
    crossRowShapes: ['V2', 'V3', 'L3', 'J3', 'T3', 'SQ2x2', 'L4', 'J4', 'T4', 'S4', 'Z4', 'PLUS'],
  },
};

// ---------------------------------------------------------------------------
// Pick consecutive target rows starting from a random position
// ---------------------------------------------------------------------------

function pickConsecutiveRows(count: number, rng: () => number): number[] {
  // Max starting row so that rows fit within 0..7
  const maxStart = BOARD_SIZE - count;
  const start = Math.floor(rng() * (maxStart + 1));
  const rows: number[] = [];
  for (let i = 0; i < count; i++) {
    rows.push(start + i);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Procedural "carve-from-filled-lines" puzzle generator
//
// Approach:
//   1. Pick CONSECUTIVE target rows (ensures cross-row shapes always work)
//   2. Fill ALL cells on target rows completely
//   3. Carve piece-shaped holes — mix of single-row and cross-row shapes
//   4. Verify solvability with DFS (board must be empty after all pieces placed)
//
// Difficulty comes from:
//   - Cross-row pieces (L, J, T, S, Z) creating spatial dependencies
//   - More pieces = more combinatorial space
//   - More target rows = more complex interactions
// ---------------------------------------------------------------------------

function tryGeneratePuzzle(
  config: DifficultyConfig,
  rng: () => number,
): { board: number[][]; pieces: Piece[] } | null {
  // 1. Pick consecutive target rows
  const targetRows = pickConsecutiveRows(config.targetRowCount, rng);
  const targetRowSet = new Set(targetRows);

  // 2. Fill all target row cells
  const board = createEmptyBoard();
  const colors = shuffleArray([1, 2, 3, 4, 5, 6, 7], rng);
  let ci = 0;

  for (const r of targetRows) {
    const color = colors[ci++ % 7];
    for (let c = 0; c < BOARD_SIZE; c++) {
      board[r][c] = color;
    }
  }

  // 3. Carve pieces — ensure a mix of single-row and cross-row shapes
  const pieces: Piece[] = [];

  // At least 1 cross-row shape for medium+, and at least 1 single-row shape
  const crossCount = config.targetRowCount >= 3
    ? Math.max(1, Math.floor(config.pieceCount * 0.4 + rng() * 0.3))
    : Math.floor(rng() * 2); // 0 or 1 for easy
  const singleCount = config.pieceCount - crossCount;

  // Build shape list: cross-row first, then single-row
  const shapeNames: string[] = [];
  for (let i = 0; i < crossCount; i++) {
    shapeNames.push(config.crossRowShapes[Math.floor(rng() * config.crossRowShapes.length)]);
  }
  for (let i = 0; i < singleCount; i++) {
    shapeNames.push(config.singleRowShapes[Math.floor(rng() * config.singleRowShapes.length)]);
  }
  // Shuffle so carving order is random
  const orderedShapes = shuffleArray(shapeNames, rng);

  for (let i = 0; i < orderedShapes.length; i++) {
    const shapeName = orderedShapes[i];
    const shape = SHAPES[shapeName as keyof typeof SHAPES];
    if (!shape) return null;

    // Find valid carve positions:
    // - Every cell is currently filled (non-zero)
    // - Every cell is on a target row
    const validPositions: { row: number; col: number }[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        let allValid = true;
        for (const [dr, dc] of shape) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) {
            allValid = false;
            break;
          }
          if (board[nr][nc] === 0) {
            allValid = false;
            break;
          }
          if (!targetRowSet.has(nr)) {
            allValid = false;
            break;
          }
        }
        if (allValid) validPositions.push({ row: r, col: c });
      }
    }

    if (validPositions.length === 0) return null;

    const pos = validPositions[Math.floor(rng() * validPositions.length)];
    const pieceColor = colors[(ci++) % 7];

    // Carve
    for (const [dr, dc] of shape) {
      board[pos.row + dr][pos.col + dc] = 0;
    }

    pieces.push({
      id: `proc-${i}`,
      shape,
      colorIndex: pieceColor,
    });
  }

  // 4. Reject if any row or column is already complete (would auto-clear)
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r].every(cell => cell !== 0)) return null;
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board.every(row => row[c] !== 0)) return null;
  }

  // 5. Verify solvability (board must be empty after all pieces placed)
  if (!isSolvableToEmpty(board, pieces)) return null;

  return { board, pieces };
}

// ---------------------------------------------------------------------------
// DFS solvability check — ensures board is EMPTY after all pieces placed
//
// Optimizations:
//   - Most-constrained-first: try pieces with fewer valid positions first
//   - Only scan rows that have filled cells (skip empty rows)
//   - Low iteration limit to prevent UI freezing
// ---------------------------------------------------------------------------

let dfsIterations = 0;
const MAX_DFS_ITERATIONS = 15000;

function isSolvableToEmpty(board: number[][], pieces: Piece[]): boolean {
  dfsIterations = 0;
  return dfsCheck(board, pieces);
}

function dfsCheck(board: number[][], pieces: Piece[]): boolean {
  if (pieces.length === 0) {
    return board.every(row => row.every(cell => cell === 0));
  }

  if (++dfsIterations > MAX_DFS_ITERATIONS) return false;

  // Most-constrained-first: find piece with fewest valid placements
  let bestPi = 0;
  let bestCount = Infinity;
  let bestPositions: { r: number; c: number }[] = [];

  for (let pi = 0; pi < pieces.length; pi++) {
    const piece = pieces[pi];
    const positions: { r: number; c: number }[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canPlace(board, piece.shape, r, c)) {
          positions.push({ r, c });
        }
      }
    }
    if (positions.length === 0) return false; // dead end: piece can't be placed anywhere
    if (positions.length < bestCount) {
      bestCount = positions.length;
      bestPi = pi;
      bestPositions = positions;
    }
  }

  const piece = pieces[bestPi];
  const remaining = pieces.filter((_, i) => i !== bestPi);

  for (const { r, c } of bestPositions) {
    if (dfsIterations > MAX_DFS_ITERATIONS) return false;

    const newBoard = board.map(row => [...row]);
    for (const [dr, dc] of piece.shape) {
      newBoard[r + dr][c + dc] = piece.colorIndex;
    }

    // Clear lines — match game logic exactly
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

    if (dfsCheck(newBoard, remaining)) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Puzzle generators (daily + endless)
// ---------------------------------------------------------------------------

function generateProceduralPuzzle(
  dateStr: string,
  order: number,
  difficulty: string,
  rng: () => number,
): PuzzleLevel | null {
  const config = DIFFICULTY_CONFIGS[difficulty];
  if (!config) return null;

  // Reduced attempts — consecutive rows + smart shape selection = high success rate
  for (let attempt = 0; attempt < 20; attempt++) {
    const result = tryGeneratePuzzle(config, rng);
    if (result) {
      const shuffledPieces = shuffleArray(result.pieces, rng);
      return {
        id: `proc-${dateStr}-${order}`,
        date: dateStr,
        orderInDay: order,
        initialBoard: result.board,
        pieces: shuffledPieces,
      };
    }
  }
  return null;
}

function generateFallbackPuzzles(dateStr: string): PuzzleLevel[] {
  const seed = dateToSeed(dateStr);

  const rngs = [
    seededRng(seed),
    seededRng(seed ^ 0x12345678),
    seededRng(seed ^ 0x87654321),
  ];

  const difficulties = ['easy', 'medium', 'hard'];

  return ([1, 2, 3] as const).map((order, i) => {
    const puzzle = generateProceduralPuzzle(dateStr, order, difficulties[i], rngs[i]);
    if (puzzle) return puzzle;

    // Ultimate fallback: simple 2-row puzzle
    const board = createEmptyBoard();
    for (let c = 0; c < 7; c++) board[7][c] = 1;
    for (let c = 0; c < 6; c++) board[6][c] = 2;
    return {
      id: `fallback-${dateStr}-${order}`,
      date: dateStr,
      orderInDay: order,
      initialBoard: board,
      pieces: [
        { id: 'fb-0', shape: SHAPES.DOT, colorIndex: 1 },
        { id: 'fb-1', shape: SHAPES.H2, colorIndex: 2 },
      ],
    };
  });
}

// ---------------------------------------------------------------------------
// Endless mode puzzle generator — difficulty scales with level
// ---------------------------------------------------------------------------

export function generateEndlessPuzzle(level: number, seed: number): PuzzleLevel {
  const rng = seededRng(seed ^ (level * 0x9E3779B9));

  // Difficulty scaling — gradual curve
  let difficulty: string;
  if (level <= 3) {
    difficulty = 'easy';
  } else if (level <= 7) {
    difficulty = 'medium';
  } else if (level <= 14) {
    difficulty = 'hard';
  } else if (level <= 25) {
    difficulty = 'expert';
  } else {
    difficulty = 'master';
  }

  const puzzle = generateProceduralPuzzle('endless', level, difficulty, rng);
  if (puzzle) {
    puzzle.id = `endless-${seed}-${level}`;
    puzzle.date = 'endless';
    puzzle.orderInDay = level;
    return puzzle;
  }

  // Fallback — try one step easier (quick, no long chain)
  const easierMap: Record<string, string> = {
    master: 'expert', expert: 'hard', hard: 'medium', medium: 'easy',
  };
  const easier = easierMap[difficulty];
  if (easier) {
    const fbRng = seededRng(seed ^ (level * 0x12345));
    const fallback = generateProceduralPuzzle('endless', level, easier, fbRng);
    if (fallback) {
      fallback.id = `endless-${seed}-${level}`;
      fallback.date = 'endless';
      fallback.orderInDay = level;
      return fallback;
    }
  }

  // Ultimate fallback — always works, instant
  const board = createEmptyBoard();
  for (let c = 0; c < 7; c++) board[7][c] = 1;
  for (let c = 0; c < 6; c++) board[6][c] = 2;
  return {
    id: `endless-${seed}-${level}`,
    date: 'endless',
    orderInDay: level,
    initialBoard: board,
    pieces: [
      { id: 'fb-0', shape: SHAPES.DOT, colorIndex: 1 },
      { id: 'fb-1', shape: SHAPES.H2, colorIndex: 2 },
    ],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getPuzzlesForDate(dateStr: string): PuzzleLevel[] {
  return PUZZLE_DATABASE[dateStr] ?? generateFallbackPuzzles(dateStr);
}
