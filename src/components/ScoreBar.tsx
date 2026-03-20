import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

interface ScoreBarProps {
  score: number;
  linesCleared: number;
  puzzleOrder: number;
  totalPuzzles: number;
}

export function ScoreBar({ score, linesCleared, puzzleOrder, totalPuzzles }: ScoreBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{score.toLocaleString()}</Text>
        <Text style={styles.statLabel}>スコア</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.statValue}>{linesCleared}</Text>
        <Text style={styles.statLabel}>消去</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.statValue}>{puzzleOrder} / {totalPuzzles}</Text>
        <Text style={styles.statLabel}>問目</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  statValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
});
