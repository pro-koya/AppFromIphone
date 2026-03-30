import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  DAILY_PROGRESS: 'daily_progress',
  CLEAR_HISTORY: 'clear_history',
  DAILY_RECORDS: 'daily_records',
  PUZZLE_CACHE: 'puzzle_cache',
  STREAK: 'streak',
  STREAK_SHIELD: 'streak_shield',
  HAS_SEEN_HOWTO: 'has_seen_howto',
  TOTAL_SCORE: 'total_score',
  ENDLESS_HIGH_SCORE: 'endless_high_score',
  ENDLESS_BEST_LEVEL: 'endless_best_level',
  ENDLESS_SCORE_HISTORY: 'endless_score_history',
  ENDLESS_PAUSED: 'endless_paused',
  SETTINGS: 'app_settings',
  TRACKING_PROMPT_HANDLED: 'tracking_prompt_handled',
  STAR_RATINGS: 'star_ratings',
  LOGIN_BONUS: 'login_bonus',
};

export interface DailyProgress {
  date: string;
  completedPuzzleIds: string[];
  currentPuzzleIndex: number; // 0-based index in day's puzzle list
  totalScore: number;
  isDayComplete: boolean;
}

export interface DailyRecord {
  completedCount: number;
  totalCount: number;
  totalScore: number;
  isDayComplete: boolean;
}

export interface AppSettings {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  vibrationEnabled: true,
  soundEnabled: true,
};

export interface EndlessScoreEntry {
  score: number;
  level: number;
  date: string; // ISO date string
}

export interface EndlessPausedState {
  seed: number;
  currentLevel: number;
  totalScore: number;
  highScore: number;
  bestLevel: number;
  // We store the puzzle data so we can resume without regenerating
  currentPuzzleJson: string; // JSON-serialized PuzzleLevel
  currentGameJson: string;   // JSON-serialized GameState
}

export interface LoginBonusData {
  day: number;          // 1-7 (0 means never claimed)
  lastClaimedDate: string; // YYYY-MM-DD
}

export interface StreakData {
  currentStreak: number;
  lastPlayedDate: string;
  longestStreak: number;
}

async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function setJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silent fail - app continues without saving
  }
}

export const Storage = {
  async getDailyProgress(date: string): Promise<DailyProgress | null> {
    // Try per-date key first
    const perDate = await getJSON<DailyProgress>(`${KEYS.DAILY_PROGRESS}_${date}`);
    if (perDate) return perDate;
    // Backward compat: check legacy single key
    const legacy = await getJSON<DailyProgress>(KEYS.DAILY_PROGRESS);
    if (legacy && legacy.date === date) return legacy;
    return null;
  },

  async saveDailyProgress(progress: DailyProgress): Promise<void> {
    // Save per-date key (enables past puzzle access)
    await setJSON(`${KEYS.DAILY_PROGRESS}_${progress.date}`, progress);
    // Also save legacy key for backward compat
    await setJSON(KEYS.DAILY_PROGRESS, progress);
  },

  async getClearHistory(): Promise<string[]> {
    return (await getJSON<string[]>(KEYS.CLEAR_HISTORY)) ?? [];
  },

  async addClearHistory(date: string): Promise<void> {
    const history = await Storage.getClearHistory();
    if (!history.includes(date)) {
      history.push(date);
      await setJSON(KEYS.CLEAR_HISTORY, history);
    }
  },

  async getStreak(): Promise<StreakData> {
    return (
      (await getJSON<StreakData>(KEYS.STREAK)) ?? {
        currentStreak: 0,
        lastPlayedDate: '',
        longestStreak: 0,
      }
    );
  },

  async updateStreak(todayDate: string): Promise<StreakData> {
    const streak = await Storage.getStreak();
    const yesterday = getYesterdayString(todayDate);

    let newStreak: number;
    if (streak.lastPlayedDate === todayDate) {
      newStreak = streak.currentStreak; // already counted today
    } else if (streak.lastPlayedDate === yesterday) {
      newStreak = streak.currentStreak + 1;
    } else {
      newStreak = 1; // streak broken
    }

    const updated: StreakData = {
      currentStreak: newStreak,
      lastPlayedDate: todayDate,
      longestStreak: Math.max(streak.longestStreak, newStreak),
    };
    await setJSON(KEYS.STREAK, updated);
    return updated;
  },

  /**
   * Check if the streak would be broken today (last played is not yesterday or today).
   * Returns the previous streak value if broken, null otherwise.
   */
  async checkStreakBroken(todayDate: string): Promise<number | null> {
    const streak = await Storage.getStreak();
    if (streak.currentStreak <= 0) return null;
    const yesterday = getYesterdayString(todayDate);
    if (streak.lastPlayedDate === todayDate || streak.lastPlayedDate === yesterday) {
      return null; // not broken
    }
    // Streak would be broken — check if shield was already used
    const shieldUsed = await AsyncStorage.getItem(KEYS.STREAK_SHIELD);
    if (shieldUsed === todayDate) return null; // already shielded today
    return streak.currentStreak;
  },

  /** Mark streak shield as used for today. Prevents streak from resetting. */
  async useStreakShield(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(KEYS.STREAK_SHIELD, today);
  },

  async hasSeenHowTo(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.HAS_SEEN_HOWTO);
    return val === 'true';
  },

  async markHowToSeen(): Promise<void> {
    await AsyncStorage.setItem(KEYS.HAS_SEEN_HOWTO, 'true');
  },

  async getEndlessHighScore(): Promise<number> {
    const val = await AsyncStorage.getItem(KEYS.ENDLESS_HIGH_SCORE);
    return val ? parseInt(val, 10) : 0;
  },

  async getEndlessBestLevel(): Promise<number> {
    const val = await AsyncStorage.getItem(KEYS.ENDLESS_BEST_LEVEL);
    return val ? parseInt(val, 10) : 0;
  },

  async getDailyRecords(): Promise<Record<string, DailyRecord>> {
    return (await getJSON<Record<string, DailyRecord>>(KEYS.DAILY_RECORDS)) ?? {};
  },

  async saveDailyRecord(date: string, record: DailyRecord): Promise<void> {
    const records = await Storage.getDailyRecords();
    records[date] = record;
    await setJSON(KEYS.DAILY_RECORDS, records);
  },

  async getCachedPuzzles(date: string): Promise<any[] | null> {
    return getJSON<any[]>(`${KEYS.PUZZLE_CACHE}_${date}`);
  },

  async saveCachedPuzzles(date: string, puzzles: any[]): Promise<void> {
    await setJSON(`${KEYS.PUZZLE_CACHE}_${date}`, puzzles);
  },

  async getSettings(): Promise<AppSettings> {
    return (await getJSON<AppSettings>(KEYS.SETTINGS)) ?? { ...DEFAULT_SETTINGS };
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await setJSON(KEYS.SETTINGS, settings);
  },

  async hasHandledTrackingPrompt(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.TRACKING_PROMPT_HANDLED);
    return val === 'true';
  },

  async markTrackingPromptHandled(): Promise<void> {
    await AsyncStorage.setItem(KEYS.TRACKING_PROMPT_HANDLED, 'true');
  },

  async saveEndlessRecord(score: number, level: number): Promise<{ newHighScore: boolean; newBestLevel: boolean }> {
    const prevScore = await Storage.getEndlessHighScore();
    const prevLevel = await Storage.getEndlessBestLevel();
    const newHighScore = score > prevScore;
    const newBestLevel = level > prevLevel;
    if (newHighScore) {
      await AsyncStorage.setItem(KEYS.ENDLESS_HIGH_SCORE, score.toString());
    }
    if (newBestLevel) {
      await AsyncStorage.setItem(KEYS.ENDLESS_BEST_LEVEL, level.toString());
    }
    // Also add to score history
    await Storage.addEndlessScoreEntry({ score, level, date: new Date().toISOString().split('T')[0] });
    return { newHighScore, newBestLevel };
  },

  // ─── Endless score history (top 10) ───

  async getEndlessScoreHistory(): Promise<EndlessScoreEntry[]> {
    return (await getJSON<EndlessScoreEntry[]>(KEYS.ENDLESS_SCORE_HISTORY)) ?? [];
  },

  async addEndlessScoreEntry(entry: EndlessScoreEntry): Promise<void> {
    const history = await Storage.getEndlessScoreHistory();
    const updated = [...history, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    await setJSON(KEYS.ENDLESS_SCORE_HISTORY, updated);
  },

  // ─── Endless pause/resume ───

  async saveEndlessPausedState(state: EndlessPausedState): Promise<void> {
    await setJSON(KEYS.ENDLESS_PAUSED, state);
  },

  async getEndlessPausedState(): Promise<EndlessPausedState | null> {
    return getJSON<EndlessPausedState>(KEYS.ENDLESS_PAUSED);
  },

  async clearEndlessPausedState(): Promise<void> {
    try { await AsyncStorage.removeItem(KEYS.ENDLESS_PAUSED); } catch { /* ignore */ }
  },

  // ─── Star ratings ───

  /** Get star ratings for a date: { puzzleId: stars } */
  async getStarRatings(date: string): Promise<Record<string, number>> {
    return (await getJSON<Record<string, number>>(`${KEYS.STAR_RATINGS}_${date}`)) ?? {};
  },

  /** Save/update star rating for a puzzle (keeps best) */
  async saveStarRating(date: string, puzzleId: string, stars: number): Promise<void> {
    const ratings = await Storage.getStarRatings(date);
    const existing = ratings[puzzleId] ?? 0;
    if (stars > existing) {
      const updated = { ...ratings, [puzzleId]: stars };
      await setJSON(`${KEYS.STAR_RATINGS}_${date}`, updated);
    }
  },

  // ─── Login bonus ───

  async getLoginBonus(): Promise<LoginBonusData> {
    return (await getJSON<LoginBonusData>(KEYS.LOGIN_BONUS)) ?? { day: 0, lastClaimedDate: '' };
  },

  /**
   * Check and claim today's login bonus.
   * Returns { day, isNew } where isNew=true means the modal should show.
   */
  async claimLoginBonus(todayDate: string): Promise<{ day: number; isNew: boolean }> {
    const data = await Storage.getLoginBonus();

    // Already claimed today
    if (data.lastClaimedDate === todayDate) {
      return { day: data.day, isNew: false };
    }

    const yesterday = getYesterdayString(todayDate);
    let newDay: number;

    if (data.lastClaimedDate === yesterday && data.day < 7) {
      // Consecutive — advance to next day
      newDay = data.day + 1;
    } else {
      // Streak broken or cycle complete — restart from day 1
      newDay = 1;
    }

    const updated: LoginBonusData = { day: newDay, lastClaimedDate: todayDate };
    await setJSON(KEYS.LOGIN_BONUS, updated);
    return { day: newDay, isNew: true };
  },
};

function getYesterdayString(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
