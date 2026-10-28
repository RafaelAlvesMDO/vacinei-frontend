import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertRow } from '@/components/alerts/AlertRow';
import { Banner, Button, Card, Icon, Screen, StateMessage } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { SummaryCard } from '@/components/vaccination/SummaryCard';
import { useAuth } from '@/hooks/useAuth';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { colors, fonts, radius, spacing, touchTarget, typography } from '@/theme';
import { getFirstName, getInitials } from '@/utils/roles';
import { getDigestVaccineIds, getTodayNotices, type DailyDigest } from '@/utils/vaccineAlerts';
import { AWAITING_MESSAGE, EMPTY_CARD_MESSAGE, formatOverdue, formatPendingDoses } from '@/utils/vaccination';

function openVaccine(vaccineId: string) {
  router.push({ pathname: '/cidadao/vacina/[vaccineId]', params: { vaccineId } });
}

/**
 * Início da ala Cidadão (RF006, RF007): saudação, resumo da caderneta, alertas do dia (D32) e acesso à
 * Central de notificações
 */
export default function CitizenHome() {
  const { user } = useAuth();
  const { card, error, isRefreshing, reload } = useVaccinationCard();
  if (!user) return null;

  // Avisos do dia, calculados da caderneta (RF007 dentro do app; as notificações do sistema ficam para a etapa final)
  const digest = card ? getTodayNotices(card.vaccines, new Date()) : null;
  const noticeCount = digest ? getDigestVaccineIds(digest).length : 0;

  return (
    <Screen edges={['top']} refreshing={isRefreshing} onRefresh={() => reload({ refreshing: true })}>
      <View style={styles.brandRow}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Icon name="shield-checkmark" size={18} color={colors.white} />
          </View>
          <Text style={[typography.title, styles.brandTitle]} accessibilityRole="header">
            Minha caderneta
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            noticeCount > 0
              ? `Notificações: ${noticeCount} ${noticeCount === 1 ? 'aviso' : 'avisos'} hoje`
              : 'Notificações'
          }
          accessibilityHint="Abre a Central de notificações"
          onPress={() => router.push('/cidadao/notificacoes')}
          style={({ pressed }) => [styles.bell, pressed && styles.bellPressed]}
        >
          <Icon name="notifications-outline" color={colors.primaryDark} />
          {noticeCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{noticeCount > 9 ? '9+' : noticeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <Card style={styles.greeting}>
        <View style={styles.greetingText}>
          <Text style={typography.subtitle}>Olá, {getFirstName(user.name)}</Text>
          <Text style={typography.muted} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
        <View style={styles.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={styles.initials}>{getInitials(user.name)}</Text>
        </View>
      </Card>

      {!card || !digest ? (
        <CardLoadState error={error} onRetry={() => reload()} />
      ) : (
        <>
          {error && <Banner tone="danger" title="Não foi possível atualizar" message={error} />}

          {card.vaccines.length === 0 ? (
            <StateMessage
              variant="empty"
              icon="book-outline"
              title="Caderneta vazia"
              message={EMPTY_CARD_MESSAGE}
              action={{
                label: 'Cadastrar vacina',
                icon: 'add-circle-outline',
                onPress: () => router.push('/cidadao/registro-vacina'),
              }}
            />
          ) : (
            <>
              <SummaryCard vaccines={card.vaccines} />
              <AlertsCard digest={digest} />
              <Button
                label="Ver caderneta completa"
                variant="secondary"
                icon="book-outline"
                onPress={() => router.navigate('/cidadao/caderneta')}
              />
            </>
          )}
        </>
      )}
    </Screen>
  );
}

// Alertas do dia: doses atrasadas e aguardando conferência (os lembretes ficam na Central)
function AlertsCard({ digest }: { digest: DailyDigest }) {
  const { overdue, awaiting } = digest;
  const hasAlerts = overdue.length > 0 || awaiting.length > 0;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={typography.subtitle} accessibilityRole="header">
          Alertas
        </Text>
        {overdue.length > 0 && <Text style={styles.sectionCount}>{overdue.length} em atraso</Text>}
      </View>

      <Card style={styles.alerts}>
        {overdue.map((alert) => (
          <AlertRow
            key={`atrasada-${alert.vaccineId}`}
            tone="danger"
            icon="alert-circle-outline"
            title={alert.vaccineName}
            dose={alert.doseName}
            detail={formatOverdue(alert.days)}
            actionLabel="Ver detalhes"
            accessibilityHint="Abre o detalhe da vacina"
            onPress={() => openVaccine(alert.vaccineId)}
          />
        ))}
        {awaiting.map((alert) => (
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

        <View style={styles.alertRow} accessible>
          <View style={styles.alertIcon}>
            <Icon name="checkmark" />
          </View>
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, styles.ok]}>{hasAlerts ? 'Demais vacinas em dia' : 'Tudo em dia'}</Text>
            <Text style={typography.muted}>
              {hasAlerts
                ? 'As outras vacinas da caderneta não têm pendências.'
                : 'Nenhuma dose atrasada ou aguardando conferência na sua caderneta.'}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brand: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandTitle: {
    flexShrink: 1,
  },
  bell: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellPressed: {
    backgroundColor: colors.surface,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.white,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  greetingText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionCount: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.danger,
  },
  alerts: {
    padding: spacing.sm,
    gap: 0,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 56,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  alertTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.primaryDark,
  },
  ok: {
    color: colors.primary,
  },
});
