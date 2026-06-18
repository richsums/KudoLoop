import { create } from 'zustand';
import { z } from 'zod';

import type { Permission } from '../domain/types';

export const TOTAL_STEPS = 4;

export const ALL_PERMISSIONS: Permission[] = [
  'approve_tasks',
  'manage_rewards',
  'manage_members',
  'manage_assignments',
];

export function defaultPermissions(role: 'parent' | 'caregiver'): Permission[] {
  return role === 'parent' ? [...ALL_PERMISSIONS] : ['approve_tasks'];
}

export const onboardingKidSchema = z.object({
  id: z.string(),
  name: z.string(),
  dailyMinutes: z.number(),
});

export type OnboardingKid = z.infer<typeof onboardingKidSchema>;

export type OnboardingAdult = {
  id: string;
  name: string;
  role: 'parent' | 'caregiver';
  permissions: Permission[];
};

export type OnboardingDraft = {
  familyName: string;
  parentName: string;
  adults?: OnboardingAdult[];
  kids: OnboardingKid[];
};

type OnboardingState = OnboardingDraft & {
  adults: OnboardingAdult[];
  step: number;
  setupComplete: boolean;
  setFamilyName: (name: string) => void;
  setParentName: (name: string) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  addAdult: (name: string, role: 'parent' | 'caregiver') => void;
  removeAdult: (id: string) => void;
  toggleAdultPermission: (id: string, permission: Permission) => void;
  addKid: (name: string, dailyMinutes: number) => void;
  removeKid: (id: string) => void;
  completeSetup: () => void;
  restart: () => void;
};

const initialDraft = {
  familyName: '',
  parentName: '',
  adults: [] as OnboardingAdult[],
  kids: [] as OnboardingKid[],
};

const KIDS_STEP = 3;

/**
 * Pure gate used by the flow and tested directly: can the user leave `step`?
 * 0 welcome (always) · 1 family + primary parent (both names) · 2 extra members
 * (optional) · 3 kids (at least one before the family is created).
 */
export function isStepComplete(step: number, draft: OnboardingDraft): boolean {
  if (step === 1) {
    return draft.familyName.trim().length > 0 && draft.parentName.trim().length > 0;
  }

  if (step === KIDS_STEP) {
    return draft.kids.length > 0;
  }

  return true;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialDraft,
  step: 0,
  setupComplete: false,
  setFamilyName: (name) => set({ familyName: name }),
  setParentName: (name) => set({ parentName: name }),
  goToStep: (step) => set({ step: Math.max(0, Math.min(step, TOTAL_STEPS - 1)) }),
  nextStep: () => {
    const { step } = get();

    if (!isStepComplete(step, get())) {
      return;
    }

    set({ step: Math.min(step + 1, TOTAL_STEPS - 1) });
  },
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 0) })),
  addAdult: (name, role) => {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      return;
    }

    set((state) => ({
      adults: [
        ...state.adults,
        {
          id: `adult-${state.adults.length + 1}-${Date.now()}`,
          name: trimmed,
          role,
          permissions: defaultPermissions(role),
        },
      ],
    }));
  },
  removeAdult: (id) => set((state) => ({ adults: state.adults.filter((adult) => adult.id !== id) })),
  toggleAdultPermission: (id, permission) => {
    set((state) => ({
      adults: state.adults.map((adult) =>
        adult.id === id
          ? {
              ...adult,
              permissions: adult.permissions.includes(permission)
                ? adult.permissions.filter((value) => value !== permission)
                : [...adult.permissions, permission],
            }
          : adult,
      ),
    }));
  },
  addKid: (name, dailyMinutes) => {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      return;
    }

    set((state) => ({
      kids: [
        ...state.kids,
        {
          id: `kid-${state.kids.length + 1}-${Date.now()}`,
          name: trimmed,
          dailyMinutes: Number.isFinite(dailyMinutes) && dailyMinutes > 0 ? dailyMinutes : 45,
        },
      ],
    }));
  },
  removeKid: (id) => set((state) => ({ kids: state.kids.filter((kid) => kid.id !== id) })),
  completeSetup: () => {
    if (!isStepComplete(KIDS_STEP, get())) {
      return;
    }

    set({ setupComplete: true });
  },
  restart: () => set({ ...initialDraft, step: 0, setupComplete: false }),
}));
