import { Platform, Linking, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FocusModeState {
  isActive: boolean;
  sessionId: string | null;
  sessionTitle: string | null;
  startTime: number | null;
  distractionCount: number;
  platform: 'android' | 'ios' | 'web';
  isPWA: boolean;
  systemDndRequested: boolean;
  systemDndSupported: boolean;
  focusModeEnabledByUser: boolean;
}

type FocusModeListener = (state: FocusModeState) => void;

const FOCUS_STORAGE_KEY = '@upsc_exam_focus_settings';
const FOCUS_APPS_KEY = '@upsc_exam_focus_apps';

class ExamFocusService {
  private static instance: ExamFocusService;

  private isActive = false;
  private currentSessionId: string | null = null;
  private currentSessionTitle: string | null = null;
  private startTime: number | null = null;
  private distractionCount = 0;
  private focusModeEnabledByUser = true; // default true
  private systemDndRequested = false;
  private focusApps: string[] = [];

  private listeners: Set<FocusModeListener> = new Set();
  private appStateSubscription: any = null;
  private webVisibilityCleanup: (() => void) | null = null;

  private constructor() {
    this.initSettings();
  }

  public static getInstance(): ExamFocusService {
    if (!ExamFocusService.instance) {
      ExamFocusService.instance = new ExamFocusService();
    }
    return ExamFocusService.instance;
  }

  /**
   * Load persisted focus settings
   */
  private async initSettings(): Promise<void> {
    try {
      const apps = await AsyncStorage.getItem(FOCUS_APPS_KEY);
      if (apps) this.focusApps = JSON.parse(apps);
    } catch {
      // ignore
    }
    try {
      const data = await AsyncStorage.getItem(FOCUS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (typeof parsed.focusModeEnabledByUser === 'boolean') {
          this.focusModeEnabledByUser = parsed.focusModeEnabledByUser;
        }
        if (typeof parsed.systemDndRequested === 'boolean') {
          this.systemDndRequested = parsed.systemDndRequested;
        }
      }
    } catch {
      // Fallback to defaults
    }
  }

  /**
   * Determine platform architecture and native capabilities
   */
  public getPlatformDetails(): {
    platform: 'android' | 'ios' | 'web';
    isNative: boolean;
    isPWA: boolean;
    systemDndSupported: boolean;
    explanation: string;
  } {
    const isWeb = Platform.OS === 'web';
    const isAndroid = Platform.OS === 'android';
    const isIOS = Platform.OS === 'ios';

    let isPWA = false;
    if (isWeb && typeof window !== 'undefined') {
      isPWA =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
    }

    if (isAndroid) {
      return {
        platform: 'android',
        isNative: true,
        isPWA: false,
        systemDndSupported: true,
        explanation:
          'Native Android App: System-level Do Not Disturb is available with user authorization via Android Notification Policy Access.',
      };
    }

    if (isIOS) {
      return {
        platform: 'ios',
        isNative: true,
        isPWA: false,
        systemDndSupported: false,
        explanation:
          'iOS App: iOS reserves Do Not Disturb controls strictly for the user in Control Centre. In-app alerts are completely silenced.',
      };
    }

    return {
      platform: 'web',
      isNative: false,
      isPWA,
      systemDndSupported: false,
      explanation: isPWA
        ? 'PWA in Browser: Web applications cannot suppress OS-level notifications from third-party mobile apps (WhatsApp, Calls, Telegram). Please enable your device DND.'
        : 'Web Browser: Browsers cannot suppress notifications from other apps. In-app interruptions are silenced and tab focus is tracked.',
    };
  }

  /**
   * Check if user enabled focus mode setting
   */
  public isEnabledByUser(): boolean {
    return this.focusModeEnabledByUser;
  }

  /**
   * Toggle user focus mode preference
   */
  public async setEnabledByUser(enabled: boolean): Promise<void> {
    this.focusModeEnabledByUser = enabled;
    await this.persistSettings();
    this.notify();
  }

  /**
   * Check if Android DND integration is opted in
   */
  public isSystemDndRequested(): boolean {
    return this.systemDndRequested;
  }

  /**
   * Set Android DND integration option
   */
  public async setSystemDndRequested(requested: boolean): Promise<void> {
    this.systemDndRequested = requested;
    await this.persistSettings();
    this.notify();
  }

  private async persistSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        FOCUS_STORAGE_KEY,
        JSON.stringify({
          focusModeEnabledByUser: this.focusModeEnabledByUser,
          systemDndRequested: this.systemDndRequested,
        })
      );
    } catch {
      // Ignored
    }
  }

  /** Apps the user marked as distractions for exam time (personal checklist). */
  public getFocusApps(): string[] {
    return [...this.focusApps];
  }

  public async setFocusApps(ids: string[]): Promise<void> {
    this.focusApps = ids;
    try {
      await AsyncStorage.setItem(FOCUS_APPS_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
    this.notify();
  }

  /**
   * Opens Android's own notification settings page for another app so the
   * USER can mute it. We never change another app's settings ourselves.
   */
  public async openAppNotificationSettings(packageName: string): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      await (Linking as any).sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
        { key: 'android.provider.extra.APP_PACKAGE', value: packageName },
      ]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Open Android System Notification Policy / Do Not Disturb Settings
   */
  public async openAndroidDndSettings(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // Official Android intent for Do Not Disturb policy access
        if (typeof (Linking as any).sendIntent === 'function') {
          await (Linking as any).sendIntent('android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS');
          return true;
        }
      } catch {
        // Fallback to app settings
      }
      try {
        await Linking.openSettings();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Activate Exam Focus Mode when a quiz or mock test actually begins.
   * Does NOT activate on test instructions page.
   */
  public activateFocusMode(sessionId: string, sessionTitle?: string): boolean {
    if (!this.focusModeEnabledByUser) {
      return false;
    }

    // If already active for this exact session, keep active
    if (this.isActive && this.currentSessionId === sessionId) {
      return true;
    }

    this.isActive = true;
    this.currentSessionId = sessionId;
    this.currentSessionTitle = sessionTitle || 'Exam Test Session';
    this.startTime = Date.now();
    this.distractionCount = 0;

    // Attach AppState and Web Page Visibility tracking
    this.attachDistractionListeners();

    this.notify();
    return true;
  }

  /**
   * Deactivate Exam Focus Mode and restore previous settings.
   * Only deactivates if the session ID matches the session that activated it.
   */
  public deactivateFocusMode(sessionId: string): boolean {
    if (!this.isActive) return false;

    // Ensure restoration happens only when this exam session enabled the mode
    if (this.currentSessionId !== sessionId) {
      return false;
    }

    this.isActive = false;
    this.currentSessionId = null;
    this.currentSessionTitle = null;
    this.startTime = null;

    this.detachDistractionListeners();
    this.notify();
    return true;
  }

  /**
   * Whether in-app notifications/reminders should currently be silenced
   */
  public shouldSuppressInAppNotifications(): boolean {
    return this.isActive;
  }

  /**
   * Get current state snapshot
   */
  public getState(): FocusModeState {
    const details = this.getPlatformDetails();
    return {
      isActive: this.isActive,
      sessionId: this.currentSessionId,
      sessionTitle: this.currentSessionTitle,
      startTime: this.startTime,
      distractionCount: this.distractionCount,
      platform: details.platform,
      isPWA: details.isPWA,
      systemDndRequested: this.systemDndRequested,
      systemDndSupported: details.systemDndSupported,
      focusModeEnabledByUser: this.focusModeEnabledByUser,
    };
  }

  /**
   * Subscribe to focus mode updates
   */
  public subscribe(listener: FocusModeListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  private attachDistractionListeners(): void {
    this.detachDistractionListeners();

    // 1. AppState listener on native
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (this.isActive && (nextState === 'background' || nextState === 'inactive')) {
          this.distractionCount++;
          this.notify();
        }
      }
    );

    // 2. Web Page Visibility API on web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (this.isActive && document.hidden) {
          this.distractionCount++;
          this.notify();
        }
      };

      const handleBlur = () => {
        if (this.isActive) {
          this.distractionCount++;
          this.notify();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      if (typeof window !== 'undefined') {
        window.addEventListener('blur', handleBlur);
      }

      this.webVisibilityCleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (typeof window !== 'undefined') {
          window.removeEventListener('blur', handleBlur);
        }
      };
    }
  }

  private detachDistractionListeners(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    if (this.webVisibilityCleanup) {
      this.webVisibilityCleanup();
      this.webVisibilityCleanup = null;
    }
  }
}

export const examFocusService = ExamFocusService.getInstance();

