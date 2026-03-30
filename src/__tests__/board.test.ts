import {
  createEmptyBoard,
  cloneBoard,
  canPlace,
  placePiece,
  clearLines,
  hasAnyValidMove,
  isBoardEmpty,
} from '../game/board';
import { SHAPES } from '../game/pieces';
import { Board, Piece } from '../game/types';

describe('createEmptyBoard', () => {
  it('creates an 8x8 board filled with zeros', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(8);
    for (const row of board) {
      expect(row).toHaveLength(8);
      expect(row.every(cell => cell === 0)).toBe(true);
    }
  });
});

describe('cloneBoard', () => {
  it('creates a deep copy of the board', () => {
    const board = createEmptyBoard();
    board[3][4] = 1;
    const clone = cloneBoard(board);
    expect(clone[3][4]).toBe(1);
    clone[3][4] = 0;
    expect(board[3][4]).toBe(1); // original unchanged
  });
});

describe('canPlace', () => {
  it('allows placement on empty cells', () => {
    const board = createEmptyBoard();
    expect(canPlace(board, SHAPES.H3, 0, 0)).toBe(true);
    expect(canPlace(board, SHAPES.SQ2x2, 6, 6)).toBe(true);
  });

  it('rejects placement on occupied cells', () => {
    const board = createEmptyBoard();
    board[0][1] = 1;
    expect(canPlace(board, SHAPES.H3, 0, 0)).toBe(false);
  });

  it('rejects placement out of bounds', () => {
    const board = createEmptyBoard();
    expect(canPlace(board, SHAPES.H3, 0, 6)).toBe(false); // col 6+2=8 out of bounds
    expect(canPlace(board, SHAPES.V3, 6, 0)).toBe(false); // row 6+2=8 out of bounds
    expect(canPlace(board, SHAPES.DOT, -1, 0)).toBe(false);
  });

  it('allows single DOT piece anywhere on empty board', () => {
    const board = createEmptyBoard();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        expect(canPlace(board, SHAPES.DOT, r, c)).toBe(true);
      }
    }
  });

  it('rejects SQ2x2 at bottom-right corner', () => {
    const board = createEmptyBoard();
    expect(canPlace(board, SHAPES.SQ2x2, 7, 7)).toBe(false);
  });
});

describe('placePiece', () => {
  it('returns success for valid placement', () => {
    const board = createEmptyBoard();
    const piece: Piece = { id: 'test', shape: SHAPES.H2, colorIndex: 1 };
    const result = placePiece(board, piece, 0, 0);
    expect(result.success).toBe(true);
  });

  it('fills the correct cells', () => {
    const board = createEmptyBoard();
    const piece: Piece = { id: 'test', shape: SHAPES.H3, colorIndex: 3 };
    const result = placePiece(board, piece, 4, 2);
    if (!result.success) throw new Error('should succeed');
    expect(result.board[4][2]).toBe(3);
    expect(result.board[4][3]).toBe(3);
    expect(result.board[4][4]).toBe(3);
  });

  it('returns failure for occupied cells', () => {
    const board = createEmptyBoard();
    board[0][0] = 2;
    const piece: Piece = { id: 'test', shape: SHAPES.DOT, colorIndex: 1 };
    const result = placePiece(board, piece, 0, 0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('invalid_position');
    }
  });

  it('returns failure for out of bounds', () => {
    const board = createEmptyBoard();
    const piece: Piece = { id: 'test', shape: SHAPES.H4, colorIndex: 1 };
    const result = placePiece(board, piece, 0, 5);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('out_of_bounds');
    }
  });

  it('does not mutate the original board', () => {
    const board = createEmptyBoard();
    const piece: Piece = { id: 'test', shape: SHAPES.DOT, colorIndex: 1 };
    placePiece(board, piece, 0, 0);
    expect(board[0][0]).toBe(0);
  });

  it('clears a full row and scores correctly', () => {
    const board = createEmptyBoard();
    // Fill row 7 except col 0
    for (let c = 1; c < 8; c++) board[7][c] = 1;
    const piece: Piece = { id: 'test', shape: SHAPES.DOT, colorIndex: 2 };
    const result = placePiece(board, piece, 7, 0);
    if (!result.success) throw new Error('should succeed');
    // Row 7 should be cleared
    expect(result.board[7].every(c => c === 0)).toBe(true);
    expect(result.linesCleared).toBe(1);
    expect(result.clearedRows).toEqual([7]);
  });

  it('clears a full column', () => {
    const board = createEmptyBoard();
    // Fill column 3 except row 0
    for (let r = 1; r < 8; r++) board[r][3] = 1;
    const piece: Piece = { id: 'test', shape: SHAPES.DOT, colorIndex: 2 };
    const result = placePiece(board, piece, 0, 3);
    if (!result.success) throw new Error('should succeed');
    // Column 3 should be cleared
    for (let r = 0; r < 8; r++) {
      expect(result.board[r][3]).toBe(0);
    }
    expect(result.linesCleared).toBe(1);
    expect(result.clearedCols).toEqual([3]);
  });

  it('clears row and column simultaneously', () => {
    const board = createEmptyBoard();
    // Fill row 4 except [4,5]
    for (let c = 0; c < 8; c++) if (c !== 5) board[4][c] = 1;
    // Fill col 5 except [4,5]
    for (let r = 0; r < 8; r++) if (r !== 4) board[r][5] = 1;
    const piece: Piece = { id: 'test', shape: SHAPES.DOT, colorIndex: 3 };
    const result = placePiece(board, piece, 4, 5);
    if (!result.success) throw new Error('should succeed');
    expect(result.linesCleared).toBe(2);
    expect(result.clearedRows).toEqual([4]);
    expect(result.clearedCols).toEqual([5]);
  });
});

describe('clearLines', () => {
  it('does not clear incomplete rows', () => {
    const board = createEmptyBoard();
    for (let c = 0; c < 7; c++) board[0][c] = 1; // 7 of 8
    const { board: cleared, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(0);
    expect(cleared[0][0]).toBe(1);
  });

  it('clears multiple rows at once', () => {
    const board = createEmptyBoard();
    for (let c = 0; c < 8; c++) {
      board[2][c] = 1;
      board[5][c] = 2;
    }
    const { board: cleared, linesCleared, clearedRows } = clearLines(board);
    expect(linesCleared).toBe(2);
    expect(clearedRows).toEqual([2, 5]);
    expect(cleared[2].every(c => c === 0)).toBe(true);
    expect(cleared[5].every(c => c === 0)).toBe(true);
  });
});

describe('hasAnyValidMove', () => {
  it('returns true when moves exist', () => {
    const board = createEmptyBoard();
    const pieces: Piece[] = [{ id: 'p', shape: SHAPES.DOT, colorIndex: 1 }];
    expect(hasAnyValidMove(board, pieces)).toBe(true);
  });

  it('returns false on a full board', () => {
    const board: Board = Array.from({ length: 8 }, () => Array(8).fill(1));
    const pieces: Piece[] = [{ id: 'p', shape: SHAPES.DOT, colorIndex: 2 }];
    expect(hasAnyValidMove(board, pieces)).toBe(false);
  });

  it('returns false when piece is too large for remaining space', () => {
    // Fill all except [0,0]
    const board: Board = Array.from({ length: 8 }, () => Array(8).fill(1));
    board[0][0] = 0;
    const pieces: Piece[] = [{ id: 'p', shape: SHAPES.H2, colorIndex: 2 }];
    expect(hasAnyValidMove(board, pieces)).toBe(false);
  });

  it('returns true with empty pieces array', () => {
    const board = createEmptyBoard();
    expect(hasAnyValidMove(board, [])).toBe(false);
  });
});

describe('isBoardEmpty', () => {
  it('returns true for empty board', () => {
    expect(isBoardEmpty(createEmptyBoard())).toBe(true);
  });

  it('returns false if any cell is occupied', () => {
    const board = createEmptyBoard();
    board[7][7] = 1;
    expect(isBoardEmpty(board)).toBe(false);
  });
});

describe('score calculation', () => {
  it('scores piece placement without line clear', () => {
    const board = createEmptyBoard();
    const piece: Piece = { id: 'test', shape: SHAPES.H3, colorIndex: 1 };
    const result = placePiece(board, piece, 0, 0);
    if (!result.success) throw new Error('should succeed');
    // H3 = 3 cells → 3 * 10 = 30, no line clear bonus
    expect(result.score).toBe(30);
  });

  it('scores single line clear with bonus', () => {
    const board = createEmptyBoard();
    for (let c = 1; c < 8; c++) board[0][c] = 1;
    const piece: Piece = { id: 'test', shape: SHAPES.DOT, colorIndex: 2 };
    const result = placePiece(board, piece, 0, 0);
    if (!result.success) throw new Error('should succeed');
    // DOT = 1 cell → 1*10 = 10, 1 line → 100*1 = 100, total = 110
    expect(result.score).toBe(110);
  });

  it('scores multi-line clear with multiplier', () => {
    const board = createEmptyBoard();
    // Fill rows 0 and 1, leave [0,0] and [1,0] empty
    for (let c = 1; c < 8; c++) {
      board[0][c] = 1;
      board[1][c] = 2;
    }
    const piece: Piece = { id: 'test', shape: SHAPES.V2, colorIndex: 3 };
    const result = placePiece(board, piece, 0, 0);
    if (!result.success) throw new Error('should succeed');
    // V2 = 2 cells → 2*10 = 20, 2 lines → 100*2*2 = 400, total = 420
    expect(result.score).toBe(420);
  });
});
