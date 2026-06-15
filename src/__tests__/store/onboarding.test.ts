import { beforeEach, describe, expect, it } from 'vitest';

import { isStepComplete, useOnboardingStore } from '../../store/useOnboardingStore';

beforeEach(() => {
  useOnboardingStore.getState().restart();
});

describe('isStepComplete', () => {
  it('always allows leaving the welcome step', () => {
    expect(isStepComplete(0, { familyName: '', parentName: '', kids: [] })).toBe(true);
  });

  it('requires both family and parent names on the family step', () => {
    expect(isStepComplete(1, { familyName: 'Crew', parentName: '', kids: [] })).toBe(false);
    expect(isStepComplete(1, { familyName: '  ', parentName: 'Richard', kids: [] })).toBe(false);
    expect(isStepComplete(1, { familyName: 'Crew', parentName: 'Richard', kids: [] })).toBe(true);
  });

  it('requires at least one kid on the kids step', () => {
    expect(isStepComplete(2, { familyName: 'Crew', parentName: 'Richard', kids: [] })).toBe(false);
    expect(
      isStepComplete(2, {
        familyName: 'Crew',
        parentName: 'Richard',
        kids: [{ id: 'kid-1', name: 'Maya', dailyMinutes: 45 }],
      }),
    ).toBe(true);
  });
});

describe('onboarding store actions', () => {
  it('does not advance past an incomplete step', () => {
    const store = useOnboardingStore.getState();
    store.nextStep();
    expect(useOnboardingStore.getState().step).toBe(1);

    // Step 1 needs names; advancing should be blocked.
    useOnboardingStore.getState().nextStep();
    expect(useOnboardingStore.getState().step).toBe(1);
  });

  it('adds and removes kids, defaulting invalid minutes to 45', () => {
    const store = useOnboardingStore.getState();
    store.addKid('Maya', 30);
    store.addKid('  ', 20); // blank name is ignored
    store.addKid('Eli', Number.NaN); // invalid minutes fall back to 45

    const kids = useOnboardingStore.getState().kids;
    expect(kids).toHaveLength(2);
    expect(kids[0]).toMatchObject({ name: 'Maya', dailyMinutes: 30 });
    expect(kids[1]).toMatchObject({ name: 'Eli', dailyMinutes: 45 });

    useOnboardingStore.getState().removeKid(kids[0].id);
    expect(useOnboardingStore.getState().kids).toHaveLength(1);
  });

  it('only completes setup once a kid exists, and restart clears everything', () => {
    const store = useOnboardingStore.getState();
    store.setFamilyName('The Summers Crew');
    store.setParentName('Richard');

    store.completeSetup();
    expect(useOnboardingStore.getState().setupComplete).toBe(false);

    useOnboardingStore.getState().addKid('Maya', 45);
    useOnboardingStore.getState().completeSetup();
    expect(useOnboardingStore.getState().setupComplete).toBe(true);

    useOnboardingStore.getState().restart();
    const state = useOnboardingStore.getState();
    expect(state.setupComplete).toBe(false);
    expect(state.familyName).toBe('');
    expect(state.kids).toHaveLength(0);
    expect(state.step).toBe(0);
  });
});
