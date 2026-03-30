import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/gameStore';
import { Analytics } from '../analytics';
import { TrackingPermission } from '../privacy/tracking';
import { AdManager } from '../ads/AdManager';
import { OverlayModal } from '../components/OverlayModal';
import { Storage, DailyRecord, EndlessScoreEntry } from '../utils/storage';
import { getTodayString, formatDateJa } from '../utils/date';
import { Colors, Typography, Spacing, Radii } from '../theme';
import { BannerAdView } from '../ads/BannerAdView';
import { LoginBonusModal } from '../components/LoginBonusModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

function getDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = days[date.getDay()];
  return `${m}/${d}(${day})`;
}

export function HomeScreen({ navigation }: Props) {
  const daily = useGameStore(s => s.daily);
  const streak = useGameStore(s => s.streak);
  const isLoading = useGameStore(s => s.isLoading);
  const loadDailyState = useGameStore(s => s.loadDailyState);
  const startCurrentPuzzle = useGameStore(s => s.startCurrentPuzzle);
  const startEndless = useGameStore(s => s.startEndless);
  const startEndlessPuzzle = useGameStore(s => s.startEndlessPuzzle);
  const resumeEndless = useGameStore(s => s.resumeEndless);
  const [endlessHighScore, setEndlessHighScore] = useState(0);
  const [endlessBestLevel, setEndlessBestLevel] = useState(0);
  const [pastRecords, setPastRecords] = useState<Record<string, DailyRecord>>({});
  const [scoreHistory, setScoreHistory] = useState<EndlessScoreEntry[]>([]);
  const [hasPausedGame, setHasPausedGame] = useState(false);
  const [preparingLabel, setPreparingLabel] = useState<string | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showStreakProtection, setShowStreakProtection] = useState(false);
  const [loginBonusDay, setLoginBonusDay] = useState(0);
  const [showLoginBonus, setShowLoginBonus] = useState(false);
  const streakBroken = useGameStore(s => s.streakBroken);
  const protectStreak = useGameStore(s => s.protectStreak);
  const preparingRef = useRef(false);
  const pendingActionRef = useRef<(() => Promise<void> | void) | null>(null);

  const loadAllData = async () => {
    const [, records, highScore, bestLevel, history, paused] = await Promise.all([
      loadDailyState(),
      Storage.getDailyRecords(),
      Storage.getEndlessHighScore(),
      Storage.getEndlessBestLevel(),
      Storage.getEndlessScoreHistory(),
      Storage.getEndlessPausedState(),
    ]);
    setPastRecords(records);
    setEndlessHighScore(highScore);
    setEndlessBestLevel(bestLevel);
    setScoreHistory(history);
    setHasPausedGame(paused !== null);
  };

  useEffect(() => {
    Analytics.logScreen('HomeScreen');
    loadAllData().then(async () => {
      const seen = await Storage.hasSeenHowTo();
      if (!seen) {
        navigation.navigate('HowToPlay');
        return;
      }
      // Check login bonus after data loaded
      const bonus = await Storage.claimLoginBonus(getTodayString());
      if (bonus.isNew) {
        setLoginBonusDay(bonus.day);
        setShowLoginBonus(true);
        Analytics.logEvent('login_bonus_shown', { day: bonus.day });
      }
    });
  }, []);

  // Reload data when returning from Game (no loading flash)
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setPreparingLabel(null);
      preparingRef.current = false;
      loadAllData();
    });
    return unsub;
  }, [navigation, loadDailyState]);

  // Show streak protection modal when streak is broken
  useEffect(() => {
    if (streakBroken && streakBroken.previousStreak >= 2) {
      setShowStreakProtection(true);
    }
  }, [streakBroken]);

  const handleProtectStreak = () => {
    setShowStreakProtection(false);
    AdManager.showRewarded(async (success) => {
      if (success) {
        await protectStreak();
        Analytics.logEvent('streak_protection_ad_watched', {
          streak_saved: streakBroken?.previousStreak ?? 0,
        });
      }
    }, 'streak_protection');
  };

  const handleDismissStreakProtection = () => {
    setShowStreakProtection(false);
  };

  const runPendingAction = async () => {
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;
    if (!pendingAction) return;
    await Promise.resolve(pendingAction());
  };

  const runWithTrackingPrompt = async (action: () => Promise<void> | void) => {
    const shouldShowPrompt = await TrackingPermission.shouldShowPrePrompt();
    if (!shouldShowPrompt) {
      await Promise.resolve(action());
      return;
    }

    pendingActionRef.current = action;
    setShowTrackingModal(true);
    Analytics.logEvent('tracking_preprompt_shown', {});
  };

  const handleTrackingAllow = async () => {
    setShowTrackingModal(false);
    const status = await TrackingPermission.requestSystemPermission();
    Analytics.logEvent('tracking_permission_result', { status });
    await AdManager.initialize();
    await runPendingAction();
  };

  const handleTrackingSkip = async () => {
    setShowTrackingModal(false);
    await Storage.markTrackingPromptHandled();
    Analytics.logEvent('tracking_preprompt_skipped', {});
    await AdManager.initialize();
    await runPendingAction();
  };


  const handleStart = () => {
    void runWithTrackingPrompt(() => {
      if (!daily || daily.isDayComplete || preparingRef.current) return;
      preparingRef.current = true;
      setPreparingLabel('パズルを準備中...');
      setTimeout(() => {
        startCurrentPuzzle();
        navigation.navigate('Game');
        setPreparingLabel(null);
        preparingRef.current = false;
      }, 50);
    });
  };

  const handleContinue = () => {
    void runWithTrackingPrompt(() => {
      if (!daily || preparingRef.current) return;
      preparingRef.current = true;
      setPreparingLabel('パズルを準備中...');
      setTimeout(() => {
        startCurrentPuzzle();
        navigation.navigate('Game');
        setPreparingLabel(null);
        preparingRef.current = false;
      }, 50);
    });
  };

  const handleEndless = async () => {
    await runWithTrackingPrompt(async () => {
      if (preparingRef.current) return;
      preparingRef.current = true;
      setPreparingLabel('パズルを生成中...');
      await startEndless();
      startEndlessPuzzle();
      navigation.navigate('EndlessGame');
      setPreparingLabel(null);
      preparingRef.current = false;
    });
  };

  const handleResumeEndless = async () => {
    await runWithTrackingPrompt(async () => {
      if (preparingRef.current) return;
      preparingRef.current = true;
      setPreparingLabel('ゲームを再開中...');
      const success = await resumeEndless();
      if (success) {
        navigation.navigate('EndlessGame');
      }
      setPreparingLabel(null);
      preparingRef.current = false;
    });
  };

  const handlePastDate = async (dateStr: string) => {
    await runWithTrackingPrompt(async () => {
      if (preparingRef.current) return;
      preparingRef.current = true;
      setPreparingLabel('パズルを準備中...');
      await loadDailyState(dateStr);
      startCurrentPuzzle();
      navigation.navigate('Game', { date: dateStr });
      setPreparingLabel(null);
      preparingRef.current = false;
    });
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

  // Past 6 days (not including today)
  const pastDays: { date: string; record: DailyRecord | null }[] = [];
  for (let i = 1; i <= 6; i++) {
    const dateStr = getDateString(i);
    pastDays.push({ date: dateStr, record: pastRecords[dateStr] ?? null });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Calm Blokku</Text>
          <Text style={styles.dateLabel}>{formatDateJa(today)}</Text>
        </View>

        {/* Daily status card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>今日のパズル</Text>
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

        {/* Past week card */}
        <View style={styles.pastCard}>
          <Text style={styles.cardTitle}>過去の問題</Text>
          <Text style={styles.pastDesc}>過去1週間分の問題に挑戦できます</Text>
          {pastDays.map(({ date, record }) => {
            const isComplete = record?.isDayComplete ?? false;
            const completed = record?.completedCount ?? 0;
            const total = record?.totalCount ?? 3;
            return (
              <View key={date} style={styles.pastRow}>
                <Text style={styles.pastDate}>{formatShortDate(date)}</Text>
                <View style={styles.pastStatus}>
                  {isComplete ? (
                    <Text style={styles.pastCompleteText}>全問クリア</Text>
                  ) : completed > 0 ? (
                    <Text style={styles.pastPartialText}>{completed}/{total} クリア</Text>
                  ) : (
                    <Text style={styles.pastUnplayedText}>未プレイ</Text>
                  )}
                </View>
                {!isComplete ? (
                  <TouchableOpacity
                    style={styles.pastPlayButton}
                    onPress={() => handlePastDate(date)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pastPlayText}>
                      {completed > 0 ? '続きから' : '挑戦'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.pastDoneBadge}>
                    <Text style={styles.pastDoneText}>完了</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Endless mode card */}
        <View style={styles.endlessCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>エンドレスモード</Text>
          </View>
          <Text style={styles.endlessDesc}>失敗するまで問題を解き続けよう</Text>
          {endlessHighScore > 0 && (
            <View style={styles.endlessRecords}>
              <Text style={styles.endlessRecordText}>
                ハイスコア: {endlessHighScore.toLocaleString()}
              </Text>
              <Text style={styles.endlessRecordText}>
                最高レベル: {endlessBestLevel}
              </Text>
            </View>
          )}
          {hasPausedGame ? (
            <View style={styles.endlessButtons}>
              <TouchableOpacity
                style={[styles.endlessButton, { backgroundColor: Colors.accent, borderColor: Colors.accent }]}
                onPress={handleResumeEndless}
                activeOpacity={0.8}
              >
                <Text style={[styles.endlessButtonText, { color: Colors.surface }]}>続きから再開</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.endlessButton}
                onPress={handleEndless}
                activeOpacity={0.8}
              >
                <Text style={styles.endlessButtonText}>新規プレイ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.endlessButton}
              onPress={handleEndless}
              activeOpacity={0.8}
            >
              <Text style={styles.endlessButtonText}>プレイ開始</Text>
            </TouchableOpacity>
          )}

          {/* Top 10 score history */}
          {scoreHistory.length > 0 && (
            <View style={styles.scoreHistorySection}>
              <Text style={styles.scoreHistoryTitle}>スコア履歴 TOP {scoreHistory.length}</Text>
              {scoreHistory.map((entry, i) => (
                <View key={i} style={styles.scoreHistoryRow}>
                  <Text style={styles.scoreHistoryRank}>
                    {i + 1}.
                  </Text>
                  <Text style={styles.scoreHistoryScore}>
                    {entry.score.toLocaleString()}
                  </Text>
                  <Text style={styles.scoreHistoryMeta}>
                    Lv.{entry.level}
                  </Text>
                  <Text style={styles.scoreHistoryDate}>
                    {entry.date}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Streak */}
        {streak > 0 && !isDayComplete && (
          <View style={styles.streakCard}>
            <Text style={styles.streakIcon}>◈</Text>
            <Text style={styles.streakCardText}>{streak}日連続プレイ中</Text>
          </View>
        )}

        {/* Record link */}
        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => navigation.navigate('Record')}
          activeOpacity={0.8}
        >
          <Text style={styles.recordButtonText}>記録を見る</Text>
        </TouchableOpacity>

        {/* Settings & How to play links */}
        <View style={styles.bottomLinks}>
          <TouchableOpacity
            style={styles.bottomLink}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.bottomLinkText}>設定</Text>
          </TouchableOpacity>
          <Text style={styles.bottomLinkSep}>|</Text>
          <TouchableOpacity
            style={styles.bottomLink}
            onPress={() => navigation.navigate('HowToPlay')}
          >
            <Text style={styles.bottomLinkText}>遊び方</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Preparing overlay */}
      <OverlayModal visible={preparingLabel !== null}>
        <View style={styles.preparingOverlay}>
          <View style={styles.preparingCard}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.preparingText}>{preparingLabel}</Text>
          </View>
        </View>
      </OverlayModal>

      {/* Streak Protection Modal */}
      <OverlayModal visible={showStreakProtection}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>ストリークが途切れそうです！</Text>
            <Text style={styles.modalBody}>
              {streakBroken?.previousStreak ?? 0}日連続のストリークが途切れてしまいます。{'\n'}
              広告を見てストリークを守りましょう！
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={handleProtectStreak}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryText}>広告を見て守る</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSkipButton}
              onPress={handleDismissStreakProtection}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSkipText}>あきらめる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </OverlayModal>

      <OverlayModal visible={showTrackingModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>広告の表示について</Text>
            <Text style={styles.modalBody}>
              このアプリは広告収益で無料運営しています。次に表示される確認で許可すると、より関連性の高い広告表示に役立ちます。
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={handleTrackingAllow}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryText}>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSkipButton}
              onPress={handleTrackingSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSkipText}>スキップ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </OverlayModal>

      {/* Login Bonus Modal */}
      <LoginBonusModal
        visible={showLoginBonus}
        currentDay={loginBonusDay}
        onClose={() => setShowLoginBonus(false)}
      />

      {/* Banner Ad */}
      <BannerAdView />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
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

  // Past week
  pastCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    marginTop: Spacing.base,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  pastDesc: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.base,
  },
  pastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pastDate: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    width: 80,
  },
  pastStatus: {
    flex: 1,
  },
  pastCompleteText: {
    fontSize: Typography.sm,
    color: Colors.success,
    fontWeight: Typography.medium,
  },
  pastPartialText: {
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: Typography.medium,
  },
  pastUnplayedText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  pastPlayButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  pastPlayText: {
    fontSize: Typography.sm,
    color: Colors.surface,
    fontWeight: Typography.semibold,
  },
  pastDoneBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  pastDoneText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },

  // Endless
  endlessCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    marginTop: Spacing.base,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  endlessDesc: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  endlessRecords: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  endlessRecordText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  endlessButton: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  endlessButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
  },
  endlessButtons: {
    gap: Spacing.sm,
  },
  scoreHistorySection: {
    marginTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  scoreHistoryTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  scoreHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  scoreHistoryRank: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    width: 24,
  },
  scoreHistoryScore: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  scoreHistoryMeta: {
    fontSize: Typography.xs,
    color: Colors.accent,
    fontWeight: Typography.medium,
    marginRight: Spacing.sm,
  },
  scoreHistoryDate: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
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
  recordButton: {
    alignItems: 'center',
    marginTop: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordButtonText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  bottomLink: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  bottomLinkText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  bottomLinkSep: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 42, 38, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalBody: {
    fontSize: Typography.base,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalPrimaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  modalPrimaryText: {
    color: Colors.surface,
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
  },
  modalSkipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalSkipText: {
    fontSize: Typography.base,
    color: Colors.textMuted,
  },
  preparingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(245, 240, 232, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preparingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  preparingText: {
    fontSize: Typography.md,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.base,
  },
});
