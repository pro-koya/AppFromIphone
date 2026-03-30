import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Piece } from '../game/types';
import { PiecePreview } from './PiecePreview';
import { Colors, Typography, Spacing } from '../theme';

interface PieceSelectorProps {
  pieces: Piece[];
  selectedIndex: number | null;
  onSelectPiece: (index: number) => void;
  draggingIndex: number | null;
  onDragStart: (index: number, pageX: number, pageY: number) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: (pageX: number, pageY: number) => void;
}

export function PieceSelector({
  pieces,
  selectedIndex,
  onSelectPiece,
  draggingIndex,
  onDragStart,
  onDragMove,
  onDragEnd,
}: PieceSelectorProps) {
  if (pieces.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        ドラッグして配置 / タップで選択
      </Text>
      <View style={styles.pieces}>
        {pieces.map((piece, index) => (
          <PiecePreview
            key={piece.id}
            piece={piece}
            isSelected={selectedIndex === index}
            onSelect={() => onSelectPiece(index)}
            index={index}
            isDragging={draggingIndex === index}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  label: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  pieces: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
});
