import { describe, expect, it } from 'vitest';

import { PROOF_BUCKET, isSupabaseConfigured } from '../../lib/env';

describe('supabase env configuration', () => {
  it('reports unconfigured (local mock mode) when env vars are absent', () => {
    // The test environment sets no EXPO_PUBLIC_SUPABASE_* vars, so the app must
    // fall back to local mode rather than attempting any network calls.
    expect(isSupabaseConfigured).toBe(false);
  });

  it('defaults the proof bucket name to "proofs"', () => {
    expect(PROOF_BUCKET).toBe('proofs');
  });
});
