import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Card, Icon, Screen, StateMessage } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { SummaryCard } from '@/components/vaccination/SummaryCard';
import { useAuth } from '@/hooks/useAuth';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { CardVaccine } from '@/types/vaccination';
import { getFirstName, getInitials } from '@/utils/roles';
import { EMPTY_CARD_MESSAGE, formatOverdue, getDaysOverdue, sortVaccines } from '@/utils/vaccination';

/**
 * Início da ala Cidadão (RF006): saudação, resumo da caderneta e alertas das doses atrasadas
 */
export default function CitizenHome() {
  const { user } = useAuth();
  const { card, error, isRefreshing, reload } = useVaccinationCard();
  if (!user) return null;

  const overdue = card ? sortVaccines(card.vaccines).filter((item) => item.status === 'ATRASADA') : [];

  return (
    <Screen edges={['top']} refreshing={isRefreshing} onRefresh={() => reload({ refreshing: true })}>
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Icon name="shield-checkmark" size={18} color={colors.white} />
        </View>
        <Text style={typography.title} accessibilityRole="header">
          Minha caderneta
        </Text>
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

      {!card ? (
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
              <SummaryCard summary={card.summary} />
              <AlertsCard overdue={overdue} />
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

function AlertsCard({ overdue }: { overdue: CardVaccine[] }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={typography.subtitle} accessibilityRole="header">
          Alertas
        </Text>
        {overdue.length > 0 && (
          <Text style={styles.sectionCount}>{overdue.length} em atraso</Text>
        )}
      </View>

      <Card style={styles.alerts}>
        {overdue.map((item) => {
          const dose = item.nextDose?.doseName;
          const overdueText = formatOverdue(getDaysOverdue(item.nextDoseDate));
          return (
            <Pressable
              key={item.vaccine.id}
              accessibilityRole="button"
              accessibilityLabel={[item.vaccine.name, dose, overdueText].filter(Boolean).join('. ')}
              accessibilityHint="Abre o detalhe da vacina"
              onPress={() =>
                router.push({ pathname: '/cidadao/vacina/[vaccineId]', params: { vaccineId: item.vaccine.id } })
              }
              style={({ pressed }) => [styles.alertRow, pressed && styles.alertRowPressed]}
            >
              <View style={[styles.alertIcon, styles.alertIconDanger]}>
                <Icon name="alert-circle-outline" color={colors.danger} />
              </View>
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>{item.vaccine.name}</Text>
                <Text style={typography.muted}>
                  {dose ? `${dose} · ` : ''}
                  <Text style={styles.overdue}>{overdueText}</Text>
                </Text>
              </View>
              <Text style={styles.details}>Ver detalhes</Text>
              <Icon name="chevron-forward" size={16} />
            </Pressable>
          );
        })}

        <View style={styles.alertRow} accessible>
          <View style={styles.alertIcon}>
            <Icon name="checkmark" />
          </View>
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, styles.ok]}>
              {overdue.length > 0 ? 'Demais vacinas em dia' : 'Tudo em dia'}
            </Text>
            <Text style={typography.muted}>
              {overdue.length > 0
                ? 'As outras vacinas da caderneta não têm atraso.'
                : 'Nenhuma dose atrasada na sua caderneta.'}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  alertRowPressed: {
    backgroundColor: colors.surface,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconDanger: {
    backgroundColor: colors.dangerSoft,
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
  overdue: {
    fontFamily: fonts.medium,
    color: colors.danger,
  },
  details: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primary,
  },
});
