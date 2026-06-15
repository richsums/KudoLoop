/**
 * Public Supabase configuration. These are EXPO_PUBLIC_* vars so they are
 * inlined into the client bundle at build time. The anon key is safe to ship;
 * all real protection comes from Row Level Security on the backend.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Name of the private Storage bucket holding proof images. */
export const PROOF_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_PROOF_BUCKET ?? 'proofs';

/**
 * True only when both URL and anon key are present. When false the app runs in
 * local mock mode (no network), which is how the evaluation build behaves.
 */
export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
