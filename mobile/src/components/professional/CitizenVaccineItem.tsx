import { StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Icon } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { CardRecord, CardVaccine } from '@/types/vaccination';
import { formatCalendarDate } from '@/utils/format';
import { formatOverdue, getDaysOverdue, getRecordBadge, SCHEDULE_STATUS, sortRecords } from '@/utils/vaccination';

interface Props {
  item: CardVaccine;
  // RS006: na própria caderneta, sem as ações de confirmar (D11)
  canConfirm: boolean;
  onConfirmDose: () => void;
  onConfirmRecord: (record: CardRecord) => void;
}

// Situação da vacina para o profissional: dose atrasada, próxima dose ou esquema completo
function getDoseLine(item: CardVaccine): string {
  if (item.alert.status === 'ATRASADA' && item.nextDose) {
    return `${item.nextDose.doseName} · ${formatOverdue(getDaysOverdue(item.nextDoseDate))}`;
  }
  if (item.nextDose) {
    const date = item.nextDoseDate ? ` · prevista para ${formatCalendarDate(item.nextDoseDate)}` : '';
    return `Próxima: ${item.nextDose.doseName}${date}`;
  }
  return item.status === 'COMPLETA' ? 'Esquema completo' : `${item.appliedDoses} de ${item.totalDoses} doses`;
}

/**
 * Vacina na caderneta do cidadão (RF010): situação (D32), doses registradas e as ações "Confirmar dose" e,
 * para os registros do cidadão ainda não conferidos, "Confirmar registro" (RF007 nota 7)
 */
export function CitizenVaccineItem({ item, canConfirm, onConfirmDose, onConfirmRecord }: Props) {
  const status = SCHEDULE_STATUS[item.alert.status];
  const records = sortRecords(item.records);
  // Ainda há dose do esquema sem registro (as registradas pelo cidadão são confirmadas no próprio registro)
  const hasFreeDose = item.records.length < item.vaccine.dosesCount;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{item.vaccine.name}</Text>
        <Text style={[typography.muted, item.alert.status === 'ATRASADA' && styles.overdue]}>{getDoseLine(item)}</Text>
        <View style={styles.badge}>
          <Badge label={status.label} tone={status.tone} icon={status.icon} />
        </View>
      </View>

      {records.length > 0 && (
        <View style={styles.records}>
          {records.map((record) => (
            <RecordRow
              key={record.id}
              record={record}
              canConfirm={canConfirm}
              onConfirm={() => onConfirmRecord(record)}
            />
          ))}
        </View>
      )}

      {canConfirm && hasFreeDose && (
        <Button
          label="Confirmar dose"
          icon="needle"
          variant="secondary"
          accessibilityHint={`Registra uma dose aplicada de ${item.vaccine.name}`}
          onPress={onConfirmDose}
        />
      )}
    </View>
  );
}

function RecordRow({ record, canConfirm, onConfirm }: { record: CardRecord; canConfirm: boolean; onConfirm: () => void }) {
  const badge = getRecordBadge(record);
  const isConfirmed = record.status === 'CONFIRMADO';
  const date = formatCalendarDate(record.applicationDate);
  const lote = record.lotNumber ? ` · Lote ${record.lotNumber}` : '';

  return (
    <View style={styles.record}>
      <View style={styles.recordRow} accessible accessibilityLabel={`${record.dose.doseName}, ${date}${lote}. ${badge.label}`}>
        <View style={[styles.recordIcon, !isConfirmed && styles.recordIconPending]}>
          <Icon
            name={isConfirmed ? 'checkmark' : 'time-outline'}
            size={18}
            color={isConfirmed ? colors.primary : colors.warning}
          />
        </View>
        <View style={styles.recordText}>
          <Text style={styles.recordName}>{record.dose.doseName}</Text>
          <Text style={typography.muted}>
            {date}
            {lote}
          </Text>
          {!isConfirmed && <Text style={styles.pending}>Informada pelo cidadão · aguardando confirmação</Text>}
        </View>
      </View>
      {canConfirm && !isConfirmed && (
        <Button
          label="Confirmar registro"
          icon="checkmark-circle-outline"
          variant="link"
          accessibilityHint={`Confere e confirma o registro: ${record.dose.doseName}`}
          onPress={onConfirm}
          style={styles.recordAction}
        />
      )}
    </View>
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
  header: {
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
  badge: {
    marginTop: spacing.xs,
  },
  records: {
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  record: {
    gap: spacing.xs,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIconPending: {
    backgroundColor: colors.warningSoft,
  },
  recordText: {
    flex: 1,
    minWidth: 0,
  },
  recordName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.primaryDark,
  },
  pending: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.warning,
  },
  recordAction: {
    alignSelf: 'flex-end',
  },
});
