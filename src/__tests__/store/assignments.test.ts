import { beforeEach, describe, expect, it } from 'vitest';

import { buildFamilyFromOnboarding } from '../../domain/buildFamily';
import { CHORE_CATALOG, SCHOOLWORK_CATALOG } from '../../domain/catalog';
import { useKudoLoopStore } from '../../store/useKudoLoopStore';

beforeEach(() => {
  // Start each test from a known 2-kid family.
  useKudoLoopStore.getState().hydrate(
    buildFamilyFromOnboarding(
      {
        familyName: 'Test Family',
        parentName: 'Pat',
        kids: [
          { id: 'kid-1', name: 'Maya', dailyMinutes: 45 },
          { id: 'kid-2', name: 'Eli', dailyMinutes: 60 },
        ],
      },
      { nowIso: '2026-06-17T12:00:00.000Z' },
    ),
  );
});

describe('catalog assignment', () => {
  it('assigns a catalog chore as a points task for one kid', () => {
    const store = useKudoLoopStore.getState();
    const before = store.templates.length;
    const chore = CHORE_CATALOG.find((item) => item.id === 'chore-vacuum')!;
    store.assignCatalogChore('kid-1', chore);

    const state = useKudoLoopStore.getState();
    expect(state.templates.length).toBe(before + 1);
    const template = state.templates[0];
    expect(template.title).toBe(chore.title);
    expect(template.estimatedDurationMinutes).toBe(chore.suggestedDurationMinutes);
    expect(template.rewardRules[0]).toMatchObject({ rewardType: 'points', amount: chore.suggestedPoints });

    const tasks = state.tasks.filter((task) => task.templateId === template.id);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].childId).toBe('kid-1');
  });

  it('assigns catalog schoolwork with subject and proof required', () => {
    const sw = SCHOOLWORK_CATALOG.find((item) => item.id === 'sw-math-homework')!;
    useKudoLoopStore.getState().assignCatalogSchoolwork('kid-2', sw);

    const template = useKudoLoopStore.getState().templates[0];
    expect(template.category).toBe('schoolwork');
    expect(template.subject).toBe('Math');
    expect(template.defaultProofRequired).toBe(true);
  });

  it('removes a template and its task instances', () => {
    const store = useKudoLoopStore.getState();
    store.assignCatalogChore('kid-1', CHORE_CATALOG[0]);
    const templateId = useKudoLoopStore.getState().templates[0].id;

    useKudoLoopStore.getState().removeTemplate(templateId);
    const state = useKudoLoopStore.getState();
    expect(state.templates.find((t) => t.id === templateId)).toBeUndefined();
    expect(state.tasks.filter((t) => t.templateId === templateId)).toHaveLength(0);
  });
});

describe('incentives, wishlist, and notifications', () => {
  it('adds an incentive goal for a kid', () => {
    useKudoLoopStore
      .getState()
      .addIncentive({ childId: 'kid-1', title: 'New bike', type: 'item', pointCost: 2000 }, 'parent-1');
    expect(useKudoLoopStore.getState().incentives[0]).toMatchObject({ title: 'New bike', pointCost: 2000 });
  });

  it('kid wishlist add creates a parent notification, and parent can promote it', () => {
    useKudoLoopStore.getState().addWishlistItem('kid-1', 'Lego set', 'the big one');
    let state = useKudoLoopStore.getState();
    expect(state.wishlist[0]).toMatchObject({ title: 'Lego set', status: 'open' });
    expect(state.notifications[0]).toMatchObject({ type: 'wishlist_updated', read: false });

    const wishId = state.wishlist[0].id;
    useKudoLoopStore.getState().promoteWishlistItem(wishId, 800, 'parent-1');
    state = useKudoLoopStore.getState();
    expect(state.wishlist.find((w) => w.id === wishId)?.status).toBe('promoted');
    expect(state.incentives.find((i) => i.title === 'Lego set')).toMatchObject({ pointCost: 800, type: 'item' });
  });

  it('stores a proof image and notifies the parent on submission', () => {
    const store = useKudoLoopStore.getState();
    store.assignCatalogChore('kid-1', CHORE_CATALOG[0]);
    const task = useKudoLoopStore.getState().tasks.find((t) => t.childId === 'kid-1')!;

    useKudoLoopStore.getState().submitTaskProof(task.id, 'kid-1', 'Done!', 'data:image/jpeg;base64,AAAA');
    const state = useKudoLoopStore.getState();
    const updated = state.tasks.find((t) => t.id === task.id)!;
    expect(updated.status).toBe('submitted');
    expect(updated.proofAssets[0]?.localUri).toBe('data:image/jpeg;base64,AAAA');
    expect(state.notifications[0]).toMatchObject({ type: 'task_completed', targetType: 'task', read: false });
  });

  it('cashout request creates a redemption and a notification, and marks-all clears unread', () => {
    useKudoLoopStore.getState().requestCashout('kid-1', 500);
    let state = useKudoLoopStore.getState();
    expect(state.redemptions[0]).toMatchObject({ rewardType: 'points', amount: 500, status: 'requested' });
    expect(state.notifications[0].type).toBe('cashout_request');

    useKudoLoopStore.getState().markAllNotificationsRead();
    state = useKudoLoopStore.getState();
    expect(state.notifications.every((n) => n.read)).toBe(true);
  });
});
