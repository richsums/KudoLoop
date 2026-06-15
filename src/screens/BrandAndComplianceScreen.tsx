import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { colors, radius, spacing } from '../theme/tokens';

const passFailCriteria = [
  'Parent can create tasks, approve proof, and see balances update.',
  'Child cannot approve tasks, edit rewards, or access parent controls.',
  'Every reward mutation creates exactly one ledger entry.',
  'Proof assets are private, signed, and scoped to one family.',
  'Guides do not claim unsupported direct PS5, Family Link, or Microsoft automation.',
  'Subscriptions restore correctly and never expose purchases in kid mode.',
  'Child data collection is minimal and parent-controlled.',
];

export function BrandAndComplianceScreen() {
  return (
    <View style={styles.stack}>
      <Card tone="sunny">
        <View style={styles.icon}>
          <View style={styles.loop} />
          <Text style={styles.star}>★</Text>
        </View>
        <Text style={styles.title}>KudoLoop</Text>
        <Text style={styles.body}>Praise plus repeatable habits. Playful, trusted, and built for family creativity.</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Brand system</Text>
        <Text style={styles.body}>Palette: teal #18A7A1, sunny #FFC845, coral #FF6B5A, navy #25324B, cloud #F6FAFF.</Text>
        <Text style={styles.body}>Icon: rounded teal square with a yellow loop that reads as both a clock and a checkmark.</Text>
        <Text style={styles.body}>Subtitle: Chores, rewards, and screen time.</Text>
      </Card>

      <Card tone="mint">
        <Text style={styles.cardTitle}>Testing pass criteria</Text>
        {passFailCriteria.map((criterion) => (
          <Text key={criterion} style={styles.criterion}>PASS: {criterion}</Text>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Privacy and app review defaults</Text>
        <Text style={styles.body}>
          No ads, no social feed, no behavioral tracking, parental gate before commerce or external links, and parent-owned
          export/delete flows for child data.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  title: {
    color: colors.navy,
    fontSize: 28,
    fontWeight: '900',
    marginTop: spacing.md,
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
    marginTop: spacing.sm,
  },
  criterion: {
    color: colors.navy,
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  icon: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.teal,
    borderRadius: radius.lg,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  loop: {
    borderColor: colors.sunny,
    borderRadius: 28,
    borderRightWidth: 9,
    borderTopWidth: 9,
    height: 52,
    transform: [{ rotate: '45deg' }],
    width: 52,
  },
  star: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    position: 'absolute',
    right: 14,
    top: 10,
  },
});
