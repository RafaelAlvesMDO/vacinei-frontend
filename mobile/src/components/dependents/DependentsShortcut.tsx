import { router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon } from '@/components/ui';
import { useDependents } from '@/hooks/useDependents';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { describeDependent, getCardSituation, getSituationBadges } from '@/utils/dependents';
import { getInitials } from '@/utils/roles';
import { SituationBadges } from './SituationBadges';

/**
 * Atalho da Início para os dependentes (D33), com a situação de cada caderneta. Só aparece quando há dependentes
 */
export function DependentsShortcut() {
  const { dependents, reload } = useDependents();
  // Voltando para a Início, a situação dos dependentes é atualizada sem indicador
  useReloadOnFocus(useCallback(() => reload({ silent: true }), [reload]));
  if (!dependents || dependents.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={typography.subtitle} accessibilityRole="header">
          Dependentes
        </Text>
        <Button
          label="Ver todos"
          variant="link"
          accessibilityHint="Abre a lista de dependentes"
          onPress={() => router.push('/cidadao/dependentes')}
        />
      </View>
      <Card style={styles.card}>
        {dependents.map(({ dependent, card }, index) => {
          const description = describeDependent(dependent);
          const situation = card
            ? getSituationBadges(getCardSituation(card.vaccines))
                .map((badge) => badge.label)
                .join(', ')
            : 'Situação indisponível';
          return (
            <Pressable
              key={dependent.id}
              accessibilityRole="button"
              accessibilityLabel={`${dependent.name}. ${description}. ${situation}`}
              accessibilityHint="Abre o perfil do dependente"
              onPress={() =>
                router.push({ pathname: '/cidadao/dependentes/[dependentId]', params: { dependentId: dependent.id } })
              }
              style={({ pressed }) => [styles.row, index > 0 && styles.rowBorder, pressed && styles.pressed]}
            >
              <View style={styles.avatar}>
                <Text style={styles.initials}>{getInitials(dependent.name)}</Text>
              </View>
              <View style={styles.text}>
                <Text style={styles.name}>{dependent.name}</Text>
                <Text style={typography.muted}>{description}</Text>
                <SituationBadges card={card} />
              </View>
              <Icon name="chevron-forward" color={colors.muted} />
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  card: {
    padding: spacing.sm,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 56,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.primaryDark,
  },
});
