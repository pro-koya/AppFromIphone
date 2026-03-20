import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Piece } from '../game/types';
import { Colors, Radii, Spacing, Typography } from '../theme';

const PREVIEW_CELL = 16;
const GRID_SIZE = 5; // max piece fits in 5x5 grid

interface PiecePreviewProps {
  piece: Piece;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

const PIECE_COLORS = [Colors.boardBg, ...Colors.pieces];

export function PiecePreview({ piece, isSelected, onSelect, index }: PiecePreviewProps) {
  // Build mini grid
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  // Normalize shape to start at 0,0
  const minR = Math.min(...piece.shape.map(([r]) => r));
  const minC = Math.min(...piece.shape.map(([, c]) => c));
  for (const [r, c] of piece.shape) {
    const gr = r - minR;
    const gc = c - minC;
    if (gr < GRID_SIZE && gc < GRID_SIZE) {
      grid[gr][gc] = true;
    }
  }

  const pieceColor = PIECE_COLORS[piece.colorIndex] ?? Colors.pieces[0];
  const height = Math.max(...piece.shape.map(([r]) => r - minR)) + 1;
  const width = Math.max(...piece.shape.map(([, c]) => c - minC)) + 1;

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[styles.container, isSelected && styles.selectedContainer]}
      activeOpacity={0.7}
    >
      <View style={[styles.grid, { height: height * PREVIEW_CELL, width: width * PREVIEW_CELL }]}>
        {grid.slice(0, height).map((row, r) => (
          <View key={r} style={styles.row}>
            {row.slice(0, width).map((filled, c) => (
              <View
                key={c}
                style={[
                  styles.cell,
                  filled && { backgroundColor: pieceColor },
                  !filled && styles.emptyCell,
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    minHeight: 60,
  },
  selectedContainer: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: PREVIEW_CELL - 1,
    height: PREVIEW_CELL - 1,
    margin: 0.5,
    borderRadius: 2,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
});
