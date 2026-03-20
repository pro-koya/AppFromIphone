import React from 'react';
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
import { Storage } from '../utils/storage';
import { Analytics } from '../analytics';
import { Colors, Typography, Spacing, Radii } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'HowToPlay'>;
};

const STEPS = [
  {
    step: '1',
    title: 'ピースを選ぶ',
    desc: '画面下のピースをタップして選択します。',
  },
  {
    step: '2',
    title: 'ボードに置く',
    desc: '選んだピースを置きたいマスをタップすると配置されます。有効な場所は水色でハイライトされます。',
  },
  {
    step: '3',
    title: 'ラインを消す',
    desc: '横一列または縦一列を埋めると消えてスコアが入ります。',
  },
  {
    step: '4',
    title: '全ピースを置けばクリア',
    desc: 'すべてのピースをボードに置くとクリアです。置けなくなったら失敗ですが、広告を見て1回だけ復活できます。',
  },
];

export function HowToPlayScreen({ navigation }: Props) {
  const handleClose = async () => {
    await Storage.markHowToSeen();
    Analytics.logEvent('howto_closed', {});
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>遊び方</Text>
          <Text style={styles.subtitle}>Daily Block Puzzle</Text>
        </View>

        {STEPS.map((item) => (
          <View key={item.step} style={styles.stepCard}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>{item.step}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        {/* Daily explanation */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Daily モードについて</Text>
          <Text style={styles.infoText}>
            毎日1〜3問の新しい問題が届きます。{'\n'}
            毎日プレイすることでストリーク（連続日数）が増えます。{'\n'}
            クリアした問題は当日中いつでも振り返られます。
          </Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.8}>
          <Text style={styles.closeButtonText}>わかった、はじめよう</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumber: {
    color: Colors.surface,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  infoCard: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.surface,
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
  },
});
