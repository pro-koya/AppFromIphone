/**
 * Returns today's date as YYYY-MM-DD string (local time).
 */
export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date for display: e.g., "3月20日 (木)"
 */
export function formatDateJa(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = days[date.getDay()];
  return `${m}月${d}日 (${day})`;
}

/**
 * Check if two date strings represent the same day.
 */
export function isSameDay(a: string, b: string): boolean {
  return a === b;
}
