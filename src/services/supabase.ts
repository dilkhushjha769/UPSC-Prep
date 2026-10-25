import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://trodruvopmqnnkvghxye.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyb2RydXZvcG1xbm5rdmdoeHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MzYxOTUsImV4cCI6MjEwMDAxMjE5NX0.yMWBxKEMwmVYZKVLuAfnBQ18OPwGi_SE9bw6LeVNKcg';

const inMemoryCache = new Map<string, string>();

const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return inMemoryCache.get(key) || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      inMemoryCache.set(key, value);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      inMemoryCache.delete(key);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== 'undefined',
  },
});

const GUEST_ID_KEY = '@upsc_mock_test_guest_id';

/**
 * Retrieves the current authenticated user's ID, or gets/creates a persistent local guest ID.
 */
export async function getCurrentUserIdOrGuestId(): Promise<{ userId: string | null; guestId: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      return { userId: user.id, guestId: user.id };
    }
  } catch {}

  let guestId = await customStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    await customStorage.setItem(GUEST_ID_KEY, guestId);
  }

  return { userId: null, guestId };
}
