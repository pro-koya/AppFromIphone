import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../theme';
import { OverlayModal } from './OverlayModal';

interface LoginBonusModalProps {
  visible: boolean;
  currentDay: number; // 1-7
  onClose: () => void;
}

const DAY_MESSAGES: Record<number, string> = {
  1: '今日も来てくれてありがとう！',
  2: '2日目！いいペースです。',
  3: '3日連続！習慣になってきましたね。',
  4: '4日目！半分超えました。',
  5: '5日目！あと少しで7日達成！',
  6: '6日目！明日で1週間コンプリート！',
  7: '7日連続ログイン達成！素晴らしい！',
};

/**
 * 7-day login bonus calendar modal.
 * Each day shows a stamp; the current day animates in.
 */
export function LoginBonusModal({ visible, currentDay, onClose }: LoginBonusModalProps) {
  const stampScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && currentDay > 0) {
      stampScale.setValue(0);
      Animated.spring(stampScale, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
        delay: 300,
      }).start();
    }
  }, [visible, currentDay]);

  const message = DAY_MESSAGES[currentDay] ?? '';

  return (
    <OverlayModal visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>ログインボーナス</Text>
          <Text style={styles.subtitle}>{message}</Text>

          {/* 7-day calendar grid */}
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const claimed = day < currentDay;
              const isCurrent = day === currentDay;
              const future = day > currentDay;

              return (
                <View key={day} style={styles.dayCell}>
                  {isCurrent ? (
                    <Animated.View
                      style={[
                        styles.stamp,
                        styles.stampCurrent,
                        { transform: [{ scale: stampScale }] },
                      ]}
                    >
                      <Text style={styles.stampText}>{'\u2713'}</Text>
                    </Animated.View>
                  ) : claimed ? (
                    <View style={[styles.stamp, styles.stampClaimed]}>
                      <Text style={styles.stampText}>{'\u2713'}</Text>
                    </View>
                  ) : (
                    <View style={[styles.stamp, future ? styles.stampFuture : styles.stampEmpty]}>
                      <Text style={[styles.dayNumber, future && styles.dayNumberFuture]}>
                        {day}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.dayLabel, isCurrent && styles.dayLabelCurrent]}>
                    Day {day}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Progress indicator */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentDay / 7) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{currentDay}/7</Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </OverlayModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 42, 38, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dayCell: {
    alignItems: 'center',
    width: 38,
  },
  stamp: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampClaimed: {
    backgroundColor: Colors.success,
  },
  stampCurrent: {
    backgroundColor: Colors.warning,
  },
  stampEmpty: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stampFuture: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  stampText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
  dayNumber: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textMuted,
  },
  dayNumberFuture: {
    color: Colors.border,
  },
  dayLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dayLabelCurrent: {
    color: Colors.warning,
    fontWeight: Typography.semibold,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  closeButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
    alignItems: 'center',
    width: '100%',
  },
  closeButtonText: {
    color: Colors.surface,
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
  },
});
