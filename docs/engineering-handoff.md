# KudoLoop Engineering Handoff

## Product Target

Build a parent-managed, child-visible mobile app where children earn screen time, allowance, points, and custom rewards through chores, schoolwork, and family goals. V1 uses hybrid enforcement: KudoLoop is the source of truth for earning and approval, while Apple, Google, PlayStation, and Microsoft tools enforce device limits.

## Implemented Baseline

- `App.tsx` contains a compact role-switching prototype shell.
- `src/domain` defines schemas, reward mutation logic, and device-provider adapters.
- `src/store/useKudoLoopStore.ts` mirrors backend command behavior against seeded local state.
- `supabase/migrations/0001_kudoloop_schema.sql` defines the first database contract and RLS starter policies.
- `supabase/functions/kudoloop-commands/index.ts` documents the Edge Function command surface.

## Backend Command Rules

- `submitTaskProof`: child-only for assigned task, creates private proof metadata and sets task to `submitted`.
- `approveTask`: parent/caregiver-only, updates proof moderation, marks task approved, and awards configured rewards.
- `rejectTask`: parent/caregiver-only, rejects proof and stores resubmission note.
- `awardManualBonus`: parent/caregiver-only, writes a positive ledger entry.
- `deductReward`: parent/caregiver-only, writes a negative ledger entry and must reject negative balances.
- `requestRedemption`: child-only for own balance, creates `requested` redemption.
- `approveRedemption`: parent/caregiver-only, deducts balance and marks redemption approved.
- `generateWeeklyReport`: parent/caregiver-only, aggregates tasks, streaks, balances, and pending action items.

All reward commands must run in one database transaction and use unique `request_id` values so duplicate taps and retries do not duplicate rewards.

## Acceptance Focus

- Parents can approve proof and see balances update immediately.
- Children cannot approve tasks, mutate rewards, reach subscription purchase screens, or view parent settings.
- Proof assets stay private and family-scoped.
- Device setup copy never claims unsupported automation for PS5, Family Link, or Microsoft Family Safety.
- Downgrading a subscription hides paid features without deleting family data.
