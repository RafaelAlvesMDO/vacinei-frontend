import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
  const { width, fontScale } = useWindowDimensions();
  // Largura de cada contador lado a lado (descontando o padding da tela, do card e os espaços).
  // Se o rótulo mais longo ("Completas") não couber com a fonte atual, os contadores ficam empilhados
  const tileWidth = (width - 2 * spacing.xl - 2 * spacing.lg - 2 * spacing.sm) / 3;
  const stacked = tileWidth < MIN_TILE_WIDTH * fontScale;
  const items = [
    { label: 'Em dia', value: summary.emDia, color: colors.primary },
    { label: 'Atrasadas', value: summary.atrasadas, color: summary.atrasadas > 0 ? colors.danger : colors.primaryDark },
    { label: 'Completas', value: summary.completas, color: colors.primaryDark },
  ];

  return (
    <Card style={styles.card}>
      <Text style={typography.subtitle} accessibilityRole="header">
        Situação vacinal
      </Text>
      <View style={stacked ? styles.column : styles.row}>
        {items.map((item) => (
          <View
            key={item.label}
            style={[styles.tile, stacked && styles.tileStacked]}
            accessible
            accessibilityLabel={`${item.label}: ${item.value}`}
          >
            <Text style={[styles.label, stacked && styles.labelStacked]}>{item.label}</Text>
            <Text style={[styles.value, { color: item.color }]}>{formatNumber(item.value)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

// Largura mínima de um contador lado a lado com a fonte em 100% ("Completas" + padding)
const MIN_TILE_WIDTH = 80;

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  column: {
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  // Empilhado: rótulo à esquerda e número à direita
  tileStacked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  label: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  labelStacked: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
  },
});
