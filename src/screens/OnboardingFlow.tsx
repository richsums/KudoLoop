import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Card } from '../components/Card';
import { buildFamilyFromOnboarding } from '../domain/buildFamily';
import { TOTAL_STEPS, isStepComplete, useOnboardingStore } from '../store/useOnboardingStore';
import { useKudoLoopStore } from '../store/useKudoLoopStore';
import { colors, radius, spacing } from '../theme/tokens';

const stepTitles = ['Welcome to KudoLoop', 'Set up your family', 'Add your kids'];

function resolveTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function OnboardingFlow() {
  const step = useOnboardingStore((state) => state.step);
  const familyName = useOnboardingStore((state) => state.familyName);
  const parentName = useOnboardingStore((state) => state.parentName);
  const kids = useOnboardingStore((state) => state.kids);
  const setFamilyName = useOnboardingStore((state) => state.setFamilyName);
  const setParentName = useOnboardingStore((state) => state.setParentName);
  const addKid = useOnboardingStore((state) => state.addKid);
  const removeKid = useOnboardingStore((state) => state.removeKid);
  const nextStep = useOnboardingStore((state) => state.nextStep);
  const prevStep = useOnboardingStore((state) => state.prevStep);
  const completeSetup = useOnboardingStore((state) => state.completeSetup);
  const hydrate = useKudoLoopStore((state) => state.hydrate);

  const canProceed = isStepComplete(step, { familyName, parentName, kids });
  const isLastStep = step === TOTAL_STEPS - 1;

  const handleCreateFamily = () => {
    if (!isStepComplete(2, { familyName, parentName, kids })) {
      return;
    }

    hydrate(buildFamilyFromOnboarding({ familyName, parentName, kids }, { timezone: resolveTimezone() }));
    completeSetup();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>KL</Text>
          </View>
          <View style={styles.progress}>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <View
                key={index}
                style={[styles.progressDot, index <= step ? styles.progressDotActive : null]}
              />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Step {step + 1} of {TOTAL_STEPS}</Text>
          <Text style={styles.title}>{stepTitles[step]}</Text>

          {step === 0 ? <WelcomeStep /> : null}
          {step === 1 ? (
            <FamilyStep
              familyName={familyName}
              parentName={parentName}
              onFamilyName={setFamilyName}
              onParentName={setParentName}
            />
          ) : null}
          {step === 2 ? <KidsStep kids={kids} onAddKid={addKid} onRemoveKid={removeKid} /> : null}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 ? (
            <Pressable style={styles.secondaryButton} onPress={prevStep} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>Back</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.primaryButton, canProceed ? null : styles.primaryButtonDisabled]}
            disabled={!canProceed}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canProceed }}
            onPress={isLastStep ? handleCreateFamily : nextStep}
          >
            <Text style={styles.primaryButtonText}>
              {isLastStep ? 'Create family' : step === 0 ? 'Get started' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function WelcomeStep() {
  return (
    <View style={styles.stack}>
      <Card tone="sunny">
        <Text style={styles.cardTitle}>Chores in, screen time out.</Text>
        <Text style={styles.body}>
          KudoLoop turns chores, homework, and good habits into earned screen time, allowance, and
          rewards you approve. You stay in control; kids stay motivated.
        </Text>
      </Card>
      <Bullet text="Build a quest board your kids actually want to finish." />
      <Bullet text="Approve proof and award minutes, money, or points in a tap." />
      <Bullet text="Every reward is logged in an immutable family ledger." />
    </View>
  );
}

function FamilyStep({
  familyName,
  parentName,
  onFamilyName,
  onParentName,
}: {
  familyName: string;
  parentName: string;
  onFamilyName: (value: string) => void;
  onParentName: (value: string) => void;
}) {
  return (
    <View style={styles.stack}>
      <Field
        label="Family name"
        placeholder="The Summers Crew"
        value={familyName}
        onChangeText={onFamilyName}
      />
      <Field
        label="Your name (parent)"
        placeholder="Richard"
        value={parentName}
        onChangeText={onParentName}
      />
      <Text style={styles.helper}>
        You will be the family admin. Only parents can approve tasks, change rewards, and manage
        members.
      </Text>
    </View>
  );
}

function KidsStep({
  kids,
  onAddKid,
  onRemoveKid,
}: {
  kids: { id: string; name: string; dailyMinutes: number }[];
  onAddKid: (name: string, dailyMinutes: number) => void;
  onRemoveKid: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('45');

  const handleAdd = () => {
    const parsedMinutes = Number.parseInt(minutes, 10);
    onAddKid(name, parsedMinutes);
    setName('');
    setMinutes('45');
  };

  return (
    <View style={styles.stack}>
      <Field label="Kid's name" placeholder="Maya" value={name} onChangeText={setName} />
      <Field
        label="Daily screen-time budget (minutes)"
        placeholder="45"
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="number-pad"
      />
      <Pressable
        style={[styles.secondaryButton, name.trim() ? null : styles.secondaryButtonDisabled]}
        disabled={!name.trim()}
        accessibilityRole="button"
        onPress={handleAdd}
      >
        <Text style={styles.secondaryButtonText}>Add kid</Text>
      </Pressable>

      {kids.length === 0 ? (
        <Text style={styles.helper}>Add at least one kid to create your family.</Text>
      ) : (
        kids.map((kid) => (
          <Card key={kid.id}>
            <View style={styles.kidRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{kid.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{kid.name}</Text>
                <Text style={styles.meta}>{kid.dailyMinutes} min daily budget</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => onRemoveKid(kid.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

function Field({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.gray}
        autoCorrect={false}
        {...inputProps}
      />
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.sunny,
    borderColor: colors.navy,
    borderRadius: 16,
    borderWidth: 2,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  logoText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  progress: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressDot: {
    backgroundColor: colors.line,
    borderRadius: 4,
    height: 8,
    width: 24,
  },
  progressDotActive: {
    backgroundColor: colors.teal,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.teal,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.navy,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  stack: {
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
  },
  body: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.gray,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  helper: {
    color: colors.gray,
    fontSize: 13,
    lineHeight: 18,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletDot: {
    backgroundColor: colors.teal,
    borderRadius: 6,
    height: 12,
    marginTop: 4,
    width: 12,
  },
  bulletText: {
    color: colors.navy,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  fieldLabel: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: spacing.xs,
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
  kidRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.sunny,
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: {
    color: colors.navy,
    fontWeight: '900',
  },
  removeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removeButtonText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '800',
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
  secondaryButtonDisabled: {
    borderColor: colors.line,
  },
  secondaryButtonText: {
    color: colors.tealDark,
    fontSize: 16,
    fontWeight: '900',
  },
});
