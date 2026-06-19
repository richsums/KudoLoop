import type { Permission, UserProfile } from './types';

/**
 * Whether a user may perform an action requiring `permission`. Children never
 * can. When an explicit permissions list is present it is authoritative;
 * otherwise we fall back to role defaults (parents can do everything,
 * caregivers can only approve) for any legacy profiles without a list.
 */
export function can(user: UserProfile | undefined, permission: Permission): boolean {
  if (!user || user.role === 'child') {
    return false;
  }

  if (user.permissions) {
    return user.permissions.includes(permission);
  }

  return user.role === 'parent';
}

/**
 * Resolve the currently-acting adult: the selected user if they still exist and
 * are an adult, otherwise the family creator, otherwise the first adult.
 */
export function resolveActiveUser(
  users: UserProfile[],
  activeUserId: string,
  creatorId: string,
): UserProfile | undefined {
  const adults = users.filter((user) => user.role !== 'child');
  return (
    adults.find((user) => user.id === activeUserId) ??
    adults.find((user) => user.id === creatorId) ??
    adults[0]
  );
}
