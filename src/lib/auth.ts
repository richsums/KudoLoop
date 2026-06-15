import type { Session, User } from '@supabase/supabase-js';

import { requireSupabase, supabase } from './supabase';

export type AuthResult = { user: User | null; session: Session | null };

/**
 * Create a parent (family-admin) account. The display name and family name are
 * stored in user metadata; a server-side trigger / Edge Function is expected to
 * provision the families + user_profiles rows from this metadata.
 */
export async function signUpParent(params: {
  email: string;
  password: string;
  displayName: string;
  familyName: string;
}): Promise<AuthResult> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        display_name: params.displayName,
        family_name: params.familyName,
        role: 'parent',
      },
    },
  });

  if (error) {
    throw error;
  }

  return { user: data.user, session: data.session };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return { user: data.user, session: data.session };
}

export async function signOut(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function; a no-op when
 * Supabase is not configured.
 */
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  if (!supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
