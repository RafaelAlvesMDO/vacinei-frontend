import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card } from '@/components/ui';
import { colors, fonts, spacing, typography } from '@/theme';
import type { RecentDose } from '@/types/dashboard';
import { formatCalendarDate } from '@/utils/format';
import { getRecordBadge } from '@/utils/vaccination';
import { openCitizenCard } from './navigation';

interface Props {
  doses: RecentDose[] | null;
  error: string | null;
  onRetry: () => void;
}

/**
 * Registros recentes do painel (RF009): "Confirmado" ou "Aguardando confirmação" (registro do cidadão,
 * RF007 nota 7). O cartão abre a caderneta do cidadão (RF009 nota 4)
 */
export function RecentDosesCard({ doses, error, onRetry }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={typography.subtitle} accessibilityRole="header">
          Registros recentes
        </Text>
        <Text style={typography.muted}>Últimas doses registradas nas cadernetas</Text>
      </View>

      {!doses ? (
        error ? (
          <View style={styles.state}>
            <Text style={[typography.muted, styles.error]} accessibilityRole="alert">
              {error}
            </Text>
            <Button label="Tentar novamente" icon="refresh" variant="secondary" onPress={onRetry} />
          </View>
        ) : (
          <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando registros recentes" />
        )
      ) : doses.length === 0 ? (
        <Text style={typography.muted}>Nenhuma dose registrada ainda.</Text>
      ) : (
        <View>
          {doses.map((dose, index) => (
            <RecentDoseRow key={dose.id} dose={dose} first={index === 0} />
          ))}
        </View>
      )}
    </Card>
  );
}

function RecentDoseRow({ dose, first }: { dose: RecentDose; first: boolean }) {
  const badge = getRecordBadge(dose);
  const date = formatCalendarDate(dose.applicationDate);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dose.citizen.name}. ${dose.vaccine.name}, ${dose.dose.doseName}. ${date}. ${badge.label}`}
      accessibilityHint="Abre a caderneta do cidadão"
      onPress={() => openCitizenCard(dose.citizen.id)}
      style={({ pressed }) => [styles.row, !first && styles.rowBorder, pressed && styles.pressed]}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.name}>{dose.citizen.name}</Text>
        <Text style={typography.muted}>{date}</Text>
      </View>
      <Text style={typography.muted}>
        {dose.vaccine.name} · {dose.dose.doseName}
      </Text>
      <Badge label={badge.label} tone={badge.tone} icon={badge.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  header: {
    gap: 2,
  },
  state: {
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
  },
  row: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  rowHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: spacing.md,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.primaryDark,
  },
});
