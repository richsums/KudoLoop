import { describe, expect, it } from 'vitest';

import { can, resolveActiveUser } from '../../domain/permissions';
import type { UserProfile } from '../../domain/types';

const parent: UserProfile = {
  id: 'p1',
  familyId: 'f1',
  role: 'parent',
  displayName: 'Pat',
  avatar: 'P',
  authUserId: 'a-p1',
  permissions: ['approve_tasks', 'manage_rewards', 'manage_members', 'manage_assignments'],
};

const caregiver: UserProfile = {
  id: 'c1',
  familyId: 'f1',
  role: 'caregiver',
  displayName: 'Sam',
  avatar: 'S',
  authUserId: 'a-c1',
  permissions: ['approve_tasks'],
};

const kid: UserProfile = {
  id: 'k1',
  familyId: 'f1',
  role: 'child',
  displayName: 'Maya',
  avatar: 'M',
  authUserId: 'a-k1',
};

describe('can', () => {
  it('honors an explicit permissions list', () => {
    expect(can(parent, 'manage_rewards')).toBe(true);
    expect(can(caregiver, 'approve_tasks')).toBe(true);
    expect(can(caregiver, 'manage_rewards')).toBe(false);
  });

  it('never lets a child or undefined user act', () => {
    expect(can(kid, 'approve_tasks')).toBe(false);
    expect(can(undefined, 'approve_tasks')).toBe(false);
  });

  it('falls back to role defaults when no permissions list is present', () => {
    const legacyParent = { ...parent, permissions: undefined };
    const legacyCaregiver = { ...caregiver, permissions: undefined };
    expect(can(legacyParent, 'manage_members')).toBe(true);
    expect(can(legacyCaregiver, 'manage_members')).toBe(false);
  });
});

describe('resolveActiveUser', () => {
  const users = [parent, caregiver, kid];

  it('returns the selected adult when valid', () => {
    expect(resolveActiveUser(users, 'c1', 'p1')?.id).toBe('c1');
  });

  it('falls back to the creator when the selection is missing or a child', () => {
    expect(resolveActiveUser(users, 'k1', 'p1')?.id).toBe('p1');
    expect(resolveActiveUser(users, 'ghost', 'p1')?.id).toBe('p1');
  });
});
