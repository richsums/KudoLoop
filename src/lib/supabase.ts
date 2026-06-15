import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './env';

/**
 * Lazily-created Supabase client. Null when the app is unconfigured so the rest
 * of the codebase can branch on `isSupabaseConfigured` and fall back to local
 * mock data without ever touching the network.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // AsyncStorage works on native; on web it transparently wraps localStorage.
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Only the web build should parse the session out of the redirect URL.
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;

/** Throwing accessor for code paths that require a configured backend. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return supabase;
}
