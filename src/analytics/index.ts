/**
 * Analytics abstraction layer.
 *
 * This intentionally stays dependency-free until Firebase is fully configured
 * for the iOS release build.
 */

type EventParamValue = string | number | boolean | null | undefined;
type EventParams = Record<string, EventParamValue>;

function sanitizeParams(params: EventParams = {}): Record<string, string | number> {
  const sanitized: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    sanitized[key] = typeof value === 'boolean' ? (value ? 1 : 0) : value;
  }

  return sanitized;
}

export const Analytics = {
  initialize(): void {
    if (__DEV__) {
      console.log('[Analytics] Initialized with console fallback');
    }
  },

  logEvent(name: string, params: EventParams = {}): void {
    const sanitizedParams = sanitizeParams(params);

    if (__DEV__) {
      console.log(`[Analytics] ${name}`, sanitizedParams);
    }
  },

  logScreen(screenName: string): void {
    if (__DEV__) {
      console.log(`[Analytics] screen_view: ${screenName}`);
    }
  },
};
