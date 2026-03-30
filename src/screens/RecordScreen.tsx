import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Storage, DailyRecord, StreakData } from '../utils/storage';
import { Analytics } from '../analytics';
import { Colors, Typography, Spacing, Radii } from '../theme';
import { BannerAdView } from '../ads/BannerAdView';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Record'>;
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

interface RankInfo {
  name: string;
  color: string;
  minDays: number;
}

const RANKS: RankInfo[] = [
  { name: '初心者', color: Colors.textMuted, minDays: 0 },
  { name: '見習い', color: Colors.pieces[5], minDays: 3 },
  { name: '中級者', color: Colors.accent, minDays: 7 },
  { name: '上級者', color: Colors.pieces[3], minDays: 15 },
  { name: '達人', color: Colors.warning, minDays: 30 },
  { name: '伝説', color: Colors.error, minDays: 50 },
];

function getRank(totalCompleteDays: number): RankInfo {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (totalCompleteDays >= r.minDays) rank = r;
  }
  return rank;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonth(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function RecordScreen({ navigation }: Props) {
  const [records, setRecords] = useState<Record<string, DailyRecord>>({});
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, lastPlayedDate: '', longestStreak: 0 });
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    Analytics.logScreen('RecordScreen');
    Storage.getDailyRecords().then(setRecords);
    Storage.getStreak().then(setStreak);
  }, []);

  const totalCompleteDays = useMemo(() => {
    return Object.values(records).filter(r => r.isDayComplete).length;
  }, [records]);

  const totalPlayedDays = useMemo(() => {
    return Object.keys(records).length;
  }, [records]);

  const rank = useMemo(() => getRank(totalCompleteDays), [totalCompleteDays]);

  const nextRank = useMemo(() => {
    const idx = RANKS.indexOf(rank);
    return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  }, [rank]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const today = new Date();
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const canGoNext = !isCurrentMonth;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  const getCellStyle = (day: number | null) => {
    if (day === null) return null;
    const key = dateKey(viewYear, viewMonth, day);
    const record = records[key];
    if (!record) return null;
    if (record.isDayComplete) return 'complete';
    if (record.completedCount > 0) return 'partial';
    return null;
  };

  const getCellLabel = (day: number | null) => {
    if (day === null) return '';
    const key = dateKey(viewYear, viewMonth, day);
    const record = records[key];
    if (!record) return '';
    if (record.isDayComplete) return `${record.completedCount}/${record.totalCount}`;
    return `${record.completedCount}/${record.totalCount}`;
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    return isCurrentMonth && day === today.getDate();
  };

  // Monthly stats
  const monthStats = useMemo(() => {
    let played = 0;
    let completed = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateKey(viewYear, viewMonth, d);
      const record = records[key];
      if (record) {
        played++;
        if (record.isDayComplete) completed++;
      }
    }
    return { played, completed };
  }, [records, viewYear, viewMonth, daysInMonth]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>記録</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Rank Card */}
        <View style={styles.rankCard}>
          <Text style={[styles.rankName, { color: rank.color }]}>{rank.name}</Text>
          <View style={styles.rankStats}>
            <View style={styles.rankStatItem}>
              <Text style={styles.rankStatValue}>{totalCompleteDays}</Text>
              <Text style={styles.rankStatLabel}>全問クリア</Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.rankStatItem}>
              <Text style={styles.rankStatValue}>{totalPlayedDays}</Text>
              <Text style={styles.rankStatLabel}>プレイ日数</Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.rankStatItem}>
              <Text style={styles.rankStatValue}>{streak.currentStreak}</Text>
              <Text style={styles.rankStatLabel}>連続記録</Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.rankStatItem}>
              <Text style={styles.rankStatValue}>{streak.longestStreak}</Text>
              <Text style={styles.rankStatLabel}>最長連続</Text>
            </View>
          </View>
          {nextRank && (
            <View style={styles.nextRankRow}>
              <Text style={styles.nextRankText}>
                次のランク「{nextRank.name}」まであと{nextRank.minDays - totalCompleteDays}日
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, (totalCompleteDays / nextRank.minDays) * 100)}%`,
                      backgroundColor: rank.color,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.monthNavArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{formatMonth(viewYear, viewMonth)}</Text>
            <TouchableOpacity
              onPress={handleNextMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={!canGoNext}
            >
              <Text style={[styles.monthNavArrow, !canGoNext && styles.monthNavDisabled]}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d, i) => (
              <View key={i} style={styles.weekCell}>
                <Text style={[styles.weekLabel, i === 0 && styles.sundayLabel, i === 6 && styles.saturdayLabel]}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                const status = getCellStyle(day);
                const todayFlag = isToday(day);
                const label = getCellLabel(day);
                return (
                  <View key={di} style={styles.dayCell}>
                    {day !== null ? (
                      <View
                        style={[
                          styles.dayInner,
                          status === 'complete' && styles.dayComplete,
                          status === 'partial' && styles.dayPartial,
                          todayFlag && styles.dayToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayNumber,
                            status === 'complete' && styles.dayNumberComplete,
                            todayFlag && !status && styles.dayNumberToday,
                          ]}
                        >
                          {day}
                        </Text>
                        {label !== '' && (
                          <Text
                            style={[
                              styles.dayStatus,
                              status === 'complete' && styles.dayStatusComplete,
                            ]}
                          >
                            {label}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View style={styles.dayInner} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Month summary */}
          <View style={styles.monthSummary}>
            <Text style={styles.monthSummaryText}>
              {monthStats.played > 0
                ? `${monthStats.completed}日全問クリア / ${monthStats.played}日プレイ`
                : 'この月のプレイ記録はありません'}
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>全問クリア</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.accentLight }]} />
            <Text style={styles.legendText}>一部クリア</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.accent, borderRadius: 99, width: 10, height: 10, borderWidth: 2, borderColor: Colors.accent }]} />
            <Text style={styles.legendText}>今日</Text>
          </View>
        </View>
      </ScrollView>
      <BannerAdView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backText: {
    fontSize: Typography.base,
    color: Colors.accent,
    fontWeight: Typography.medium,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },

  // Rank
  rankCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    marginHorizontal: Spacing.base,
    padding: Spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  rankName: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  rankStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  rankStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  rankStatValue: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  rankStatLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rankDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  nextRankRow: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextRankText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Calendar
  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.base,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  monthNavArrow: {
    fontSize: Typography.lg,
    color: Colors.accent,
    fontWeight: Typography.semibold,
    paddingHorizontal: Spacing.sm,
  },
  monthNavDisabled: {
    color: Colors.border,
  },
  monthLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  weekLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.textMuted,
  },
  sundayLabel: {
    color: Colors.error,
  },
  saturdayLabel: {
    color: Colors.accent,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  dayInner: {
    flex: 1,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayComplete: {
    backgroundColor: Colors.success,
  },
  dayPartial: {
    backgroundColor: Colors.accentLight,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  dayNumber: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  dayNumberComplete: {
    color: Colors.surface,
    fontWeight: Typography.semibold,
  },
  dayNumberToday: {
    color: Colors.accent,
    fontWeight: Typography.bold,
  },
  dayStatus: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: -1,
  },
  dayStatusComplete: {
    color: 'rgba(255,255,255,0.85)',
  },
  monthSummary: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  monthSummaryText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
});
