/**
 * AdManager: Centralized ad management.
 *
 * MVP implementation: stub that simulates ad behavior.
 * For production: integrate react-native-google-mobile-ads
 *
 * Integration steps for production:
 *   npx expo install react-native-google-mobile-ads
 *   Add Google App ID to app.json plugins
 *   Replace stub methods with actual SDK calls
 *
 * Ad unit IDs (replace with real ones from AdMob):
 *   REWARDED:        ca-app-pub-XXXXX/XXXXX (use test: ca-app-pub-3940256099942544/1712485313)
 *   INTERSTITIAL:    ca-app-pub-XXXXX/XXXXX (use test: ca-app-pub-3940256099942544/4411468910)
 */

type AdCallback = (success: boolean) => void;

class AdManagerClass {
  private rewardedLoaded = false;
  private interstitialLoaded = false;
  private loadDelay = 2000; // Simulate network load

  initialize(): void {
    // In production: MobileAds().initialize()
    this.preloadRewarded();
    this.preloadInterstitial();
  }

  private preloadRewarded(): void {
    setTimeout(() => {
      this.rewardedLoaded = true;
      if (__DEV__) console.log('[AdManager] Rewarded ad loaded');
    }, this.loadDelay);
  }

  private preloadInterstitial(): void {
    setTimeout(() => {
      this.interstitialLoaded = true;
      if (__DEV__) console.log('[AdManager] Interstitial ad loaded');
    }, this.loadDelay);
  }

  isRewardedReady(): boolean {
    return this.rewardedLoaded;
  }

  isInterstitialReady(): boolean {
    return this.interstitialLoaded;
  }

  /**
   * Show rewarded ad. Calls back with true if user earned reward (watched full ad).
   * Calls back with false if ad not available or dismissed.
   */
  showRewarded(onResult: AdCallback): void {
    if (!this.rewardedLoaded) {
      if (__DEV__) console.log('[AdManager] Rewarded ad not ready, falling back');
      onResult(false);
      return;
    }

    // In production: RewardedAd.show() with earned reward callback
    // Stub: simulate successful view after 1s
    if (__DEV__) console.log('[AdManager] Showing rewarded ad (stub)');
    this.rewardedLoaded = false;

    setTimeout(() => {
      onResult(true);
      this.preloadRewarded(); // preload next
    }, 1000);
  }

  /**
   * Show interstitial ad at natural break points.
   * Silent fail: if not ready, just calls callback immediately.
   */
  showInterstitial(onDismiss: () => void): void {
    if (!this.interstitialLoaded) {
      if (__DEV__) console.log('[AdManager] Interstitial not ready, skipping');
      onDismiss();
      return;
    }

    // In production: InterstitialAd.show() with dismissed callback
    if (__DEV__) console.log('[AdManager] Showing interstitial ad (stub)');
    this.interstitialLoaded = false;

    setTimeout(() => {
      onDismiss();
      this.preloadInterstitial();
    }, 1000);
  }
}

export const AdManager = new AdManagerClass();
