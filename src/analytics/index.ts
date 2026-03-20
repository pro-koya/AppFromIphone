/**
 * Analytics abstraction layer.
 * MVP: logs to console. Replace with Firebase Analytics for production.
 *
 * To integrate Firebase:
 *   npm install @react-native-firebase/app @react-native-firebase/analytics
 *   Replace logEvent body with: analytics().logEvent(name, params)
 */

type EventParams = Record<string, string | number | boolean>;

export const Analytics = {
  logEvent(name: string, params: EventParams): void {
    if (__DEV__) {
      console.log(`[Analytics] ${name}`, params);
    }
    // TODO: Replace with Firebase Analytics in production
    // import analytics from '@react-native-firebase/analytics';
    // analytics().logEvent(name, params);
  },

  logScreen(screenName: string): void {
    if (__DEV__) {
      console.log(`[Analytics] screen_view: ${screenName}`);
    }
    // analytics().logScreenView({ screen_name: screenName });
  },
};
