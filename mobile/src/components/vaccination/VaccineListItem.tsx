import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, Icon } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { CardVaccine } from '@/types/vaccination';
import { formatCalendarDate } from '@/utils/format';
import { formatOverdue, getDaysOverdue, getLastRecord, getRecordBadge, SCHEDULE_STATUS } from '@/utils/vaccination';

interface Props {
  item: CardVaccine;
}

// Linha de apoio: próxima dose (com o atraso, se houver) ou esquema completo
function getDoseLine(item: CardVaccine): string {
  if (!item.nextDose) {
    return item.status === 'COMPLETA' ? 'Esquema completo' : `${item.appliedDoses} de ${item.totalDoses} doses`;
  }
  if (item.status === 'ATRASADA') {
    return `${item.nextDose.doseName} · ${formatOverdue(getDaysOverdue(item.nextDoseDate))}`;
  }
  return `Próxima: ${item.nextDose.doseName}`;
}

/**
 * Cartão de uma vacina na caderneta: abre o detalhe ao tocar
 */
export function VaccineListItem({ item }: Props) {
  const status = SCHEDULE_STATUS[item.status];
  const lastRecord = getLastRecord(item);
  const recordBadge = lastRecord ? getRecordBadge(lastRecord) : null;
  const doseLine = getDoseLine(item);
  const lastDate = item.lastDose ? formatCalendarDate(item.lastDose.applicationDate) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        item.vaccine.name,
        status.label,
        doseLine,
        lastDate ? `Última dose em ${lastDate}` : 'Nenhuma dose registrada',
        recordBadge?.label,
      ]
        .filter(Boolean)
        .join('. ')}
      accessibilityHint="Abre o detalhe da vacina"
      onPress={() => router.push({ pathname: '/cidadao/vacina/[vaccineId]', params: { vaccineId: item.vaccine.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.header}>
        <View style={styles.title}>
          <Text style={styles.name}>{item.vaccine.name}</Text>
          <Text style={[typography.muted, item.status === 'ATRASADA' && styles.overdue]}>{doseLine}</Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>

      <View style={styles.footer}>
        <View style={styles.date}>
          <Icon name="calendar-outline" size={16} color={colors.muted} />
          <Text style={typography.muted}>{lastDate ? `Última: ${lastDate}` : 'Nenhuma dose registrada'}</Text>
        </View>
        {recordBadge && <Badge label={recordBadge.label} tone={recordBadge.tone} icon={recordBadge.icon} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardPressed: {
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.primaryDark,
  },
  overdue: {
    color: colors.danger,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
