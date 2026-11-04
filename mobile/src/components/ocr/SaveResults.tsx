import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Card, Icon, Screen, StepHeader, type IconName } from '@/components/ui';
import { colors, fonts, spacing, typography } from '@/theme';

export type SaveStatus = 'saved' | 'duplicate' | 'error';

export interface SaveOutcome {
  key: string;
  vaccine: string;
  dose: string;
  status: SaveStatus;
  // Mensagem da API no erro
  message: string | null;
}

interface Props {
  outcomes: SaveOutcome[];
  viewCardLabel: string;
  onViewCard: () => void;
  onRetryFailed: () => void;
}

const STATUS: Record<SaveStatus, { label: string; icon: IconName; color: string }> = {
  saved: { label: 'Salva · aguardando conferência', icon: 'checkmark-circle', color: colors.success },
  duplicate: { label: 'Já estava na caderneta', icon: 'checkmark-done-outline', color: colors.muted },
  error: { label: 'Não foi salva', icon: 'alert-circle', color: colors.danger },
};

/**
 * Resultado do salvamento, dose a dose. As doses salvas ficam aguardando conferência presencial (D06, D30)
 */
export function SaveResults({ outcomes, viewCardLabel, onViewCard, onRetryFailed }: Props) {
  const saved = outcomes.filter((outcome) => outcome.status === 'saved').length;
  const failed = outcomes.filter((outcome) => outcome.status === 'error').length;
  const title =
    failed === 0
      ? saved === 1
        ? '1 dose salva!'
        : `${saved} doses salvas!`
      : saved > 0
        ? `${saved} de ${outcomes.length} doses salvas`
        : 'Nenhuma dose foi salva';

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(failed > 0 ? `${title}. ${failed} com erro.` : title);
  }, [title, failed]);

  return (
    <Screen
      header={<StepHeader title="Resultado" />}
      footer={
        <View style={styles.footer}>
          {failed > 0 && (
            <Button
              label={failed === 1 ? 'Revisar a dose que falhou' : `Revisar as ${failed} doses que falharam`}
              icon="create-outline"
              onPress={onRetryFailed}
            />
          )}
          <Button label={viewCardLabel} icon="book-outline" variant={failed > 0 ? 'secondary' : 'primary'} onPress={onViewCard} />
        </View>
      }
    >
      <Text style={typography.title} accessibilityRole="header">
        {title}
      </Text>

      <View style={styles.list}>
        {outcomes.map((outcome) => {
          const status = STATUS[outcome.status];
          return (
            <Card key={outcome.key} style={styles.item}>
              <View
                style={styles.row}
                accessible
                accessibilityLabel={`${outcome.vaccine}, ${outcome.dose}: ${status.label}${outcome.message ? `. ${outcome.message}` : ''}`}
              >
                <Icon name={status.icon} size={24} color={status.color} />
                <View style={styles.flex}>
                  <Text style={styles.name}>{outcome.vaccine}</Text>
                  <Text style={typography.muted}>{outcome.dose}</Text>
                  <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
                  {outcome.message && <Text style={styles.message}>{outcome.message}</Text>}
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      {saved > 0 && (
        <Banner
          tone="warning"
          title="Aguardando confirmação"
          message="Leve a caderneta física à UBS: um profissional de saúde confere as doses presencialmente e elas passam a constar como confirmadas."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  item: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.primaryDark,
  },
  status: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  message: {
    ...typography.muted,
    color: colors.danger,
  },
});
