import { create } from 'zustand';
import { z } from 'zod';

export const TOTAL_STEPS = 3;

export const onboardingKidSchema = z.object({
  id: z.string(),
  name: z.string(),
  dailyMinutes: z.number(),
});

export type OnboardingKid = z.infer<typeof onboardingKidSchema>;

export type OnboardingDraft = {
  familyName: string;
  parentName: string;
  kids: OnboardingKid[];
};

type OnboardingState = OnboardingDraft & {
  step: number;
  setupComplete: boolean;
  setFamilyName: (name: string) => void;
  setParentName: (name: string) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  addKid: (name: string, dailyMinutes: number) => void;
  removeKid: (id: string) => void;
  completeSetup: () => void;
  restart: () => void;
};

const initialDraft: OnboardingDraft = {
  familyName: '',
  parentName: '',
  kids: [],
};

/**
 * Pure gate used by the flow and tested directly: can the user leave `step`?
 * Step 0 (welcome) is always passable; step 1 needs both names; step 2 needs
 * at least one child before the family can be created.
 */
export function isStepComplete(step: number, draft: OnboardingDraft): boolean {
  if (step === 1) {
    return draft.familyName.trim().length > 0 && draft.parentName.trim().length > 0;
  }

  if (step === 2) {
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
    if (!isStepComplete(2, get())) {
      return;
    }

    set({ setupComplete: true });
  },
  restart: () => set({ ...initialDraft, step: 0, setupComplete: false }),
}));
