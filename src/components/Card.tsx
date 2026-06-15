import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

type CardProps = PropsWithChildren<{
  tone?: 'plain' | 'mint' | 'sunny' | 'coral';
}>;

export function Card({ children, tone = 'plain' }: CardProps) {
  return <View style={[styles.card, toneStyles[tone]]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
});

const toneStyles = StyleSheet.create({
  plain: {},
  mint: {
    backgroundColor: colors.mint,
    borderColor: '#BCECE7',
  },
  sunny: {
    backgroundColor: '#FFF4CC',
    borderColor: '#FFE082',
  },
  coral: {
    backgroundColor: '#FFE4E0',
    borderColor: '#FFC2BA',
  },
});
