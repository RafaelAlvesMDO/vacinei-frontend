import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AlertRow } from '@/components/alerts/AlertRow';
import { Badge, Banner, Card, Icon, Screen, StepHeader } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { colors, radius, spacing, typography } from '@/theme';
import {
  formatReminderWhen,
  getDigestVaccineIds,
  getTodayNotices,
  getUpcomingDoses,
  type DailyDigest,
  type ReminderAlert,
} from '@/utils/vaccineAlerts';
import { AWAITING_MESSAGE, formatOverdue, formatPendingDoses } from '@/utils/vaccination';

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

// "Hoje, 28 de outubro" no fuso de Maceió
function formatToday(now: Date): string {
  const [, month, day] = now.toLocaleDateString('en-CA', { timeZone: 'America/Maceio' }).split('-').map(Number);
  return `Hoje, ${day} de ${MONTHS[month - 1]}`;
}

function openVaccine(vaccineId: string) {
  router.push({ pathname: '/cidadao/vacina/[vaccineId]', params: { vaccineId } });
}

/**
 * Central de notificações (RF007, D31), dentro do app: os avisos de hoje (atrasadas, aguardando conferência e
 * lembretes) e as doses previstas para os próximos 7 dias, recalculados da caderneta. As notificações do
 * sistema ficam para a etapa final (D24)
 */
export default function NotificationCenter() {
  const { card, error, isRefreshing, reload } = useVaccinationCard();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/cidadao/inicio'));

  const now = new Date();
  const digest = card ? getTodayNotices(card.vaccines, now) : null;
  const upcoming = card ? getUpcomingDoses(card.vaccines, now) : [];
  const todayCount = digest ? getDigestVaccineIds(digest).length : 0;

  return (
    <Screen
      header={<StepHeader title="Notificações" subtitle="Avisos da sua caderneta" onBack={goBack} />}
      refreshing={isRefreshing}
      onRefresh={() => reload({ refreshing: true })}
    >
      <View style={styles.summary} accessible>
        <View style={styles.summaryIcon}>
          <Icon name="calendar-outline" color={colors.white} />
        </View>
        <View style={styles.summaryText}>
          <Text style={typography.subtitle}>Resumo dos seus avisos</Text>
          <Text style={typography.muted}>Doses atrasadas, aguardando conferência e as próximas da sua caderneta.</Text>
        </View>
        {digest && (
          <Badge
            label={todayCount === 1 ? '1 hoje' : `${todayCount} hoje`}
            tone={todayCount > 0 ? 'danger' : 'primary'}
          />
        )}
      </View>

      {!card || !digest ? (
        <CardLoadState error={error} onRetry={() => reload()} />
      ) : (
        <>
          {error && <Banner tone="danger" title="Não foi possível atualizar" message={error} />}
          <TodayCard digest={digest} count={todayCount} now={now} />
          <UpcomingSection upcoming={upcoming} />
          <Text style={styles.note}>
            Os avisos são calculados a partir da sua caderneta. Puxe para baixo para atualizar.
          </Text>
        </>
      )}

      <View style={styles.privacy} accessible>
        <Icon name="lock-closed-outline" size={16} color={colors.muted} />
        <Text style={typography.muted}>Seus dados de saúde são protegidos e privados.</Text>
      </View>
    </Screen>
  );
}

function TodayCard({ digest, count, now }: { digest: DailyDigest; count: number; now: Date }) {
  return (
    <Card style={styles.today}>
      <View style={styles.todayHeader}>
        <View style={[styles.todayIcon, count === 0 && styles.todayIconOk]}>
          <Icon
            name={count > 0 ? 'notifications-outline' : 'checkmark-circle-outline'}
            color={count > 0 ? colors.danger : colors.primary}
          />
        </View>
        <View style={styles.todayTitle}>
          <Text style={typography.subtitle} accessibilityRole="header">
            {formatToday(now)}
          </Text>
          <Text style={typography.muted}>
            {count === 0
              ? 'Nenhuma pendência encontrada'
              : count === 1
                ? '1 vacina precisa da sua atenção'
                : `${count} vacinas precisam da sua atenção`}
          </Text>
        </View>
      </View>

      {count > 0 && (
        <View style={styles.rows}>
          {digest.overdue.map((alert) => (
            <AlertRow
              key={`atrasada-${alert.vaccineId}`}
              tone="danger"
              icon="medkit-outline"
              title={alert.vaccineName}
              dose={alert.doseName}
              detail={formatOverdue(alert.days)}
              actionLabel="Registrar dose"
              accessibilityHint="Abre o cadastro da dose com esta vacina preenchida"
              onPress={() =>
                router.push({ pathname: '/cidadao/registro-vacina', params: { vaccineId: alert.vaccineId } })
              }
            />
          ))}
          {digest.awaiting.map((alert) => (
            <AlertRow
              key={`aguardando-${alert.vaccineId}`}
              tone="warning"
              icon="time-outline"
              title={alert.vaccineName}
              dose={formatPendingDoses(alert.doses)}
              detail={AWAITING_MESSAGE}
              actionLabel="Ver detalhes"
              accessibilityHint="Abre o detalhe da vacina"
              onPress={() => openVaccine(alert.vaccineId)}
            />
          ))}
          {digest.reminders.map((alert) => (
            <ReminderRow key={`lembrete-${alert.vaccineId}`} reminder={alert} />
          ))}
        </View>
      )}
    </Card>
  );
}

function ReminderRow({ reminder }: { reminder: ReminderAlert }) {
  return (
    <AlertRow
      tone="primary"
      icon="calendar-outline"
      title={reminder.vaccineName}
      dose={reminder.doseName}
      detail={formatReminderWhen(reminder)}
      actionLabel="Ver detalhes"
      accessibilityHint="Abre o detalhe da vacina"
      onPress={() => openVaccine(reminder.vaccineId)}
    />
  );
}

function UpcomingSection({ upcoming }: { upcoming: ReminderAlert[] }) {
  return (
    <View style={styles.section}>
      <Text style={typography.subtitle} accessibilityRole="header">
        Próximos 7 dias
      </Text>
      <Card style={styles.rowsCard}>
        {upcoming.length === 0 ? (
          <Text style={[typography.muted, styles.empty]}>Nenhuma dose prevista para os próximos 7 dias.</Text>
        ) : (
          upcoming.map((reminder) => <ReminderRow key={reminder.vaccineId} reminder={reminder} />)
        )}
      </Card>
      <Text style={styles.note}>As doses previstas aparecem aqui até 7 dias antes da data.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  today: {
    padding: spacing.sm,
    gap: 0,
    borderColor: colors.primary,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
  },
  todayIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayIconOk: {
    backgroundColor: colors.surface,
  },
  todayTitle: {
    flex: 1,
    minWidth: 0,
  },
  rows: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  rowsCard: {
    padding: spacing.sm,
    gap: 0,
  },
  empty: {
    padding: spacing.sm,
  },
  note: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
