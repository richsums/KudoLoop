import type { RewardConfig } from './types';

/** Dollar value of a points balance, rounded to whole cents. */
export function pointsToMoney(points: number, config: RewardConfig): number {
  return Math.round(points * config.pointsToMoneyRate * 100) / 100;
}

/** Whole screen-time minutes a points balance converts into. */
export function pointsToScreenMinutes(points: number, config: RewardConfig): number {
  return Math.floor(points * config.pointsToScreenMinutesRate);
}

/** Points required to reach a dollar amount (rounded up). */
export function moneyToPoints(dollars: number, config: RewardConfig): number {
  if (config.pointsToMoneyRate <= 0) {
    return 0;
  }
  return Math.ceil(dollars / config.pointsToMoneyRate);
}

/** Points required for a number of screen-time minutes (rounded up). */
export function screenMinutesToPoints(minutes: number, config: RewardConfig): number {
  if (config.pointsToScreenMinutesRate <= 0) {
    return 0;
  }
  return Math.ceil(minutes / config.pointsToScreenMinutesRate);
}

export function canAfford(pointCost: number, balancePoints: number): boolean {
  return balancePoints >= pointCost;
}

/** Progress toward a goal as a 0..1 fraction. */
export function goalProgress(pointCost: number, balancePoints: number): number {
  if (pointCost <= 0) {
    return 1;
  }
  return Math.max(0, Math.min(1, balancePoints / pointCost));
}
