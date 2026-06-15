import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { deviceProviders } from '../domain/deviceProviders';
import { colors, radius, spacing } from '../theme/tokens';

export function DeviceSetupScreen() {
  return (
    <View style={styles.stack}>
      <Card tone="mint">
        <Text style={styles.title}>Hybrid screen-time controls</Text>
        <Text style={styles.body}>
          KudoLoop tracks earning and approvals. Parents apply limits through each platform’s supported family tools.
        </Text>
      </Card>
      {deviceProviders.map((provider) => (
        <Card key={provider.key}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{provider.name}</Text>
              <Text style={styles.meta}>{provider.platform}</Text>
            </View>
            <Text style={[styles.status, statusStyle(provider.status)]}>{provider.status.replaceAll('_', ' ')}</Text>
          </View>
          {provider.setupSteps.map((step) => (
            <Text key={step} style={styles.step}>• {step}</Text>
          ))}
          <Text style={styles.guardrail}>{provider.guardrail}</Text>
        </Card>
      ))}
    </View>
  );
}

function statusStyle(status: string) {
  if (status === 'v1_supported') {
    return { backgroundColor: colors.mint, color: colors.tealDark };
  }

  if (status === 'v15_candidate') {
    return { backgroundColor: '#FFF4CC', color: colors.navy };
  }

  return { backgroundColor: colors.cloud, color: colors.gray };
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  title: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.navy,
    fontSize: 17,
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  status: {
    borderRadius: radius.sm,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  step: {
    color: colors.navy,
    fontSize: 14,
    lineHeight: 22,
  },
  guardrail: {
    color: colors.gray,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
