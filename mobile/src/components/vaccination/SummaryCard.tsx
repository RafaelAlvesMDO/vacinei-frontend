import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Card, Icon } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { AlertStatus, CardVaccine } from '@/types/vaccination';
import { formatNumber } from '@/utils/format';

interface Props {
  vaccines: CardVaccine[];
}

/**
 * Resumo da caderneta pela situação do alerta (D32): em dia, atrasadas e completas contam só doses
 * confirmadas; as vacinas com doses aguardando conferência aparecem à parte
 */
export function SummaryCard({ vaccines }: Props) {
  const countOf = (status: AlertStatus) => vaccines.filter((item) => item.alert.status === status).length;
  const summary = { emDia: countOf('EM_DIA'), atrasadas: countOf('ATRASADA'), completas: countOf('COMPLETA') };
  const awaiting = countOf('AGUARDANDO_CONFERENCIA');
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
      {awaiting > 0 && (
        <View style={styles.awaiting} accessible>
          <Icon name="time-outline" size={18} color={colors.warning} />
          <Text style={styles.awaitingText}>
            {awaiting === 1
              ? '1 vacina aguardando conferência na UBS'
              : `${formatNumber(awaiting)} vacinas aguardando conferência na UBS`}
          </Text>
        </View>
      )}
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
  awaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  awaitingText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.warning,
  },
});
