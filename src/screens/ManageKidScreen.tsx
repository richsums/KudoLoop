import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { Card } from '../components/Card';
import { CHORE_CATALOG, CHORE_GROUPS, SCHOOLWORK_CATALOG } from '../domain/catalog';
import { can, resolveActiveUser } from '../domain/permissions';
import { formatRewardAmount } from '../domain/rewards';
import type { IncentiveType } from '../domain/types';
import type { RootStackParamList } from '../navigation/types';
import { useKudoLoopStore } from '../store/useKudoLoopStore';
import { colors, radius, spacing } from '../theme/tokens';

type Tab = 'assigned' | 'chores' | 'schoolwork' | 'incentives';

const tabs: { value: Tab; label: string }[] = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'chores', label: 'Chores' },
  { value: 'schoolwork', label: 'Schoolwork' },
  { value: 'incentives', label: 'Incentives' },
];

export function ManageKidScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ManageKid'>>();
  const { childId } = route.params;

  const user = useKudoLoopStore((state) => state.users.find((candidate) => candidate.id === childId));
  const users = useKudoLoopStore((state) => state.users);
  const creatorId = useKudoLoopStore((state) => state.family.createdByParentId);
  const activeUserId = useKudoLoopStore((state) => state.activeUserId);
  const activeUser = resolveActiveUser(users, activeUserId, creatorId);
  const parentId = activeUser?.id ?? creatorId;
  const canAssign = can(activeUser, 'manage_assignments');
  const canReward = can(activeUser, 'manage_rewards');
  const [tab, setTab] = useState<Tab>('assigned');

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Card>
          <Text style={styles.cardTitle}>Kid not found</Text>
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityRole="button">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Manage {user.displayName}</Text>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setTab(item.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === item.value }}
            style={[styles.tab, tab === item.value ? styles.tabSelected : null]}
          >
            <Text style={[styles.tabText, tab === item.value ? styles.tabTextSelected : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'assigned' ? <AssignedTab childId={childId} canAssign={canAssign} /> : null}
        {tab === 'chores' ? <ChoresTab childId={childId} canAssign={canAssign} /> : null}
        {tab === 'schoolwork' ? <SchoolworkTab childId={childId} canAssign={canAssign} /> : null}
        {tab === 'incentives' ? <IncentivesTab childId={childId} parentId={parentId} canReward={canReward} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function AssignedTab({ childId, canAssign }: { childId: string; canAssign: boolean }) {
  const tasks = useKudoLoopStore((state) => state.tasks);
  const templates = useKudoLoopStore((state) => state.templates);
  const removeTemplate = useKudoLoopStore((state) => state.removeTemplate);
  const setTemplateActive = useKudoLoopStore((state) => state.setTemplateActive);

  const templateIds = new Set(tasks.filter((task) => task.childId === childId).map((task) => task.templateId));
  const assigned = templates.filter((template) => templateIds.has(template.id));

  if (assigned.length === 0) {
    return (
      <Card>
        <Text style={styles.meta}>Nothing assigned yet. Use the Chores or Schoolwork tabs to add tasks.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.stack}>
      {assigned.map((template) => (
        <Card key={template.id}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{template.title}</Text>
              <Text style={styles.meta}>
                {labelForCategory(template.category)}
                {template.subject ? ` · ${template.subject}` : ''}
                {template.estimatedDurationMinutes ? ` · ~${template.estimatedDurationMinutes} min` : ''}
                {' · '}
                {template.rewardRules.map((rule) => formatRewardAmount(rule.rewardType, rule.amount)).join(' + ')}
                {template.active ? '' : ' · paused'}
              </Text>
            </View>
            {canAssign ? (
              <Switch
                value={template.active}
                onValueChange={(value) => setTemplateActive(template.id, value)}
                trackColor={{ true: colors.teal, false: colors.line }}
              />
            ) : null}
          </View>
          {canAssign ? (
            <Pressable
              style={styles.removeButton}
              accessibilityRole="button"
              onPress={() => removeTemplate(template.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

function ChoresTab({ childId, canAssign }: { childId: string; canAssign: boolean }) {
  const assignCatalogChore = useKudoLoopStore((state) => state.assignCatalogChore);
  const assignedTitles = useAssignedTitles(childId);

  if (!canAssign) {
    return <PermissionNotice text="You need the “Assign chores” permission to add chores." />;
  }

  return (
    <View style={styles.stack}>
      <Text style={styles.helper}>Tap a chore to assign it. Points and duration are suggestions you can tune later.</Text>
      {CHORE_GROUPS.map((group) => (
        <View key={group} style={styles.stack}>
          <Text style={styles.groupHeading}>{group}</Text>
          {CHORE_CATALOG.filter((item) => item.group === group).map((item) => {
            const added = assignedTitles.has(item.title);
            return (
              <CatalogRow
                key={item.id}
                title={item.title}
                meta={`${item.suggestedPoints} pts · ~${item.suggestedDurationMinutes} min`}
                added={added}
                onAdd={() => assignCatalogChore(childId, item)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function SchoolworkTab({ childId, canAssign }: { childId: string; canAssign: boolean }) {
  const assignCatalogSchoolwork = useKudoLoopStore((state) => state.assignCatalogSchoolwork);
  const addManualSchoolwork = useKudoLoopStore((state) => state.addManualSchoolwork);
  const assignedTitles = useAssignedTitles(childId);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [points, setPoints] = useState('15');
  const [duration, setDuration] = useState('30');

  const pointsNum = Number.parseInt(points, 10);
  const durationNum = Number.parseInt(duration, 10);
  const canAdd = title.trim().length > 0 && Number.isFinite(pointsNum) && pointsNum > 0;

  const handleManualAdd = () => {
    if (!canAdd) {
      return;
    }
    addManualSchoolwork(childId, {
      title: title.trim(),
      subject: subject.trim() || 'General',
      points: pointsNum,
      durationMinutes: Number.isFinite(durationNum) && durationNum > 0 ? durationNum : 30,
      proofRequired: true,
    });
    setTitle('');
    setSubject('');
    setPoints('15');
    setDuration('30');
  };

  if (!canAssign) {
    return <PermissionNotice text="You need the “Assign chores” permission to add schoolwork." />;
  }

  return (
    <View style={styles.stack}>
      <Card tone="mint">
        <Text style={styles.cardTitle}>Add custom schoolwork</Text>
        <TextInput style={styles.input} placeholder="Assignment title" placeholderTextColor={colors.gray} value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Subject (e.g. Math)" placeholderTextColor={colors.gray} value={subject} onChangeText={setSubject} />
        <View style={styles.inlineRow}>
          <TextInput style={[styles.input, styles.flex]} placeholder="Points" placeholderTextColor={colors.gray} keyboardType="number-pad" value={points} onChangeText={setPoints} />
          <TextInput style={[styles.input, styles.flex]} placeholder="Minutes" placeholderTextColor={colors.gray} keyboardType="number-pad" value={duration} onChangeText={setDuration} />
        </View>
        <Pressable style={[styles.primaryButton, canAdd ? null : styles.primaryButtonDisabled]} disabled={!canAdd} onPress={handleManualAdd} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Add to schedule</Text>
        </Pressable>
      </Card>

      <Text style={styles.groupHeading}>From the catalog</Text>
      {SCHOOLWORK_CATALOG.map((item) => (
        <CatalogRow
          key={item.id}
          title={item.title}
          meta={`${item.subject} · ${item.suggestedPoints} pts · ~${item.suggestedDurationMinutes} min`}
          added={assignedTitles.has(item.title)}
          onAdd={() => assignCatalogSchoolwork(childId, item)}
        />
      ))}
    </View>
  );
}

function IncentivesTab({ childId, parentId, canReward }: { childId: string; parentId: string; canReward: boolean }) {
  const incentives = useKudoLoopStore((state) => state.incentives.filter((item) => item.childId === childId));
  const addIncentive = useKudoLoopStore((state) => state.addIncentive);
  const removeIncentive = useKudoLoopStore((state) => state.removeIncentive);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<IncentiveType>('item');
  const [cost, setCost] = useState('500');

  const costNum = Number.parseInt(cost, 10);
  const canAdd = title.trim().length > 0 && Number.isFinite(costNum) && costNum > 0;

  const handleAdd = () => {
    if (!canAdd) {
      return;
    }
    addIncentive({ childId, title: title.trim(), type, pointCost: costNum }, parentId);
    setTitle('');
    setCost('500');
  };

  return (
    <View style={styles.stack}>
      {!canReward ? (
        <PermissionNotice text="You need the “Manage rewards” permission to add incentives. Existing goals are shown below." />
      ) : (
      <Card tone="sunny">
        <Text style={styles.cardTitle}>New incentive</Text>
        <Text style={styles.meta}>Something the kid works toward — an item, cash, or screen time.</Text>
        <TextInput style={styles.input} placeholder="e.g. New bike" placeholderTextColor={colors.gray} value={title} onChangeText={setTitle} />
        <View style={styles.chipWrap}>
          {(['item', 'cash', 'screen_time'] as IncentiveType[]).map((value) => (
            <Pressable
              key={value}
              onPress={() => setType(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: type === value }}
              style={[styles.chip, type === value ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, type === value ? styles.chipTextSelected : null]}>
                {value === 'screen_time' ? 'Screen time' : value === 'cash' ? 'Cash' : 'Item'}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput style={[styles.input, styles.amountInput]} placeholder="Point cost" placeholderTextColor={colors.gray} keyboardType="number-pad" value={cost} onChangeText={setCost} />
        <Pressable style={[styles.primaryButton, canAdd ? null : styles.primaryButtonDisabled]} disabled={!canAdd} onPress={handleAdd} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Add incentive</Text>
        </Pressable>
      </Card>
      )}

      {incentives.length === 0 ? (
        <Card>
          <Text style={styles.meta}>No incentives yet for this kid.</Text>
        </Card>
      ) : (
        incentives.map((incentive) => (
          <Card key={incentive.id}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{incentive.title}</Text>
                <Text style={styles.meta}>{incentive.pointCost} pts · {incentive.type === 'screen_time' ? 'screen time' : incentive.type}</Text>
              </View>
              <Pressable style={styles.removeButton} onPress={() => removeIncentive(incentive.id)} accessibilityRole="button">
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

function CatalogRow({ title, meta, added, onAdd }: { title: string; meta: string; added: boolean; onAdd: () => void }) {
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        <Pressable
          style={[styles.addButton, added ? styles.addButtonDone : null]}
          onPress={onAdd}
          accessibilityRole="button"
        >
          <Text style={[styles.addButtonText, added ? styles.addButtonTextDone : null]}>{added ? 'Add again' : 'Assign'}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function PermissionNotice({ text }: { text: string }) {
  return (
    <Card tone="coral">
      <Text style={styles.cardTitle}>Not allowed</Text>
      <Text style={styles.meta}>{text}</Text>
    </Card>
  );
}

function useAssignedTitles(childId: string): Set<string> {
  const tasks = useKudoLoopStore((state) => state.tasks);
  const templates = useKudoLoopStore((state) => state.templates);
  const templateIds = new Set(tasks.filter((task) => task.childId === childId).map((task) => task.templateId));
  return new Set(templates.filter((template) => templateIds.has(template.id)).map((template) => template.title));
}

function labelForCategory(category: string): string {
  return category.replace(/_/g, ' ');
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.cloud, flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  back: { color: colors.teal, fontSize: 15, fontWeight: '800' },
  title: { color: colors.navy, fontSize: 24, fontWeight: '900', marginTop: spacing.xs },
  tabBar: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.xs,
  },
  tab: { alignItems: 'center', borderRadius: radius.md, flex: 1, paddingVertical: spacing.sm },
  tabSelected: { backgroundColor: colors.teal },
  tabText: { color: colors.gray, fontSize: 12, fontWeight: '800' },
  tabTextSelected: { color: colors.white },
  content: { gap: spacing.md, padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  stack: { gap: spacing.sm },
  groupHeading: { color: colors.navy, fontSize: 15, fontWeight: '900', marginTop: spacing.sm },
  helper: { color: colors.gray, fontSize: 13, lineHeight: 18 },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  cardTitle: { color: colors.navy, fontSize: 16, fontWeight: '900' },
  meta: { color: colors.gray, fontSize: 13, lineHeight: 18, marginTop: spacing.xs },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.navy,
    fontSize: 15,
    fontWeight: '600',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inlineRow: { flexDirection: 'row', gap: spacing.sm },
  amountInput: { width: 140 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  chipTextSelected: { color: colors.white },
  addButton: {
    backgroundColor: colors.teal,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addButtonDone: { backgroundColor: colors.mint },
  addButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  addButtonTextDone: { color: colors.tealDark },
  removeButton: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: spacing.xs },
  removeButtonText: { color: colors.red, fontSize: 13, fontWeight: '800' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  primaryButtonDisabled: { backgroundColor: colors.line },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: '900' },
});
