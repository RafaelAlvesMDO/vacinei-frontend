import { StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { CitizenSearchResult } from '@/types/citizen';
import { formatCalendarDate } from '@/utils/format';
import { getInitials } from '@/utils/roles';
import { openCitizenCard } from './navigation';

interface Props {
  citizen: CitizenSearchResult;
  // O próprio profissional (D11): a caderneta abre, mas sem confirmar doses (RS006)
  isSelf: boolean;
}

/**
 * Resultado da busca de cidadãos: dados para conferir a identidade antes de abrir a caderneta
 */
export function CitizenResultCard({ citizen, isSelf }: Props) {
  const birth = formatCalendarDate(citizen.birthDate);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={styles.initials}>{getInitials(citizen.name)}</Text>
        </View>
        <View style={styles.title}>
          <Text style={styles.name}>{citizen.name}</Text>
          {(isSelf || citizen.role === 'PROFISSIONAL_SAUDE') && (
            <Badge label={isSelf ? 'Você' : 'Profissional'} tone="neutral" icon="medkit-outline" />
          )}
        </View>
      </View>

      <View style={styles.details}>
        <Detail label="Nascimento" value={birth} />
        <Detail label="CPF" value={citizen.cpf ?? '—'} />
      </View>

      <Button
        label="Selecionar"
        icon="arrow-forward"
        variant="secondary"
        accessibilityHint={`Abre a caderneta de ${citizen.name}`}
        onPress={() => openCitizenCard(citizen.id)}
      />
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.primaryDark,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  detail: {
    flexGrow: 1,
    flexBasis: 120,
    gap: 2,
  },
  detailLabel: {
    ...typography.muted,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.primaryDark,
  },
});
