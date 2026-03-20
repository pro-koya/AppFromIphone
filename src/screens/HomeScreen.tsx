import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/gameStore';
import { AdManager } from '../ads/AdManager';
import { Analytics } from '../analytics';
import { Storage } from '../utils/storage';
import { getTodayString, formatDateJa } from '../utils/date';
import { Colors, Typography, Spacing, Radii } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  const { daily, streak, isLoading, loadDailyState, startCurrentPuzzle } = useGameStore();

  useEffect(() => {
    Analytics.logScreen('HomeScreen');
    AdManager.initialize();
    loadDailyState().then(async () => {
      const seen = await Storage.hasSeenHowTo();
      if (!seen) {
        navigation.navigate('HowToPlay');
      }
    });
  }, []);

  const handleStart = () => {
    if (!daily) return;
    if (daily.isDayComplete) return;
    startCurrentPuzzle();
    navigation.navigate('Game');
  };

  const handleContinue = () => {
    if (!daily) return;
    startCurrentPuzzle();
    navigation.navigate('Game');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const today = getTodayString();
  const completedCount = daily?.completedPuzzleIds.length ?? 0;
  const totalCount = daily?.puzzles.length ?? 0;
  const isDayComplete = daily?.isDayComplete ?? false;
  const isInProgress = completedCount > 0 && !isDayComplete;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Daily Block Puzzle</Text>
          <Text style={styles.dateLabel}>{formatDateJa(today)}</Text>
        </View>

        {/* Daily status card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Puzzles</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                {isDayComplete ? '完了' : `${completedCount} / ${totalCount}`}
              </Text>
            </View>
          </View>

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {Array.from({ length: totalCount }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < completedCount ? styles.dotCompleted : styles.dotPending,
                  i === completedCount && !isDayComplete && styles.dotCurrent,
                ]}
              />
            ))}
          </View>

          {isDayComplete ? (
            <View style={styles.completedSection}>
              <Text style={styles.completedTitle}>今日はすべてクリア！</Text>
              <Text style={styles.completedSub}>また明日チャレンジしよう</Text>
              {streak > 1 && (
                <Text style={styles.streakText}>{streak}日連続プレイ中</Text>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.startButton}
              onPress={isInProgress ? handleContinue : handleStart}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>
                {isInProgress ? `第${completedCount + 1}問に挑戦` : '今日のパズルを解く'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Streak */}
        {streak > 0 && !isDayComplete && (
          <View style={styles.streakCard}>
            <Text style={styles.streakIcon}>◈</Text>
            <Text style={styles.streakCardText}>{streak}日連続プレイ中</Text>
          </View>
        )}

        {/* How to play link */}
        <TouchableOpacity
          style={styles.howToLink}
          onPress={() => navigation.navigate('HowToPlay')}
        >
          <Text style={styles.howToLinkText}>遊び方を見る</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  dateLabel: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  cardTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  progressBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.round,
  },
  progressText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.accent,
  },
  progressDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotCompleted: {
    backgroundColor: Colors.success,
  },
  dotPending: {
    backgroundColor: Colors.border,
  },
  dotCurrent: {
    backgroundColor: Colors.accent,
    transform: [{ scale: 1.2 }],
  },
  completedSection: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  completedTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  completedSub: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  streakText: {
    fontSize: Typography.sm,
    color: Colors.accent,
    marginTop: Spacing.sm,
    fontWeight: Typography.medium,
  },
  startButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  startButtonText: {
    color: Colors.surface,
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  streakIcon: {
    fontSize: Typography.base,
    color: Colors.accent,
  },
  streakCardText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  howToLink: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.sm,
  },
  howToLinkText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
