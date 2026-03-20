import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/gameStore';
import { Analytics } from '../analytics';
import { Colors, Typography, Spacing, Radii } from '../theme';
import { formatDateJa, getTodayString } from '../utils/date';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DailyComplete'>;
};

export function DailyCompleteScreen({ navigation }: Props) {
  const { daily, streak } = useGameStore();

  useEffect(() => {
    Analytics.logScreen('DailyCompleteScreen');
  }, []);

  const totalScore = daily?.totalDayScore ?? 0;
  const puzzleCount = daily?.completedPuzzleIds.length ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.title}>今日のパズル完了！</Text>
          <Text style={styles.dateText}>{formatDateJa(getTodayString())}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>合計スコア</Text>
            <Text style={styles.statValue}>{totalScore.toLocaleString()}</Text>
          </View>
          <View style={[styles.statRow, styles.statRowLast]}>
            <Text style={styles.statLabel}>クリア問題数</Text>
            <Text style={styles.statValue}>{puzzleCount}問</Text>
          </View>
        </View>

        {/* Streak */}
        {streak > 0 && (
          <View style={styles.streakSection}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>日連続プレイ</Text>
            {streak >= 3 && (
              <Text style={styles.streakMessage}>
                {streak >= 7 ? '素晴らしい継続力です！' : '調子いいですね！'}
              </Text>
            )}
          </View>
        )}

        {/* Tomorrow message */}
        <View style={styles.tomorrowCard}>
          <Text style={styles.tomorrowTitle}>明日も新しいパズルが届きます</Text>
          <Text style={styles.tomorrowSub}>毎日続けることで、思考力が磨かれます。</Text>
        </View>

        {/* Home button */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeButtonText}>ホームに戻る</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  checkmark: {
    fontSize: 56,
    color: Colors.success,
    fontWeight: Typography.bold,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  dateText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    width: '100%',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.base,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statRowLast: {
    borderBottomWidth: 0,
  },
  statLabel: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  streakSection: {
    alignItems: 'center',
    paddingVertical: Spacing.base,
    marginBottom: Spacing.base,
  },
  streakNumber: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    color: Colors.accent,
    lineHeight: 46,
  },
  streakLabel: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  streakMessage: {
    fontSize: Typography.sm,
    color: Colors.accent,
    marginTop: Spacing.xs,
    fontWeight: Typography.medium,
  },
  tomorrowCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  tomorrowTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  tomorrowSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xxxl,
    alignItems: 'center',
  },
  homeButtonText: {
    color: Colors.surface,
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
  },
});
