import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

export interface PracticeSoundSettings {
  enabled: boolean;
  correctSound: boolean;
  incorrectSound: boolean;
}

const STORAGE_KEY = '@upsc_practice_sound_settings';
const DEFAULTS: PracticeSoundSettings = { enabled: true, correctSound: true, incorrectSound: true };

type Listener = (s: PracticeSoundSettings) => void;

class PracticeSoundService {
  private settings: PracticeSoundSettings = { ...DEFAULTS };
  private loaded: Promise<void>;
  private listeners = new Set<Listener>();
  private correctPlayer: AudioPlayer | null = null;
  private incorrectPlayer: AudioPlayer | null = null;

  constructor() {
    this.loaded = this.load();
  }

  private async load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) this.settings = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      // keep defaults
    }
    this.emit();
  }

  private emit() {
    this.listeners.forEach((l) => l({ ...this.settings }));
  }

  getSettings(): PracticeSoundSettings {
    return { ...this.settings };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ ...this.settings });
    return () => {
      this.listeners.delete(listener);
    };
  }

  async update(patch: Partial<PracticeSoundSettings>) {
    await this.loaded;
    this.settings = { ...this.settings, ...patch };
    this.emit();
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // non-fatal
    }
  }

  private getPlayer(kind: 'correct' | 'incorrect'): AudioPlayer | null {
    try {
      if (kind === 'correct') {
        this.correctPlayer ??= createAudioPlayer(require('../../assets/sounds/correct.wav'));
        return this.correctPlayer;
      }
      this.incorrectPlayer ??= createAudioPlayer(require('../../assets/sounds/incorrect.wav'));
      return this.incorrectPlayer;
    } catch {
      return null;
    }
  }

  /** Plays feedback for an answer, honouring the user's sound settings. */
  async playFeedback(isCorrect: boolean) {
    await this.loaded;
    const s = this.settings;
    if (!s.enabled || (isCorrect ? !s.correctSound : !s.incorrectSound)) return;
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const player = this.getPlayer(isCorrect ? 'correct' : 'incorrect');
      if (!player) return;
      await player.seekTo(0);
      player.play();
    } catch {
      // Audio failure must never break practice
    }
  }
}

export const practiceSoundService = new PracticeSoundService();

