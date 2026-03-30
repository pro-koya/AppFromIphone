import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { BOARD_SIZE, Board, Piece } from '../game/types';
import { canPlace } from '../game/board';
import { Colors, Radii } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_PADDING = 16;
export const CELL_SIZE = Math.floor((SCREEN_WIDTH - BOARD_PADDING * 2) / BOARD_SIZE);

interface BoardViewProps {
  board: Board;
  selectedPiece: Piece | null;
  onCellPress: (row: number, col: number) => void;
  disabled?: boolean;
  // Ghost preview (during drag)
  ghostPiece?: Piece | null;
  ghostRow?: number | null;
  ghostCol?: number | null;
  isGhostValid?: boolean;
  // Placement animation
  placedCells?: Set<string>;
  placementScale?: Animated.Value;
  // Line clear animation (enhanced: per-cell scale)
  clearedLines?: { rows: number[]; cols: number[] };
  clearFlash?: Animated.Value;
  clearCellScales?: Map<string, Animated.Value>;
  // Hint highlight
  hintCells?: Set<string> | null;
  hintPulse?: Animated.Value;
}

const PIECE_COLORS = [Colors.boardBg, ...Colors.pieces];

export const BoardView = React.memo(function BoardView({
  board,
  selectedPiece,
  onCellPress,
  disabled = false,
  ghostPiece = null,
  ghostRow = null,
  ghostCol = null,
  isGhostValid = false,
  placedCells,
  placementScale,
  clearedLines,
  clearFlash,
  clearCellScales,
  hintCells,
  hintPulse,
}: BoardViewProps) {
  // Valid origins for tap-to-place
  const validOrigins = useMemo(() => {
    if (!selectedPiece) return new Set<string>();
    const valid = new Set<string>();
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canPlace(board, selectedPiece.shape, r, c)) {
          valid.add(`${r},${c}`);
        }
      }
    }
    return valid;
  }, [board, selectedPiece]);

  // Ghost cells (during drag)
  const ghostCells = useMemo(() => {
    if (!ghostPiece || ghostRow === null || ghostCol === null) return new Set<string>();
    const cells = new Set<string>();
    for (const [dr, dc] of ghostPiece.shape) {
      const r = ghostRow + dr;
      const c = ghostCol + dc;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        cells.add(`${r},${c}`);
      }
    }
    return cells;
  }, [ghostPiece, ghostRow, ghostCol]);

  const ghostColor = ghostPiece
    ? (PIECE_COLORS[ghostPiece.colorIndex] ?? Colors.pieces[0])
    : Colors.accent;

  // Cleared line cells for flash overlay
  const clearedCellSet = useMemo(() => {
    if (!clearedLines) return new Set<string>();
    const cells = new Set<string>();
    for (const row of clearedLines.rows) {
      for (let c = 0; c < BOARD_SIZE; c++) cells.add(`${row},${c}`);
    }
    for (const col of clearedLines.cols) {
      for (let r = 0; r < BOARD_SIZE; r++) cells.add(`${r},${col}`);
    }
    return cells;
  }, [clearedLines]);

  return (
    <View style={styles.board}>
      {board.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((cell, c) => {
            const key = `${r},${c}`;
            const isValid = selectedPiece !== null && validOrigins.has(key);
            const isGhost = ghostCells.has(key);
            const isPlaced = placedCells?.has(key) ?? false;
            const isCleared = clearedCellSet.has(key);
            const cellColor = cell === 0 ? Colors.cellEmpty : PIECE_COLORS[cell] ?? Colors.pieces[0];

            // Placed cell with animation
            if (isPlaced && placementScale) {
              return (
                <Animated.View
                  key={c}
                  style={[
                    styles.cell,
                    { backgroundColor: cellColor },
                    styles.filledCell,
                    {
                      transform: [{ scale: placementScale }],
                    },
                  ]}
                />
              );
            }

            // Cleared cell with per-cell cascade animation
            if (isCleared && clearCellScales) {
              const cellScale = clearCellScales.get(key);
              if (cellScale) {
                return (
                  <View key={c} style={[styles.cell, { backgroundColor: Colors.cellEmpty }]}>
                    <Animated.View
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          backgroundColor: cellColor,
                          borderRadius: Radii.sm,
                          transform: [{ scale: cellScale }],
                          opacity: cellScale,
                        },
                      ]}
                    />
                    {/* Flash overlay */}
                    {clearFlash && (
                      <Animated.View
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            backgroundColor: Colors.warning,
                            borderRadius: Radii.sm,
                            opacity: clearFlash,
                          },
                        ]}
                      />
                    )}
                  </View>
                );
              }
            }

            // Cleared line flash overlay (fallback without per-cell scales)
            if (isCleared && clearFlash && !clearCellScales) {
              return (
                <View key={c} style={[styles.cell, { backgroundColor: cellColor }]}>
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: Colors.warning,
                        borderRadius: Radii.sm,
                        opacity: clearFlash,
                      },
                    ]}
                  />
                </View>
              );
            }

            const isHinted = hintCells?.has(key) ?? false;

            // Hint highlight cell
            if (isHinted && hintPulse) {
              return (
                <View key={c} style={[styles.cell, { backgroundColor: cellColor }, cell !== 0 && styles.filledCell]}>
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: Colors.warning,
                        borderRadius: Radii.sm,
                        opacity: hintPulse,
                      },
                    ]}
                  />
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.cell,
                  { backgroundColor: cellColor },
                  cell !== 0 && styles.filledCell,
                  isValid && styles.validCell,
                  isGhost && {
                    backgroundColor: isGhostValid
                      ? ghostColor
                      : Colors.error,
                    opacity: isGhostValid ? 0.45 : 0.3,
                  },
                  disabled && styles.disabledCell,
                ]}
                onPress={() => !disabled && onCellPress(r, c)}
                activeOpacity={disabled ? 1 : 0.7}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    padding: 2,
    backgroundColor: Colors.boardBg,
    borderRadius: Radii.md,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    margin: 1,
    borderRadius: Radii.sm,
  },
  filledCell: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  validCell: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  disabledCell: {
    opacity: 0.6,
  },
});
