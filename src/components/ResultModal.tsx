import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../theme';
import { OverlayModal } from './OverlayModal';
import { StarDisplay } from './StarDisplay';

interface ResultModalProps {
  visible: boolean;
  type: 'success' | 'fail';
  score: number;
  linesCleared: number;
  canRevive: boolean;
  piecesRemaining: number;
  onRevive: () => void;
  onNext: () => void;
  onRetry: () => void;
  isLastPuzzle: boolean;
  adReady: boolean;
  comboCount?: number;
  stars?: number;
}

export function ResultModal({
  visible,
  type,
  score,
  linesCleared,
  canRevive,
  piecesRemaining,
  onRevive,
  onNext,
  onRetry,
  isLastPuzzle,
  adReady,
  comboCount,
  stars,
}: ResultModalProps) {
  const isSuccess = type === 'success';

  return (
    <OverlayModal visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={[styles.header, isSuccess ? styles.successHeader : styles.failHeader]}>
            <Text style={styles.emoji}>{isSuccess ? '✓' : '×'}</Text>
            <Text style={styles.title}>
              {isSuccess ? 'クリア！' : '配置できません'}
            </Text>
          </View>

          {/* Star rating (success only) */}
          {isSuccess && stars != null && stars > 0 && (
            <View style={styles.starSection}>
              <StarDisplay stars={stars} animate size="lg" />
            </View>
          )}

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
              {(comboCount ?? 0) >= 2 && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>最大コンボ</Text>
                  <Text style={[styles.statValue, styles.comboValue]}>x{comboCount}</Text>
                </View>
              )}
            </View>
          )}

          {/* Fail message */}
          {!isSuccess && (
            <Text style={styles.failMessage}>
              {piecesRemaining > 0
                ? '残りのピースを置く場所がありません。'
                : 'ラインが消去されていません。正しい位置にピースを配置しましょう。'}
            </Text>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {/* Retry button (fail) — watch ad if available, otherwise plain retry */}
            {!isSuccess && canRevive && adReady && (
              <TouchableOpacity style={[styles.button, styles.reviveButton]} onPress={onRevive}>
                <Text style={styles.reviveButtonText}>
                  広告を見てやり直す
                </Text>
              </TouchableOpacity>
            )}
            {!isSuccess && (!canRevive || !adReady) && (
              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onRetry}>
                <Text style={styles.primaryButtonText}>やり直す</Text>
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

            {/* Retry on success — optional re-attempt */}
            {isSuccess && (
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onRetry}>
                <Text style={styles.secondaryButtonText}>もう一度挑戦する</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </OverlayModal>
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
  starSection: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
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
  comboValue: {
    color: Colors.warning,
    fontWeight: Typography.bold,
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
