import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

interface ScoreBarProps {
  score: number;
  linesCleared: number;
  puzzleOrder: number;
  totalPuzzles: number;
  scoreScale?: Animated.Value;
  comboCount?: number;
}

export function ScoreBar({ score, linesCleared, puzzleOrder, totalPuzzles, scoreScale, comboCount }: ScoreBarProps) {
  const ScoreText = scoreScale ? Animated.Text : Text;
  const scoreStyle = scoreScale
    ? [styles.statValue, { transform: [{ scale: scoreScale }] }]
    : [styles.statValue];

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <ScoreText style={scoreStyle}>{score.toLocaleString()}</ScoreText>
        <Text style={styles.statLabel}>スコア</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.statValue}>{linesCleared}</Text>
        <Text style={styles.statLabel}>消去</Text>
      </View>
      {(comboCount ?? 0) >= 2 ? (
        <>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.comboValue}>x{comboCount}</Text>
            <Text style={styles.comboLabel}>COMBO</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{puzzleOrder} / {totalPuzzles}</Text>
            <Text style={styles.statLabel}>問目</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
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
  comboValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.warning,
  },
  comboLabel: {
    fontSize: Typography.xs,
    color: Colors.warning,
    fontWeight: Typography.semibold,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
});
