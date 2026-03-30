import React, { useRef } from 'react';
import { View, StyleSheet, Animated, PanResponder } from 'react-native';
import { Piece } from '../game/types';
import { Colors, Radii, Spacing } from '../theme';

const PREVIEW_CELL = 16;
const GRID_SIZE = 5;
const DRAG_THRESHOLD = 8;

interface PiecePreviewProps {
  piece: Piece;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  isDragging?: boolean;
  onDragStart?: (index: number, pageX: number, pageY: number) => void;
  onDragMove?: (pageX: number, pageY: number) => void;
  onDragEnd?: (pageX: number, pageY: number) => void;
}

const PIECE_COLORS = [Colors.boardBg, ...Colors.pieces];

export function PiecePreview({
  piece,
  isSelected,
  onSelect,
  index,
  isDragging = false,
  onDragStart,
  onDragMove,
  onDragEnd,
}: PiecePreviewProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const draggingRef = useRef(false);

  // Use refs for callbacks so PanResponder always has fresh values
  const callbacksRef = useRef({ onDragStart, onDragMove, onDragEnd, onSelect, index });
  callbacksRef.current = { onDragStart, onDragMove, onDragEnd, onSelect, index };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Touch started — not sure if drag or tap yet
        draggingRef.current = false;
      },
      onPanResponderMove: (_evt, gs) => {
        if (!draggingRef.current) {
          if (Math.abs(gs.dx) > DRAG_THRESHOLD || Math.abs(gs.dy) > DRAG_THRESHOLD) {
            draggingRef.current = true;
            Animated.spring(scaleAnim, {
              toValue: 0.6,
              tension: 300,
              friction: 15,
              useNativeDriver: true,
            }).start();
            callbacksRef.current.onDragStart?.(
              callbacksRef.current.index,
              gs.moveX,
              gs.moveY,
            );
          }
        } else {
          callbacksRef.current.onDragMove?.(gs.moveX, gs.moveY);
        }
      },
      onPanResponderRelease: (_evt, gs) => {
        if (draggingRef.current) {
          draggingRef.current = false;
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 300,
            friction: 15,
            useNativeDriver: true,
          }).start();
          callbacksRef.current.onDragEnd?.(gs.moveX, gs.moveY);
        } else {
          // It was a tap
          callbacksRef.current.onSelect();
        }
      },
      onPanResponderTerminate: (_evt, gs) => {
        if (draggingRef.current) {
          draggingRef.current = false;
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 300,
            friction: 15,
            useNativeDriver: true,
          }).start();
          callbacksRef.current.onDragEnd?.(gs.moveX, gs.moveY);
        }
      },
    })
  ).current;

  // Build mini grid
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
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
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: isDragging ? 0.3 : 1,
        },
      ]}
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
    </Animated.View>
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
