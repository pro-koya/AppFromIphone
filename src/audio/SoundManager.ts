import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync, type AudioPlayer } from 'expo-audio';
import { Storage, AppSettings, DEFAULT_SETTINGS } from '../utils/storage';

type SoundName = 'place' | 'lineClear' | 'success' | 'levelUp' | 'fail';

const SOUND_ASSETS: Record<SoundName, number> = {
  place: require('../../assets/sounds/place.wav'),
  lineClear: require('../../assets/sounds/line-clear.wav'),
  success: require('../../assets/sounds/success.wav'),
  levelUp: require('../../assets/sounds/level-up.wav'),
  fail: require('../../assets/sounds/fail.wav'),
};

const SOUND_VOLUMES: Record<SoundName, number> = {
  place: 0.45,
  lineClear: 0.55,
  success: 0.6,
  levelUp: 0.6,
  fail: 0.5,
};

class SoundManagerImpl {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private players = new Map<SoundName, AudioPlayer>();
  private initialized = false;
  private settingsLoaded = false;

  /** Load settings from storage. Call once at app/screen startup. */
  async loadSettings(): Promise<void> {
    this.settings = await Storage.getSettings();
    this.settingsLoaded = true;
    await this.syncAudioEnabled();
  }

  /** Update cached settings (call when user changes settings). */
  updateSettings(settings: AppSettings): void {
    this.settings = { ...settings };
    this.settingsLoaded = true;
    void this.syncAudioEnabled();
  }

  /** Initialize audio mode once. */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });

    this.initialized = true;
    await this.syncAudioEnabled();
  }

  private async syncAudioEnabled(): Promise<void> {
    try {
      await setIsAudioActiveAsync(this.settings.soundEnabled);
    } catch {
      // Keep the app functional even if the audio session can't be toggled.
    }
  }

  private getOrCreatePlayer(name: SoundName): AudioPlayer {
    const existing = this.players.get(name);
    if (existing) {
      return existing;
    }

    const player = createAudioPlayer(SOUND_ASSETS[name], {
      downloadFirst: true,
      keepAudioSessionActive: true,
    });
    player.volume = SOUND_VOLUMES[name];
    this.players.set(name, player);
    return player;
  }

  /** Play a named sound effect. No-op if sound is disabled. */
  async play(name: SoundName): Promise<void> {
    if (!this.settingsLoaded) {
      await this.loadSettings();
    }
    if (!this.settings.soundEnabled) return;

    try {
      await this.initialize();
      const player = this.getOrCreatePlayer(name);
      if (player.isLoaded) {
        await player.seekTo(0);
      }
      player.play();
    } catch {
      // Silent fallback - never crash for audio issues.
    }
  }

  /** Convenience methods */
  playPlace(): void { this.play('place'); }
  playLineClear(): void { this.play('lineClear'); }
  playSuccess(): void { this.play('success'); }
  playLevelUp(): void { this.play('levelUp'); }
  playFail(): void { this.play('fail'); }

  /** Unload all cached sounds (call on unmount if needed). */
  async unloadAll(): Promise<void> {
    for (const player of this.players.values()) {
      try {
        player.remove();
      } catch {
        // Ignore cleanup failures.
      }
    }
    this.players.clear();
  }
}

export const SoundManager = new SoundManagerImpl();
