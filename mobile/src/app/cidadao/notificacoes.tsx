import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AlertRow } from '@/components/alerts/AlertRow';
import { Badge, Banner, Button, Card, Icon, Screen, StepHeader } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { useVaccineAlerts } from '@/hooks/useVaccineAlerts';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import {
  buildDailyDigest,
  formatReminderWhen,
  getDigestVaccineIds,
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
 * Central de notificações (RF007, D31): os avisos de hoje (atrasadas, aguardando conferência e lembretes)
 * e as doses previstas para os próximos 7 dias. Não há histórico: as notificações locais não ficam
 * registradas, e os avisos são recalculados da caderneta
 */
export default function NotificationCenter() {
  const { card, error, isRefreshing, reload } = useVaccinationCard();
  const { preferences, permission } = useVaccineAlerts();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/cidadao/inicio'));

  const now = new Date();
  const digest = card ? buildDailyDigest(card.vaccines, now) : null;
  const upcoming = card ? getUpcomingDoses(card.vaccines, now) : [];
  const todayCount = digest ? getDigestVaccineIds(digest).length : 0;

  const notificationsOff = permission?.state !== 'granted' || (!preferences.alerts && !preferences.reminders);

  return (
    <Screen
      header={<StepHeader title="Notificações" subtitle="Lembretes agrupados por dia" onBack={goBack} />}
      refreshing={isRefreshing}
      onRefresh={() => reload({ refreshing: true })}
    >
      <View style={styles.summary} accessible>
        <View style={styles.summaryIcon}>
          <Icon name="calendar-outline" color={colors.white} />
        </View>
        <View style={styles.summaryText}>
          <Text style={typography.subtitle}>Resumo dos seus avisos</Text>
          <Text style={typography.muted}>Você recebe uma notificação consolidada por dia, às 8h.</Text>
        </View>
        {digest && (
          <Badge
            label={todayCount === 1 ? '1 hoje' : `${todayCount} hoje`}
            tone={todayCount > 0 ? 'danger' : 'primary'}
          />
        )}
      </View>

      {notificationsOff && (
        <View style={styles.off}>
          <Banner
            tone="warning"
            icon="notifications-off-outline"
            title="Notificações desativadas"
            message="Os avisos continuam aqui no app. Para recebê-los no celular, ative-os no Perfil."
          />
          <Button
            label="Ativar no Perfil"
            variant="secondary"
            icon="person-circle-outline"
            onPress={() => router.navigate('/cidadao/perfil')}
          />
        </View>
      )}

      {!card || !digest ? (
        <CardLoadState error={error} onRetry={() => reload()} />
      ) : (
        <>
          {error && <Banner tone="danger" title="Não foi possível atualizar" message={error} />}
          <TodayCard digest={digest} count={todayCount} now={now} />
          <UpcomingSection upcoming={upcoming} />
          <Text style={styles.note}>
            Os avisos são calculados a partir da sua caderneta. As notificações no celular refletem a caderneta da
            última vez que você abriu o app.
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
        <Text style={styles.time}>08:00</Text>
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
      <Text style={styles.note}>Você recebe um lembrete 7 dias antes e outro no dia da data prevista.</Text>
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
  off: {
    gap: spacing.sm,
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
  time: {
    ...typography.muted,
    fontFamily: fonts.medium,
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
