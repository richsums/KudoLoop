import { describe, expect, it } from 'vitest';

import { FAMILY_ID, PARENT_ID, buildFamilyFromOnboarding } from '../../domain/buildFamily';
import type { OnboardingDraft } from '../../store/useOnboardingStore';

const draft: OnboardingDraft = {
  familyName: 'The Summers Crew',
  parentName: 'Richard',
  kids: [
    { id: 'kid-1', name: 'Maya', dailyMinutes: 45 },
    { id: 'kid-2', name: 'Eli', dailyMinutes: 60 },
  ],
};

describe('buildFamilyFromOnboarding', () => {
  it('builds a family with the parent and one user per kid', () => {
    const snapshot = buildFamilyFromOnboarding(draft, { nowIso: '2026-06-14T12:00:00.000Z' });

    expect(snapshot.family).toMatchObject({
      id: FAMILY_ID,
      name: 'The Summers Crew',
      subscriptionTier: 'free',
      createdByParentId: PARENT_ID,
    });
    expect(snapshot.users).toHaveLength(3);
    expect(snapshot.users.filter((user) => user.role === 'child')).toHaveLength(2);
    expect(snapshot.users.find((user) => user.role === 'parent')?.displayName).toBe('Richard');
  });

  it('creates zero-balance child profiles carrying the chosen daily budget', () => {
    const snapshot = buildFamilyFromOnboarding(draft, { nowIso: '2026-06-14T12:00:00.000Z' });

    expect(snapshot.children).toHaveLength(2);
    expect(snapshot.children[1]).toMatchObject({ userId: 'kid-2', defaultDailyMinutes: 60 });
    expect(snapshot.children[0].balances).toEqual({ screen_minutes: 0, money: 0, points: 0, custom: 0 });
  });

  it('seeds starter quests for every kid and starts with an empty ledger', () => {
    const snapshot = buildFamilyFromOnboarding(draft, { nowIso: '2026-06-14T12:00:00.000Z' });

    // Two seeded templates per kid.
    expect(snapshot.tasks).toHaveLength(4);
    expect(snapshot.tasks.every((task) => task.status === 'todo')).toBe(true);
    expect(snapshot.tasks.filter((task) => task.childId === 'kid-1')).toHaveLength(2);
    expect(snapshot.ledger).toHaveLength(0);
    expect(snapshot.redemptions).toHaveLength(0);
    expect(snapshot.templates.every((template) => template.familyId === FAMILY_ID)).toBe(true);
  });

  it('falls back to sensible defaults for blank names', () => {
    const snapshot = buildFamilyFromOnboarding({ familyName: '  ', parentName: '', kids: [] });
    expect(snapshot.family.name).toBe('My Family');
    expect(snapshot.users[0].displayName).toBe('Parent');
  });
});
