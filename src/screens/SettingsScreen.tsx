import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Storage, AppSettings, DEFAULT_SETTINGS } from '../utils/storage';
import { SoundManager } from '../audio/SoundManager';
import { Colors, Typography, Spacing, Radii } from '../theme';
import { BannerAdView } from '../ads/BannerAdView';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

const PRIVACY_POLICY_URL = 'https://pro-koya.github.io/blockzen/?lang=ja';

export function SettingsScreen({ navigation }: Props) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    Storage.getSettings().then(setSettings);
  }, []);

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    const updated: AppSettings = { ...settings, [key]: value };
    setSettings(updated);
    await Storage.saveSettings(updated);
    SoundManager.updateSettings(updated);
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      const supported = await Linking.canOpenURL(PRIVACY_POLICY_URL);
      if (!supported) {
        Alert.alert('開けませんでした', 'プライバシーポリシーを開けませんでした。');
        return;
      }

      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch {
      Alert.alert('開けませんでした', 'プライバシーポリシーを開けませんでした。');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>バイブレーション</Text>
              <Text style={styles.settingDesc}>ピース配置やライン消去時の振動</Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(val) => updateSetting('vibrationEnabled', val)}
              trackColor={{ false: Colors.border, true: Colors.accentLight }}
              thumbColor={settings.vibrationEnabled ? Colors.accent : Colors.textMuted}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>効果音</Text>
              <Text style={styles.settingDesc}>ゲーム中のサウンドエフェクト</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(val) => updateSetting('soundEnabled', val)}
              trackColor={{ false: Colors.border, true: Colors.accentLight }}
              thumbColor={settings.soundEnabled ? Colors.accent : Colors.textMuted}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.linkCard}
          onPress={handleOpenPrivacyPolicy}
          activeOpacity={0.8}
        >
          <View style={styles.linkInfo}>
            <Text style={styles.linkLabel}>プライバシーポリシー</Text>
            <Text style={styles.linkDesc}>データの取り扱いについて確認できます</Text>
          </View>
          <Text style={styles.linkArrow}>↗</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
      <BannerAdView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.base,
  },
  backText: {
    fontSize: Typography.base,
    color: Colors.accent,
    fontWeight: Typography.medium,
  },
  title: {
    flex: 1,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  linkCard: {
    marginTop: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  linkInfo: {
    flex: 1,
    marginRight: Spacing.base,
  },
  linkLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  linkDesc: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  linkArrow: {
    fontSize: Typography.lg,
    color: Colors.accent,
    fontWeight: Typography.medium,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.base,
  },
  settingLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  settingDesc: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  versionText: {
    textAlign: 'center',
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xxl,
  },
});
