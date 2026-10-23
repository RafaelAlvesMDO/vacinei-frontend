import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Banner, Button, Card, Icon, Screen, StateMessage, StepHeader } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { CardRecord, CardVaccine } from '@/types/vaccination';
import { formatCalendarDate } from '@/utils/format';
import { formatOverdue, getDaysOverdue, getRecordBadge, SCHEDULE_STATUS, sortRecords } from '@/utils/vaccination';

/**
 * Detalhe de uma vacina da caderneta (RF006): doses aplicadas, próxima dose e registros (D06)
 */
export default function VaccineDetail() {
  const { vaccineId } = useLocalSearchParams<{ vaccineId: string }>();
  const { card, error, isRefreshing, reload } = useVaccinationCard();
  const item = card?.vaccines.find((vaccine) => vaccine.vaccine.id === vaccineId);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/cidadao/caderneta'));

  return (
    <Screen
      header={<StepHeader title="Detalhe da vacina" onBack={goBack} />}
      refreshing={isRefreshing}
      onRefresh={() => reload({ refreshing: true })}
    >
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
          <VaccineContent item={item} citizenName={card.citizen.name} />
        </>
      )}
    </Screen>
  );
}

function VaccineContent({ item, citizenName }: { item: CardVaccine; citizenName: string }) {
  const status = SCHEDULE_STATUS[item.status];
  const records = sortRecords(item.records);
  const isOverdue = item.status === 'ATRASADA';
  const overdueText = formatOverdue(getDaysOverdue(item.nextDoseDate));

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <Text style={[typography.title, styles.heroTitle]} accessibilityRole="header">
            {item.vaccine.name}
          </Text>
          <Badge label={status.label} tone={status.tone} icon={status.icon} />
        </View>
        <Text style={typography.muted}>
          {item.vaccine.targetDisease} · {citizenName}
        </Text>
      </View>

      {isOverdue && (
        <Banner
          tone="warning"
          title={overdueText}
          message="Procure uma Unidade Básica de Saúde para colocar esta vacina em dia."
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

      <View style={styles.section}>
        <Text style={typography.subtitle} accessibilityRole="header">
          Histórico de doses
        </Text>
        {records.length === 0 ? (
          <Card>
            <Text style={typography.muted}>Nenhuma dose desta vacina foi registrada.</Text>
          </Card>
        ) : (
          records.map((record) => <RecordCard key={record.id} record={record} />)
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

function RecordCard({ record }: { record: CardRecord }) {
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
        <InfoRow label="UBS" value={record.ubs?.name ?? 'Não informada'} />
        {record.ubs && <SeeOnMapButton ubs={record.ubs} />}
        <InfoRow
          label="Profissional"
          value={record.appliedBy?.name ?? (isConfirmed ? 'Não informado' : 'Aguardando confirmação')}
        />
      </View>

      {!isConfirmed && (
        <Text style={styles.note}>Registro informado por você. Ele passa a valer como confirmado depois que um profissional de saúde o conferir presencialmente.</Text>
      )}
    </Card>
  );
}

// Atalho para o detalhe da UBS onde a dose foi aplicada (RF008 nota 9)
function SeeOnMapButton({ ubs }: { ubs: { id: string; name: string } }) {
  return (
    <Button
      label="Ver no mapa"
      icon="map-outline"
      variant="link"
      accessibilityHint={`Abre o endereço e a rota até ${ubs.name}`}
      onPress={() => router.push({ pathname: '/cidadao/ubs/[ubsId]', params: { ubsId: ubs.id } })}
      style={styles.mapLink}
    />
  );
}

const styles = StyleSheet.create({
  mapLink: {
    alignSelf: 'flex-end',
    marginRight: -spacing.sm,
    marginTop: -spacing.sm,
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  heroHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroTitle: {
    flexShrink: 1,
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
});
