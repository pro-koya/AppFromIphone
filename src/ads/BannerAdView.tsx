/**
 * BannerAdView: Wrapper for Google AdMob banner ads.
 *
 * - In __DEV__ mode, renders a placeholder view instead of real ads
 * - In production, renders an anchored adaptive banner
 * - Gracefully handles load failures (renders nothing)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Colors, Typography, Spacing } from '../theme';

const extra = Constants.expoConfig?.extra ?? {};
const isTestMode = __DEV__ || process.env.EXPO_PUBLIC_APP_VARIANT === 'testflight';

// Google test banner IDs
const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2435281174';
const TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';

const BANNER_AD_UNIT_ID = isTestMode
  ? Platform.select({ ios: TEST_BANNER_IOS, android: TEST_BANNER_ANDROID }) ?? ''
  : Platform.select({
      ios: extra.admobBannerIos ?? '',
      android: extra.admobBannerAndroid ?? '',
    }) ?? '';

// Dynamically load banner component (only in production)
let BannerAdComponent: React.ComponentType<any> | null = null;
let BannerAdSize: any = null;

if (!__DEV__) {
  try {
    const mobileAdsModule = require('react-native-google-mobile-ads');
    BannerAdComponent = mobileAdsModule.BannerAd;
    BannerAdSize = mobileAdsModule.BannerAdSize;
  } catch {
    // SDK not available
  }
}

export function BannerAdView() {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  // Dev mode: show placeholder
  if (__DEV__ || !BannerAdComponent || !BannerAdSize) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>AD</Text>
      </View>
    );
  }

  // Production: real banner
  return (
    <View style={styles.container}>
      <BannerAdComponent
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setHasError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.adBg,
  },
  placeholder: {
    height: 50,
    backgroundColor: Colors.adBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  placeholderText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
});
