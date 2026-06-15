# KudoLoop

KudoLoop is a mobile-first Expo starter app for families who want chores, school effort, allowance, and screen-time rewards in one playful system.

## What Is Implemented

- Three-step family onboarding (welcome → family/parent → add kids) that builds a real family snapshot driving the dashboards.
- React Navigation bottom-tab shell (Parent, Kid, Devices, Brand) with a branded header.
- Parent dashboard with child balances, proof approval queue, redemption approvals, quick bonuses, and immutable ledger visibility.
- Kid dashboard with daily quests, real or simulated proof submission, a kid switcher, screen-time requests, reward store, and visible balances.
- Device setup guide for Apple Screen Time, Google Family Link, PlayStation Family App, Microsoft Family Safety, plus future adapter slots.
- Typed KudoLoop domain model with Zod schemas, reward formatting, idempotency request ids, and negative-balance protection.
- Supabase client, auth, and private proof-upload integration (`src/lib/`), activated by env config; schema + RLS migrations and an Edge Function command contract.
- Brand and compliance screen with palette, icon direction, privacy defaults, and pass/fail acceptance criteria.

## Run

```bash
npm install
npm run ios
```

Alternative targets:

```bash
npm run android
npm run web
```

The app boots into the family onboarding flow; completing it lands on the
tab-based dashboards.

## Backend (Supabase) setup

KudoLoop runs in **local mock mode** with no configuration — which is how the
evaluation build behaves. To connect a real backend (auth + private proof
upload), provide credentials:

```bash
cp .env.example .env.local
# fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Apply the SQL migrations to your project (schema + RLS, then the private proof
bucket and storage policies):

```
supabase/migrations/0001_kudoloop_schema.sql
supabase/migrations/0002_proof_storage.sql
```

When configured (`isSupabaseConfigured` is true), the kid "Send proof photo"
action picks an image, compresses it, uploads full + thumbnail copies to the
private `proofs` bucket, and writes a `proof_assets` row. Viewing a proof
requires a short-lived signed URL — objects are never public.

## Verify

```bash
npm run typecheck
npm test
```

## Architecture Notes

- Frontend: Expo SDK 56, React Native, TypeScript, TanStack Query, Zustand, and Zod.
- Backend target: Supabase Auth, Postgres, RLS, Storage, and Edge Functions.
- Payments target: RevenueCat with Apple/Google subscriptions. Entitlements must be mirrored server-side.
- Device controls: V1 is hybrid. KudoLoop tracks earned time and approvals; parents apply limits in supported platform tools.

## Next Build Steps

- Generate typed database types and move dashboard reads/writes onto Supabase queries (currently only the proof-upload path is live; reads still come from the hydrated in-memory store).
- Build the auth UI (sign-up/sign-in screens) on top of `src/lib/auth.ts` and provision family/profile rows from sign-up metadata via an Edge Function.
- Render proof thumbnails in the approval queue using signed URLs.
- Implement RevenueCat subscriptions and parental gates before app-store beta.
- Complete legal review for COPPA, privacy labels, trademark, and app-store category positioning.
