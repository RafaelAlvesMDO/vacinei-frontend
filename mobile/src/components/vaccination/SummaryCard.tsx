import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { VaccinationCard } from '@/types/vaccination';
import { formatNumber } from '@/utils/format';

interface Props {
  summary: VaccinationCard['summary'];
}

/**
 * Resumo da caderneta com os contadores da API: em dia, atrasadas e completas
 */
export function SummaryCard({ summary }: Props) {
  const items = [
    { label: 'Em dia', value: summary.emDia, color: colors.primary },
    { label: 'Atrasadas', value: summary.atrasadas, color: summary.atrasadas > 0 ? colors.danger : colors.primaryDark },
    { label: 'Completas', value: summary.completas, color: colors.primaryDark },
  ];

  return (
    <Card>
      <Text style={typography.subtitle} accessibilityRole="header">
        Situação vacinal
      </Text>
      <View style={styles.row}>
        {items.map((item) => (
          <View
            key={item.label}
            style={styles.tile}
            accessible
            accessibilityLabel={`${item.label}: ${item.value}`}
          >
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.value, { color: item.color }]}>{formatNumber(item.value)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
  },
});
