import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  DAILY_PROGRESS: 'daily_progress',
  CLEAR_HISTORY: 'clear_history',
  STREAK: 'streak',
  HAS_SEEN_HOWTO: 'has_seen_howto',
  TOTAL_SCORE: 'total_score',
};

export interface DailyProgress {
  date: string;
  completedPuzzleIds: string[];
  currentPuzzleIndex: number; // 0-based index in day's puzzle list
  totalScore: number;
  isDayComplete: boolean;
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
    const data = await getJSON<DailyProgress>(KEYS.DAILY_PROGRESS);
    if (data && data.date === date) return data;
    return null;
  },

  async saveDailyProgress(progress: DailyProgress): Promise<void> {
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

  async hasSeenHowTo(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.HAS_SEEN_HOWTO);
    return val === 'true';
  },

  async markHowToSeen(): Promise<void> {
    await AsyncStorage.setItem(KEYS.HAS_SEEN_HOWTO, 'true');
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
