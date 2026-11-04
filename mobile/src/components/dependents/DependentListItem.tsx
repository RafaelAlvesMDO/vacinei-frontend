import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui';
import type { DependentOverview } from '@/contexts/DependentsContext';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { describeDependent, formatVaccineCount, getCardSituation, getSituationBadges } from '@/utils/dependents';
import { getInitials } from '@/utils/roles';
import { SituationBadges } from './SituationBadges';

/**
 * Cartão de um dependente: iniciais, nome, idade e parentesco, resumo da situação (D32) e "Ver perfil"
 */
export function DependentListItem({ overview }: { overview: DependentOverview }) {
  const { dependent, card } = overview;
  const description = describeDependent(dependent);
  const situation = card
    ? getSituationBadges(getCardSituation(card.vaccines))
        .map((badge) => badge.label)
        .join(', ')
    : 'Situação indisponível';
  const count = card ? formatVaccineCount(card.vaccines.length) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[dependent.name, description, situation, count].filter(Boolean).join('. ')}
      accessibilityHint="Abre o perfil do dependente"
      onPress={() =>
        router.push({ pathname: '/cidadao/dependentes/[dependentId]', params: { dependentId: dependent.id } })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{getInitials(dependent.name)}</Text>
        </View>
        <View style={styles.title}>
          <Text style={styles.name}>{dependent.name}</Text>
          <Text style={typography.muted}>{description}</Text>
        </View>
      </View>
      <SituationBadges card={card} />
      <View style={styles.footer}>
        <Text style={[typography.muted, styles.count]}>{count ?? 'Caderneta indisponível agora'}</Text>
        <View style={styles.link}>
          <Text style={styles.linkText}>Ver perfil</Text>
          <Icon name="chevron-forward" size={16} />
        </View>
      </View>
    </Pressable>
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
  pressed: {
    backgroundColor: colors.surface,
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
    gap: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.primaryDark,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  count: {
    flexShrink: 1,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
});
