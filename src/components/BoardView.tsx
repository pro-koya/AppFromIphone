import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
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
}

const PIECE_COLORS = [Colors.boardBg, ...Colors.pieces];

export const BoardView = React.memo(function BoardView({
  board,
  selectedPiece,
  onCellPress,
  disabled = false,
}: BoardViewProps) {
  // Compute which cells would be highlighted if selectedPiece is hovered
  // For simplicity in touch: highlight valid placement origins
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

  return (
    <View style={styles.board}>
      {board.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((cell, c) => {
            const isValid = selectedPiece !== null && validOrigins.has(`${r},${c}`);
            const cellColor = cell === 0 ? Colors.cellEmpty : PIECE_COLORS[cell] ?? Colors.pieces[0];
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.cell,
                  { backgroundColor: cellColor },
                  cell !== 0 && styles.filledCell,
                  isValid && styles.validCell,
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
