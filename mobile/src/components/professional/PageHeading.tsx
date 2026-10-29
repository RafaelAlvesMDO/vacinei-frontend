import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing, typography } from '@/theme';

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

/**
 * Título das telas da ala Profissional: rótulo em verde ("CENTRAL DE VACINAÇÃO"), título e apoio
 */
export function PageHeading({ eyebrow, title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={typography.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle && <Text style={typography.muted}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.primary,
  },
});
