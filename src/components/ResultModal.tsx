import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../theme';

interface ResultModalProps {
  visible: boolean;
  type: 'success' | 'fail';
  score: number;
  linesCleared: number;
  canRevive: boolean;
  onRevive: () => void;
  onNext: () => void;
  onRetry: () => void;
  isLastPuzzle: boolean;
  adReady: boolean;
}

export function ResultModal({
  visible,
  type,
  score,
  linesCleared,
  canRevive,
  onRevive,
  onNext,
  onRetry,
  isLastPuzzle,
  adReady,
}: ResultModalProps) {
  const isSuccess = type === 'success';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={[styles.header, isSuccess ? styles.successHeader : styles.failHeader]}>
            <Text style={styles.emoji}>{isSuccess ? '✓' : '×'}</Text>
            <Text style={styles.title}>
              {isSuccess ? 'クリア！' : '配置できません'}
            </Text>
          </View>

          {/* Stats (success only) */}
          {isSuccess && (
            <View style={styles.stats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>スコア</Text>
                <Text style={styles.statValue}>{score.toLocaleString()}</Text>
              </View>
              {linesCleared > 0 && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>ライン消去</Text>
                  <Text style={[styles.statValue, styles.bonusValue]}>+{linesCleared}</Text>
                </View>
              )}
            </View>
          )}

          {/* Fail message */}
          {!isSuccess && (
            <Text style={styles.failMessage}>
              残りのピースを置く場所がありません。
            </Text>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {/* Revive button (fail only, if not already used) */}
            {!isSuccess && canRevive && adReady && (
              <TouchableOpacity style={[styles.button, styles.reviveButton]} onPress={onRevive}>
                <Text style={styles.reviveButtonText}>
                  広告を見て復活する
                </Text>
                <Text style={styles.reviveSubText}>1枚スキップ</Text>
              </TouchableOpacity>
            )}

            {/* Next / Complete button */}
            {isSuccess && (
              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onNext}>
                <Text style={styles.primaryButtonText}>
                  {isLastPuzzle ? '今日の結果を見る' : '次の問題へ'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Retry button */}
            {!isSuccess && (
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onRetry}>
                <Text style={styles.secondaryButtonText}>もう一度挑戦</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 42, 38, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
  },
  header: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  successHeader: {
    backgroundColor: Colors.success,
  },
  failHeader: {
    backgroundColor: Colors.surfaceAlt,
  },
  emoji: {
    fontSize: 36,
    color: Colors.surface,
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
  stats: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statLabel: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  bonusValue: {
    color: Colors.success,
  },
  failMessage: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    lineHeight: 22,
  },
  actions: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  button: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.accent,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
  },
  secondaryButton: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  reviveButton: {
    backgroundColor: Colors.warning,
  },
  reviveButtonText: {
    color: Colors.surface,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  reviveSubText: {
    color: Colors.surface,
    fontSize: Typography.xs,
    opacity: 0.85,
    marginTop: 2,
  },
});
