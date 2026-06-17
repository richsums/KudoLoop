import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Card } from '../components/Card';
import type { NewChoreInput } from '../domain/chores';
import type { RewardType, TaskCategory } from '../domain/types';
import { useKudoLoopStore } from '../store/useKudoLoopStore';
import { colors, radius, spacing } from '../theme/tokens';

const categories: { value: TaskCategory; label: string }[] = [
  { value: 'routine_chore', label: 'Routine chore' },
  { value: 'bonus_screen_time', label: 'Bonus screen time' },
  { value: 'paid_chore', label: 'Paid chore' },
  { value: 'school_achievement', label: 'School achievement' },
  { value: 'custom_goal', label: 'Custom goal' },
];

const rewardTypes: { value: RewardType; label: string }[] = [
  { value: 'points', label: 'Points' },
  { value: 'screen_minutes', label: 'Screen minutes' },
  { value: 'money', label: 'Allowance ($)' },
  { value: 'custom', label: 'Custom perk' },
];

export function CreateChoreScreen() {
  const navigation = useNavigation();
  const childUsers = useKudoLoopStore((state) => state.users.filter((candidate) => candidate.role === 'child'));
  const addChore = useKudoLoopStore((state) => state.addChore);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('routine_chore');
  const [rewardType, setRewardType] = useState<RewardType>('points');
  const [rewardAmount, setRewardAmount] = useState('10');
  const [proofRequired, setProofRequired] = useState(false);
  const [selectedKids, setSelectedKids] = useState<string[]>(childUsers.map((kid) => kid.id));

  const amount = Number.parseInt(rewardAmount, 10);
  const canCreate = title.trim().length > 0 && selectedKids.length > 0 && Number.isFinite(amount) && amount > 0;

  const toggleKid = (id: string) => {
    setSelectedKids((current) =>
      current.includes(id) ? current.filter((kid) => kid !== id) : [...current, id],
    );
  };

  const handleCreate = () => {
    if (!canCreate) {
      return;
    }

    const input: NewChoreInput = {
      title,
      category,
      rewardType,
      rewardAmount: amount,
      proofRequired,
      childIds: selectedKids,
    };
    addChore(input);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>New chore</Text>

          <Field label="What should they do?">
            <TextInput
              style={styles.input}
              placeholder="Load and unload dishes"
              placeholderTextColor={colors.gray}
              value={title}
              onChangeText={setTitle}
              autoCorrect={false}
            />
          </Field>

          <Field label="Type">
            <ChipGroup
              options={categories}
              isSelected={(value) => value === category}
              onSelect={setCategory}
            />
          </Field>

          <Field label="Reward">
            <ChipGroup
              options={rewardTypes}
              isSelected={(value) => value === rewardType}
              onSelect={setRewardType}
            />
            <TextInput
              style={[styles.input, styles.amountInput]}
              placeholder="10"
              placeholderTextColor={colors.gray}
              value={rewardAmount}
              onChangeText={setRewardAmount}
              keyboardType="number-pad"
            />
          </Field>

          <Card>
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>Require photo proof</Text>
                <Text style={styles.meta}>Kids submit a photo before you approve.</Text>
              </View>
              <Switch
                value={proofRequired}
                onValueChange={setProofRequired}
                trackColor={{ true: colors.teal, false: colors.line }}
              />
            </View>
          </Card>

          <Field label="Assign to">
            {childUsers.length === 0 ? (
              <Text style={styles.meta}>No kids yet — add one during setup.</Text>
            ) : (
              <View style={styles.chipWrap}>
                {childUsers.map((kid) => {
                  const selected = selectedKids.includes(kid.id);
                  return (
                    <Pressable
                      key={kid.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => toggleKid(kid.id)}
                      style={[styles.chip, selected ? styles.chipSelected : null]}
                    >
                      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                        {kid.displayName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Field>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, canCreate ? null : styles.primaryButtonDisabled]}
            disabled={!canCreate}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canCreate }}
            onPress={handleCreate}
          >
            <Text style={styles.primaryButtonText}>Create chore</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ChipGroup<T extends string>({
  options,
  isSelected,
  onSelect,
}: {
  options: { value: T; label: string }[];
  isSelected: (value: T) => boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((option) => {
        const selected = isSelected(option.value);
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(option.value)}
            style={[styles.chip, selected ? styles.chipSelected : null]}
          >
            <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.cloud,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '900',
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.navy,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  amountInput: {
    marginTop: spacing.sm,
    width: 120,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  chipText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextSelected: {
    color: colors.white,
  },
  cardTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  meta: {
    color: colors.gray,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  footer: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    flex: 1,
    paddingVertical: spacing.md,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.line,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.teal,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    color: colors.tealDark,
    fontSize: 16,
    fontWeight: '900',
  },
});
