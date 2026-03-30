/**
 * AdManager: Centralized ad management with Google Mobile Ads (AdMob).
 *
 * - 開発中（__DEV__）はスタブ動作にフォールバック
 * - 本番ビルドでは react-native-google-mobile-ads を使用
 *
 * 環境変数（.env）:
 *   EXPO_PUBLIC_ADMOB_REWARDED_IOS / ANDROID
 *   EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS / ANDROID
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Analytics } from '../analytics';

type AdCallback = (success: boolean) => void;

// Google 公式テスト広告ユニットID（開発時のみ使用）
const TEST_REWARDED_IOS = 'ca-app-pub-3940256099942544/1712485313';
const TEST_REWARDED_ANDROID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_INTERSTITIAL_IOS = 'ca-app-pub-3940256099942544/4411468910';
const TEST_INTERSTITIAL_ANDROID = 'ca-app-pub-3940256099942544/1033173712';

// 本番IDは app.json の extra から取得（EAS Build でも確実に含まれる）
const extra = Constants.expoConfig?.extra ?? {};

// Task 6: Use test IDs when __DEV__ OR testflight build
const isTestMode = __DEV__ || process.env.EXPO_PUBLIC_APP_VARIANT === 'testflight';

const REWARDED_AD_UNIT_ID = isTestMode
  ? Platform.select({ ios: TEST_REWARDED_IOS, android: TEST_REWARDED_ANDROID }) ?? ''
  : Platform.select({
      ios: extra.admobRewardedIos ?? '',
      android: extra.admobRewardedAndroid ?? '',
    }) ?? '';

const INTERSTITIAL_AD_UNIT_ID = isTestMode
  ? Platform.select({ ios: TEST_INTERSTITIAL_IOS, android: TEST_INTERSTITIAL_ANDROID }) ?? ''
  : Platform.select({
      ios: extra.admobInterstitialIos ?? '',
      android: extra.admobInterstitialAndroid ?? '',
    }) ?? '';

let MobileAds: any;
let RewardedAd: any;
let InterstitialAd: any;
let RewardedAdEventType: any;
let AdEventType: any;

// Task 3: Store SDK load result in a module-level const; class field holds runtime state.
// __DEV__ ではネイティブ広告 SDK を使用しない
// 理由: シミュレータでの show() がネイティブ ViewController を一瞬表示→即閉じする際に
// 透明なオーバーレイが残り、React Native のタッチイベントを完全にブロックする問題がある。
// 本番ビルドのみ実 SDK を使用する。
let sdkModuleLoaded = false;
if (!__DEV__) {
  try {
    const mobileAdsModule = require('react-native-google-mobile-ads');
    MobileAds = mobileAdsModule.default;
    RewardedAd = mobileAdsModule.RewardedAd;
    InterstitialAd = mobileAdsModule.InterstitialAd;
    RewardedAdEventType = mobileAdsModule.RewardedAdEventType;
    AdEventType = mobileAdsModule.AdEventType;
    sdkModuleLoaded = true;
  } catch {
    // SDK not installed — stay in stub mode
  }
} else {
  if (__DEV__) console.log('[AdManager] DEV mode — using stub (no native SDK) to avoid overlay issues');
}

// 広告表示のタイムアウト（ms）— この時間内にCLOSEDが来なければフォールバック
const SHOW_TIMEOUT_MS = 10000;

type ReadyListener = (ready: boolean) => void;
type AdContext = string;

class AdManagerClass {
  // Task 3: sdkAvailable is now a private class field
  private sdkAvailable: boolean;
  private initialized = false;
  private rewardedLoaded = false;
  private interstitialLoaded = false;
  private rewardedAd: any = null;
  private interstitialAd: any = null;
  private loadDelay = 2000;
  private rewardedListeners: Set<ReadyListener> = new Set();

  constructor() {
    // Task 3: initialize from module-level load result
    this.sdkAvailable = sdkModuleLoaded;
  }

  /** Subscribe to rewarded ad ready state changes. Returns unsubscribe function. */
  onRewardedReadyChange(listener: ReadyListener): () => void {
    this.rewardedListeners.add(listener);
    // Immediately notify current state
    listener(this.rewardedLoaded);
    return () => { this.rewardedListeners.delete(listener); };
  }

  private notifyRewardedReady(ready: boolean): void {
    this.rewardedListeners.forEach(fn => fn(ready));
  }

  // Task 1 & 7: initialize() returns Promise<void> and is idempotent
  // ATT undetermined 時はスタブのみで待機し、ATT 確定後の再呼び出しで SDK を初期化する
  async initialize(): Promise<void> {
    // 完全初期化済みの場合のみスキップ（ATT 待機中は再呼び出しを許可する）
    if (this.initialized) return;

    // Task 1: On iOS, check ATT status before initializing SDK
    if (Platform.OS === 'ios' && this.sdkAvailable) {
      try {
        const { getTrackingPermissionsAsync } = await import('expo-tracking-transparency');
        const { status } = await getTrackingPermissionsAsync();
        if (status === 'undetermined') {
          // ATT not yet determined — skip SDK init, run stub preloads only
          // initialized は false のまま → ATT 確定後の再呼び出しで SDK 初期化を行う
          this.preloadRewarded();
          this.preloadInterstitial();
          return;
        }
      } catch {
        // expo-tracking-transparency unavailable — proceed normally
      }
    }

    // ATT 確定済み or Android → 完全初期化
    this.initialized = true;

    if (this.sdkAvailable) {
      MobileAds()
        .initialize()
        .then(() => {
          if (__DEV__) console.log('[AdManager] SDK initialized');
          this.preloadRewarded();
          this.preloadInterstitial();
        })
        .catch((e: any) => {
          if (__DEV__) console.log('[AdManager] SDK init failed:', e);
          // SDK初期化失敗時もスタブとして動作させる
          this.sdkAvailable = false;
          this.preloadRewarded();
          this.preloadInterstitial();
        });
    } else {
      this.preloadRewarded();
      this.preloadInterstitial();
    }
  }

  private rewardedUnsubs: (() => void)[] = [];
  private interstitialUnsubs: (() => void)[] = [];

  private preloadRewarded(): void {
    // 前回のリスナーをクリーンアップ
    this.rewardedUnsubs.forEach(fn => fn());
    this.rewardedUnsubs = [];

    if (this.sdkAvailable && REWARDED_AD_UNIT_ID) {
      try {
        this.rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID);

        const u1 = this.rewardedAd.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            this.rewardedLoaded = true;
            this.notifyRewardedReady(true);
            if (__DEV__) console.log('[AdManager] Rewarded ad loaded');
          },
        );

        const u2 = this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
          if (__DEV__) console.log('[AdManager] Rewarded ad load error:', error);
          this.rewardedLoaded = false;
          this.notifyRewardedReady(false);
          setTimeout(() => this.preloadRewarded(), 30000);
        });

        this.rewardedUnsubs = [u1, u2];
        this.rewardedAd.load();
      } catch (e) {
        if (__DEV__) console.log('[AdManager] Rewarded preload exception:', e);
        this.rewardedLoaded = false;
        this.notifyRewardedReady(false);
      }
    } else {
      setTimeout(() => {
        this.rewardedLoaded = true;
        this.notifyRewardedReady(true);
        if (__DEV__) console.log('[AdManager] Rewarded ad loaded (stub)');
      }, this.loadDelay);
    }
  }

  private preloadInterstitial(): void {
    // 前回のリスナーをクリーンアップ
    this.interstitialUnsubs.forEach(fn => fn());
    this.interstitialUnsubs = [];

    if (this.sdkAvailable && INTERSTITIAL_AD_UNIT_ID) {
      try {
        this.interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID);

        const u1 = this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
          this.interstitialLoaded = true;
          if (__DEV__) console.log('[AdManager] Interstitial ad loaded');
        });

        const u2 = this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
          if (__DEV__) console.log('[AdManager] Interstitial ad load error:', error);
          this.interstitialLoaded = false;
          setTimeout(() => this.preloadInterstitial(), 30000);
        });

        this.interstitialUnsubs = [u1, u2];
        this.interstitialAd.load();
      } catch (e) {
        if (__DEV__) console.log('[AdManager] Interstitial preload exception:', e);
        this.interstitialLoaded = false;
      }
    } else {
      setTimeout(() => {
        this.interstitialLoaded = true;
        if (__DEV__) console.log('[AdManager] Interstitial ad loaded (stub)');
      }, this.loadDelay);
    }
  }

  isRewardedReady(): boolean {
    return this.rewardedLoaded;
  }

  isInterstitialReady(): boolean {
    return this.interstitialLoaded;
  }

  showRewarded(onResult: AdCallback, context: AdContext = 'unknown'): void {
    if (!this.rewardedLoaded) {
      if (__DEV__) console.log('[AdManager] Rewarded ad not ready, falling back');
      Analytics.logEvent('rewarded_unavailable', { context });
      onResult(false);
      return;
    }

    if (this.sdkAvailable && this.rewardedAd) {
      let rewarded = false;
      let settled = false;

      const settle = (result: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        try { unsubEarned?.(); } catch {}
        try { unsubClosed?.(); } catch {}
        try { unsubError?.(); } catch {}
        this.rewardedLoaded = false;
        this.notifyRewardedReady(false);
        this.rewardedAd = null; // 参照を切って古い ViewController のリークを防ぐ
        Analytics.logEvent(result ? 'rewarded_earned' : 'rewarded_closed_without_reward', {
          context,
          sdk_available: this.sdkAvailable,
        });
        setTimeout(() => onResult(result), 150);
        this.preloadRewarded();
      };

      const timeout = setTimeout(() => {
        // Task 8: wrap production console.log with __DEV__ guard
        if (__DEV__) console.log('[AdManager] Rewarded ad show timeout — force settling');
        Analytics.logEvent('rewarded_failed', { context, reason: 'timeout' });
        settle(false);
      }, SHOW_TIMEOUT_MS);

      let unsubEarned: (() => void) | undefined;
      let unsubClosed: (() => void) | undefined;
      let unsubError: (() => void) | undefined;

      try {
        Analytics.logEvent('rewarded_show', {
          context,
          sdk_available: this.sdkAvailable,
        });
        unsubEarned = this.rewardedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => { rewarded = true; },
        );

        unsubClosed = this.rewardedAd.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            settle(rewarded);
          },
        );

        unsubError = this.rewardedAd.addAdEventListener(
          AdEventType.ERROR,
          (_error: any) => {
            Analytics.logEvent('rewarded_failed', { context, reason: 'error' });
            settle(false);
          },
        );
      } catch (e) {
        // Task 8: wrap production console.log with __DEV__ guard
        if (__DEV__) console.log('[AdManager] Failed to add rewarded listeners:', e);
        Analytics.logEvent('rewarded_failed', { context, reason: 'listener_setup' });
        settle(false);
        return;
      }

      // Task 9: clean up preload listeners AFTER show listeners are registered
      this.rewardedUnsubs.forEach(fn => fn());
      this.rewardedUnsubs = [];

      // show() は Promise を返す — reject もハンドリング
      Promise.resolve()
        .then(() => this.rewardedAd?.show())
        .catch((e: any) => {
          // Task 8: wrap production console.log with __DEV__ guard
          if (__DEV__) console.log('[AdManager] Rewarded show rejected:', e);
          Analytics.logEvent('rewarded_failed', { context, reason: 'show_rejected' });
          settle(false);
        });
    } else {
      if (__DEV__) console.log('[AdManager] Showing rewarded ad (stub)');
      this.rewardedLoaded = false;
      this.notifyRewardedReady(false);
      Analytics.logEvent('rewarded_show', {
        context,
        sdk_available: this.sdkAvailable,
        stub: true,
      });
      setTimeout(() => {
        Analytics.logEvent('rewarded_earned', {
          context,
          sdk_available: this.sdkAvailable,
          stub: true,
        });
        onResult(true);
        this.preloadRewarded();
      }, 1000);
    }
  }

  showInterstitial(onDismiss: () => void, context: AdContext = 'unknown'): void {
    if (!this.interstitialLoaded) {
      if (__DEV__) console.log('[AdManager] Interstitial not ready, skipping');
      Analytics.logEvent('interstitial_skipped', { context, reason: 'not_ready' });
      onDismiss();
      return;
    }

    if (this.sdkAvailable && this.interstitialAd) {
      let settled = false;

      const settle = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        try { unsubClosed?.(); } catch {}
        try { unsubError?.(); } catch {}
        this.interstitialLoaded = false;
        this.interstitialAd = null; // 参照を切って古い ViewController のリークを防ぐ
        Analytics.logEvent('interstitial_closed', {
          context,
          sdk_available: this.sdkAvailable,
        });
        setTimeout(() => onDismiss(), 150);
        this.preloadInterstitial();
      };

      const timeout = setTimeout(() => {
        // Task 8: wrap production console.log with __DEV__ guard
        if (__DEV__) console.log('[AdManager] Interstitial show timeout — force settling');
        Analytics.logEvent('interstitial_skipped', { context, reason: 'timeout' });
        settle();
      }, SHOW_TIMEOUT_MS);

      let unsubClosed: (() => void) | undefined;
      let unsubError: (() => void) | undefined;

      try {
        Analytics.logEvent('interstitial_show', {
          context,
          sdk_available: this.sdkAvailable,
        });
        unsubClosed = this.interstitialAd.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            settle();
          },
        );

        unsubError = this.interstitialAd.addAdEventListener(
          AdEventType.ERROR,
          (_error: any) => {
            Analytics.logEvent('interstitial_skipped', { context, reason: 'error' });
            settle();
          },
        );
      } catch (e) {
        // Task 8: wrap production console.log with __DEV__ guard
        if (__DEV__) console.log('[AdManager] Failed to add interstitial listeners:', e);
        Analytics.logEvent('interstitial_skipped', { context, reason: 'listener_setup' });
        settle();
        return;
      }

      // Task 9: clean up preload listeners AFTER show listeners are registered
      this.interstitialUnsubs.forEach(fn => fn());
      this.interstitialUnsubs = [];

      // show() は Promise を返す — reject もハンドリング
      Promise.resolve()
        .then(() => this.interstitialAd?.show())
        .catch((e: any) => {
          // Task 8: wrap production console.log with __DEV__ guard
          if (__DEV__) console.log('[AdManager] Interstitial show rejected:', e);
          Analytics.logEvent('interstitial_skipped', { context, reason: 'show_rejected' });
          settle();
        });
    } else {
      if (__DEV__) console.log('[AdManager] Showing interstitial ad (stub)');
      this.interstitialLoaded = false;
      Analytics.logEvent('interstitial_show', {
        context,
        sdk_available: this.sdkAvailable,
        stub: true,
      });
      setTimeout(() => {
        Analytics.logEvent('interstitial_closed', {
          context,
          sdk_available: this.sdkAvailable,
          stub: true,
        });
        onDismiss();
        this.preloadInterstitial();
      }, 1000);
    }
  }
}

export const AdManager = new AdManagerClass();
