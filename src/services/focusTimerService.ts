import { UPSCSubject } from '@/types/study';

export interface PauseInterval {
  startTimestamp: number;
  endTimestamp: number | null; // null if pause is ongoing
}

export type FocusSessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'interrupted';

export interface ActiveFocusSession {
  id: string;
  userId: string;
  subject: UPSCSubject;
  customSubjectName?: string;
  topic: string;
  targetMinutes: number; // 0 represents open-ended / stopwatch mode
  startTimestamp: number; // Date.now()
  endTimestamp?: number;
  pauseIntervals: PauseInterval[];
  distractionCount: number;
  lastDistractionTimestamp?: number;
  status: FocusSessionStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FocusDurations {
  elapsedSeconds: number;
  pausedSeconds: number;
  focusedSeconds: number;
  focusedMinutes: number;
}

export interface FocusSessionSummaryData {
  sessionId: string;
  subject: UPSCSubject;
  customSubjectName?: string;
  topic: string;
  startTimeIso: string;
  endTimeIso: string;
  startTimeFormatted: string; // e.g. "07:30 PM"
  endTimeFormatted: string; // e.g. "08:45 PM"
  totalElapsedSeconds: number;
  totalPausedSeconds: number;
  focusedSeconds: number;
  focusedMinutes: number;
  targetMinutes: number;
  targetCompleted: boolean;
  distractionCount: number;
  todayTotalMinutesBefore: number;
  todayTotalMinutesAfter: number;
  dailyGoalMinutes: number;
  goalCompletionPercent: number;
  currentStreak: number;
  isStreakQualified: boolean;
  motivationalQuote: string;
}

const UPSC_MOTIVATIONAL_QUOTES = [
  '“Arise, awake, and stop not till the goal is reached.” — Swami Vivekananda',
  '“Success is the sum of small efforts, repeated day in and day out.” — UPSC Journey',
  '“You cannot change your future, but you can change your habits, and surely your habits will change your future.” — Dr. A.P.J. Abdul Kalam',
  '“Consistency is the bridge between UPSC aspiration and the final rank list.”',
  '“Every hour of deep focus brings you one step closer to LBSNAA.”',
  '“Patience and perseverance have a magical effect before which difficulties disappear and obstacles vanish.” — Sardar Patel',
  '“Focus on the process and discipline; the result takes care of itself.”',
];

/**
 * Accurately calculates elapsed, paused, and focused durations from session timestamps
 */
export function calculateFocusDurations(
  session: Pick<ActiveFocusSession, 'startTimestamp' | 'endTimestamp' | 'pauseIntervals' | 'status'>,
  currentTimestamp: number = Date.now()
): FocusDurations {
  if (!session.startTimestamp || session.startTimestamp <= 0) {
    return {
      elapsedSeconds: 0,
      pausedSeconds: 0,
      focusedSeconds: 0,
      focusedMinutes: 0,
    };
  }

  const effectiveEnd = session.endTimestamp && session.endTimestamp > 0
    ? session.endTimestamp
    : currentTimestamp;

  const totalElapsedMs = Math.max(0, effectiveEnd - session.startTimestamp);

  // Compute paused time from intervals
  let totalPausedMs = 0;
  if (Array.isArray(session.pauseIntervals)) {
    for (const interval of session.pauseIntervals) {
      if (!interval || typeof interval.startTimestamp !== 'number') continue;
      const intervalEnd = typeof interval.endTimestamp === 'number' && interval.endTimestamp > 0
        ? interval.endTimestamp
        : effectiveEnd;
      
      const diff = Math.max(0, intervalEnd - interval.startTimestamp);
      totalPausedMs += diff;
    }
  }

  // Paused cannot exceed total elapsed time
  totalPausedMs = Math.min(totalPausedMs, totalElapsedMs);
  const focusedMs = Math.max(0, totalElapsedMs - totalPausedMs);

  const elapsedSeconds = Math.floor(totalElapsedMs / 1000);
  const pausedSeconds = Math.floor(totalPausedMs / 1000);
  const focusedSeconds = Math.floor(focusedMs / 1000);
  const focusedMinutes = Math.floor(focusedSeconds / 60);

  return {
    elapsedSeconds,
    pausedSeconds,
    focusedSeconds,
    focusedMinutes,
  };
}

/**
 * Formats seconds into HH:MM:SS or MM:SS
 */
export function formatTimerHHMMSS(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Formats minutes or seconds into human readable "X hour Y minutes"
 */
export function formatHumanDuration(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  if (hrs > 0 && mins > 0) {
    return `${hrs} hr ${mins} min`;
  }
  if (hrs > 0) {
    return `${hrs} hr`;
  }
  if (mins > 0) {
    return `${mins} min`;
  }
  return `${secs} sec`;
}

/**
 * Formats timestamp to time of day string (e.g., "7:30 PM")
 */
export function formatTimeOfDay(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

/**
 * Returns a random motivational quote
 */
export function getMotivationalQuote(): string {
  const idx = Math.floor(Math.random() * UPSC_MOTIVATIONAL_QUOTES.length);
  return UPSC_MOTIVATIONAL_QUOTES[idx];
}

/**
 * Light Web Audio API synthesizer for ambient study sounds
 * Does not require external audio files and runs completely offline.
 */
class AmbientSoundManager {
  private audioCtx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private currentMode: 'off' | 'whitenoise' | 'rain' | 'binaural' = 'off';

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  }

  public getMode(): 'off' | 'whitenoise' | 'rain' | 'binaural' {
    return this.currentMode;
  }

  public setMode(mode: 'off' | 'whitenoise' | 'rain' | 'binaural') {
    if (!this.isSupported()) return;

    this.stop();
    this.currentMode = mode;

    if (mode === 'off') return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime); // gentle ambient volume
      this.gainNode.connect(this.audioCtx.destination);

      if (mode === 'whitenoise' || mode === 'rain') {
        const bufferSize = 2 * this.audioCtx.sampleRate;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        if (mode === 'rain') {
          // Low-pass filter for rain sound
          const filter = this.audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, this.audioCtx.currentTime);
          whiteNoise.connect(filter);
          filter.connect(this.gainNode);
        } else {
          whiteNoise.connect(this.gainNode);
        }

        whiteNoise.start();
        this.noiseNode = whiteNoise;
      } else if (mode === 'binaural') {
        // Calm 432 Hz alpha wave tone
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, this.audioCtx.currentTime);
        osc.connect(this.gainNode);
        osc.start();
        this.noiseNode = osc;
      }
    } catch (e) {
      console.warn('Ambient sound playback could not start:', e);
    }
  }

  public stop() {
    try {
      if (this.noiseNode) {
        (this.noiseNode as unknown as { stop?: () => void }).stop?.();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
    } catch {
      // ignore
    }
    this.currentMode = 'off';
  }
}

export const ambientSoundManager = new AmbientSoundManager();
