/**
 * practiceSoundService.web.ts
 *
 * Web-specific practice sound feedback implementation.
 * Uses browser HTMLAudioElement / Web Audio API directly on web platforms.
 * Completely avoids native module bundler issues with expo-audio/expo-asset on web.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PracticeSoundSettings {
  enabled: boolean;
  correctSound: boolean;
  incorrectSound: boolean;
}

const STORAGE_KEY = '@upsc_practice_sound_settings';
const DEFAULTS: PracticeSoundSettings = { enabled: true, correctSound: true, incorrectSound: true };

type Listener = (s: PracticeSoundSettings) => void;

class PracticeSoundServiceWeb {
  private settings: PracticeSoundSettings = { ...DEFAULTS };
  private loaded: Promise<void>;
  private listeners = new Set<Listener>();
  private audioContext: AudioContext | null = null;

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

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return this.audioContext;
    } catch {
      return null;
    }
  }

  /** Plays feedback chime for an answer using Web Audio synthesizer */
  async playFeedback(isCorrect: boolean) {
    await this.loaded;
    const s = this.settings;
    if (!s.enabled || (isCorrect ? !s.correctSound : !s.incorrectSound)) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isCorrect) {
        // Melodic high double-chime (success)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Soft low double-tone (incorrect, non-jarring)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.setValueAtTime(261.63, now + 0.12); // C4

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Audio failure must never break practice
    }
  }
}

export const practiceSoundService = new PracticeSoundServiceWeb();

