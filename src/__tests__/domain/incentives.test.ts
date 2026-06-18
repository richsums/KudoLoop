import { describe, expect, it } from 'vitest';

import { CHORE_CATALOG, CHORE_GROUPS, SCHOOLWORK_CATALOG } from '../../domain/catalog';
import {
  canAfford,
  goalProgress,
  moneyToPoints,
  pointsToMoney,
  pointsToScreenMinutes,
  screenMinutesToPoints,
} from '../../domain/incentives';
import { DEFAULT_REWARD_CONFIG } from '../../domain/types';

describe('catalogs', () => {
  it('ship comprehensive, well-formed chore and schoolwork lists', () => {
    expect(CHORE_CATALOG.length).toBeGreaterThanOrEqual(15);
    expect(SCHOOLWORK_CATALOG.length).toBeGreaterThanOrEqual(10);
    expect(new Set(CHORE_CATALOG.map((c) => c.id)).size).toBe(CHORE_CATALOG.length); // unique ids
    expect(CHORE_CATALOG.every((c) => c.suggestedPoints > 0 && c.suggestedDurationMinutes > 0)).toBe(true);
    expect(CHORE_GROUPS.length).toBeGreaterThan(3);
  });
});

describe('points conversion', () => {
  const config = DEFAULT_REWARD_CONFIG; // $0.05/pt, 0.5 min/pt

  it('converts points to money rounded to cents', () => {
    expect(pointsToMoney(100, config)).toBe(5); // 100 * 0.05
    expect(pointsToMoney(33, config)).toBe(1.65);
  });

  it('converts points to whole screen minutes', () => {
    expect(pointsToScreenMinutes(100, config)).toBe(50);
    expect(pointsToScreenMinutes(5, config)).toBe(2); // floor(2.5)
  });

  it('inverts cleanly for required points', () => {
    expect(moneyToPoints(1, config)).toBe(20);
    expect(screenMinutesToPoints(30, config)).toBe(60);
  });

  it('reports affordability and goal progress', () => {
    expect(canAfford(2000, 1500)).toBe(false);
    expect(canAfford(2000, 2000)).toBe(true);
    expect(goalProgress(2000, 500)).toBe(0.25);
    expect(goalProgress(2000, 4000)).toBe(1);
  });
});
