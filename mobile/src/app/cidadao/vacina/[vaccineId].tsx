import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Banner, Button, Card, ConfirmDialog, Icon, Screen, StateMessage, StepHeader } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { parseApiError } from '@/services/auth';
import { deleteRecord } from '@/services/vaccinationRecords';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { CardRecord, CardVaccine } from '@/types/vaccination';
import { formatCalendarDate } from '@/utils/format';
import {
  AWAITING_MESSAGE,
  formatOverdue,
  formatPendingDoses,
  getDaysOverdue,
  getRecordBadge,
  SCHEDULE_STATUS,
  sortRecords,
} from '@/utils/vaccination';

/**
 * Detalhe de uma vacina da caderneta (RF006): doses aplicadas, próxima dose e registros (D06)
 */
export default function VaccineDetail() {
  const { vaccineId } = useLocalSearchParams<{ vaccineId: string }>();
  const { card, error, isRefreshing, reload } = useVaccinationCard();
  const item = card?.vaccines.find((vaccine) => vaccine.vaccine.id === vaccineId);
  const [toDelete, setToDelete] = useState<CardRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/cidadao/caderneta'));

  // Exclusão do próprio registro ainda não confirmado (D30)
  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteRecord(toDelete.id);
      setFeedback({ tone: 'success', message: `O registro "${toDelete.dose.doseName}" foi removido da sua caderneta.` });
    } catch (reason) {
      const parsed = parseApiError(reason, 'Não foi possível excluir o registro. Tente novamente.');
      const message =
        parsed.status === 404
          ? 'Este registro não foi encontrado. Ele pode já ter sido excluído.'
          : parsed.status === 403
            ? 'Este registro já foi confirmado por um profissional de saúde e não pode mais ser excluído.'
            : parsed.message;
      setFeedback({ tone: 'danger', message });
    } finally {
      setDeleting(false);
      setToDelete(null);
      reload();
    }
  };

  return (
    <Screen
      header={<StepHeader title="Detalhe da vacina" onBack={goBack} />}
      refreshing={isRefreshing}
      onRefresh={() => reload({ refreshing: true })}
    >
      {feedback && (
        <Banner
          tone={feedback.tone}
          title={feedback.tone === 'success' ? 'Registro excluído' : 'Não foi possível excluir'}
          message={feedback.message}
        />
      )}
      <ConfirmDialog
        visible={toDelete !== null}
        variant="danger"
        icon="trash-outline"
        title="Excluir registro?"
        message={
          toDelete
            ? `O registro "${toDelete.dose.doseName}", aplicado em ${formatCalendarDate(toDelete.applicationDate)}, será removido da sua caderneta. Você pode cadastrá-lo de novo depois.`
            : ''
        }
        confirmLabel="Excluir"
        loadingLabel="Excluindo..."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      {!card ? (
        <CardLoadState error={error} onRetry={() => reload()} />
      ) : !item ? (
        <StateMessage
          variant="empty"
          icon="search"
          title="Vacina não encontrada"
          message="Esta vacina não está mais na sua caderneta."
          action={{ label: 'Voltar para a caderneta', icon: 'arrow-back', onPress: goBack }}
        />
      ) : (
        <>
          {error && <Banner tone="danger" title="Não foi possível atualizar" message={error} />}
          <VaccineContent
            item={item}
            citizenName={card.citizen.name}
            onDelete={(record) => {
              setFeedback(null);
              setToDelete(record);
            }}
          />
        </>
      )}
    </Screen>
  );
}

interface VaccineContentProps {
  item: CardVaccine;
  citizenName: string;
  onDelete: (record: CardRecord) => void;
}

function VaccineContent({ item, citizenName, onDelete }: VaccineContentProps) {
  // Situação do alerta (D32): só a dose confirmada encerra a pendência
  const status = SCHEDULE_STATUS[item.alert.status];
  const records = sortRecords(item.records);
  // Ainda há dose do esquema sem registro na caderneta
  const hasFreeDose = item.records.length < item.vaccine.dosesCount;
  const isOverdue = item.alert.status === 'ATRASADA';
  const overdueText = formatOverdue(getDaysOverdue(item.nextDoseDate));
  const pendingDoses = item.alert.pendingDoses;

  return (
    <>
      <View style={styles.hero}>
        <Text style={typography.title} accessibilityRole="header">
          {item.vaccine.name}
        </Text>
        <Text style={typography.muted}>
          {item.vaccine.targetDisease} · {citizenName}
        </Text>
        {/* Badge em linha própria, para o nome usar a largura inteira */}
        <View style={styles.heroBadge}>
          <Badge label={status.label} tone={status.tone} icon={status.icon} />
        </View>
      </View>

      {isOverdue && (
        <Banner
          tone="warning"
          title={overdueText}
          message="Procure uma Unidade Básica de Saúde para colocar esta vacina em dia."
        />
      )}

      {pendingDoses.length > 0 && (
        <Banner
          tone="warning"
          icon="time-outline"
          title={`${formatPendingDoses(pendingDoses)}: aguardando conferência`}
          message={`${AWAITING_MESSAGE}. O alerta só se encerra depois da confirmação por um profissional de saúde.`}
        />
      )}

      <Card style={styles.info}>
        <InfoRow label="Doses aplicadas" value={`${item.appliedDoses} de ${item.totalDoses}`} />
        <InfoRow
          label="Última aplicação"
          value={item.lastDose ? formatCalendarDate(item.lastDose.applicationDate) : 'Nenhuma'}
        />
        <InfoRow label="Próxima dose" value={item.nextDose?.doseName ?? 'Esquema completo'} />
        {item.nextDose && (
          <InfoRow
            label="Data prevista"
            value={item.nextDoseDate ? formatCalendarDate(item.nextDoseDate) : 'Sem data definida'}
            danger={isOverdue}
          />
        )}
      </Card>

      {hasFreeDose && (
        <Button
          label="Registrar nova dose"
          icon="add-circle-outline"
          accessibilityHint="Abre o cadastro manual com esta vacina preenchida"
          onPress={() =>
            router.push({ pathname: '/cidadao/registro-vacina', params: { vaccineId: item.vaccine.id } })
          }
        />
      )}

      {/* RF008 nota 9 (D29): abre a localização de UBS, já no mapa. A confirmação ainda não registra a UBS da dose */}
      <Button
        label="Ver UBS no mapa"
        icon="map-outline"
        variant="secondary"
        accessibilityHint="Abre a aba UBS no mapa"
        onPress={() => router.navigate({ pathname: '/cidadao/ubs', params: { modo: 'mapa' } })}
      />

      <View style={styles.section}>
        <Text style={typography.subtitle} accessibilityRole="header">
          Histórico de doses
        </Text>
        {records.length === 0 ? (
          <Card>
            <Text style={typography.muted}>Nenhuma dose desta vacina foi registrada.</Text>
          </Card>
        ) : (
          records.map((record) => <RecordCard key={record.id} record={record} onDelete={() => onDelete(record)} />)
        )}
      </View>
    </>
  );
}

function InfoRow({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.infoRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={typography.muted}>{label}</Text>
      <Text style={[styles.infoValue, danger && styles.danger]}>{value}</Text>
    </View>
  );
}

function RecordCard({ record, onDelete }: { record: CardRecord; onDelete: () => void }) {
  const badge = getRecordBadge(record);
  const isConfirmed = record.status === 'CONFIRMADO';
  const date = formatCalendarDate(record.applicationDate);

  return (
    <Card style={styles.record}>
      <View style={styles.recordHeader}>
        <View style={[styles.recordIcon, !isConfirmed && styles.recordIconPending]}>
          <Icon name={isConfirmed ? 'checkmark' : 'time-outline'} color={isConfirmed ? colors.primary : colors.warning} />
        </View>
        <View style={styles.recordTitle}>
          <Text style={styles.recordName}>{record.dose.doseName}</Text>
          <Text style={typography.muted}>{date}</Text>
        </View>
      </View>
      <Badge label={badge.label} tone={badge.tone} icon={badge.icon} />

      <View style={styles.recordDetails}>
        <InfoRow label="Lote" value={record.lotNumber ?? 'Não informado'} />
        <InfoRow
          label="Profissional"
          value={record.appliedBy?.name ?? (isConfirmed ? 'Não informado' : 'Aguardando confirmação')}
        />
      </View>

      {!isConfirmed && (
        <>
          <Text style={styles.note}>Registro informado por você. Ele passa a valer como confirmado depois que um profissional de saúde o conferir presencialmente.</Text>
          {/* Só registros não confirmados podem ser alterados pelo titular (D30) */}
          <View style={styles.recordActions}>
            <Button
              label="Editar"
              icon="create-outline"
              variant="link"
              accessibilityHint={`Edita o registro: ${record.dose.doseName}`}
              onPress={() =>
                router.push({ pathname: '/cidadao/registro-vacina', params: { recordId: record.id } })
              }
            />
            <Button
              label="Excluir"
              icon="trash-outline"
              variant="link"
              danger
              accessibilityHint={`Exclui o registro: ${record.dose.doseName}`}
              onPress={onDelete}
            />
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  heroBadge: {
    marginTop: spacing.xs,
  },
  info: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: spacing.md,
    rowGap: 2,
  },
  infoValue: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDark,
    textAlign: 'right',
  },
  danger: {
    color: colors.danger,
  },
  section: {
    gap: spacing.md,
  },
  record: {
    padding: spacing.lg,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIconPending: {
    backgroundColor: colors.warningSoft,
  },
  recordTitle: {
    flex: 1,
    minWidth: 0,
  },
  recordName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.primaryDark,
  },
  recordDetails: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  note: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  recordActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginRight: -spacing.sm,
  },
});
