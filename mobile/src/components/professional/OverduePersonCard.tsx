import { StyleSheet, Text, View } from 'react-native';
import { Badge, Button } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { OverdueGroup, OverduePerson, OverdueVaccine } from '@/types/dashboard';
import { formatCalendarDate } from '@/utils/format';
import { getInitials } from '@/utils/roles';
import { formatPendingDoses } from '@/utils/vaccination';
import { openCitizenCard } from './navigation';

const DAYS_PER_YEAR = 365;

// 18 → "Atrasado há 18 dias"; acima de 1 ano, "Atrasado há mais de 1 ano" (D32)
function formatDaysOverdue(days: number): string {
  if (days > DAYS_PER_YEAR) return 'Atrasado há mais de 1 ano';
  return `Atrasado há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

interface Props {
  person: OverduePerson;
  group: OverdueGroup;
}

/**
 * Pessoa da busca ativa (D21, D32): vacinas atrasadas (dose e data prevista) ou doses informadas
 * aguardando conferência (com a data de aplicação informada). Abre a caderneta
 */
export function OverduePersonCard({ person, group }: Props) {
  const isOverdue = group === 'ATRASADA';
  const days = person.maxDaysOverdue;

  return (
    <View style={[styles.card, !isOverdue && styles.cardAwaiting]}>
      <View style={styles.header}>
        <View style={styles.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={styles.initials}>{getInitials(person.name)}</Text>
        </View>
        <View style={styles.title}>
          <Text style={styles.name}>{person.name}</Text>
          <Text style={typography.muted}>CPF {person.cpf ?? '—'}</Text>
        </View>
      </View>

      {isOverdue && days !== null && (
        <Badge label={formatDaysOverdue(days)} tone="danger" icon="alert-circle-outline" />
      )}

      <View style={styles.vaccines}>
        {person.vaccines.map((vaccine) => (
          <VaccineLine key={vaccine.vaccineId} vaccine={vaccine} isOverdue={isOverdue} />
        ))}
      </View>

      <Button
        label="Abrir caderneta"
        icon="open-outline"
        variant="secondary"
        accessibilityHint={`Abre a caderneta de ${person.name}`}
        onPress={() => openCitizenCard(person.id)}
      />
    </View>
  );
}

function VaccineLine({ vaccine, isOverdue }: { vaccine: OverdueVaccine; isOverdue: boolean }) {
  const pending = vaccine.pendingDoses;

  return (
    <View style={styles.vaccine} accessible>
      <Text style={styles.vaccineName}>{vaccine.vaccineName}</Text>
      {isOverdue && vaccine.nextDose && (
        <Text style={typography.muted}>
          {vaccine.nextDose.doseName} · prevista para {formatCalendarDate(vaccine.nextDoseDate)}
        </Text>
      )}
      {isOverdue && pending.length > 0 && (
        <Badge label={`Registro aguardando confirmação: ${formatPendingDoses(pending)}`} tone="warning" icon="time-outline" />
      )}
      {!isOverdue &&
        pending.map((dose) => (
          <Text key={dose.id} style={typography.muted}>
            {dose.doseName} · informada como aplicada em {formatCalendarDate(dose.applicationDate)}
          </Text>
        ))}
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
  cardAwaiting: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.primaryDark,
  },
  vaccines: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  vaccine: {
    gap: 2,
  },
  vaccineName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.primaryDark,
  },
});
