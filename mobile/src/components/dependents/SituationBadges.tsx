import { StyleSheet, View } from 'react-native';
import { Badge } from '@/components/ui';
import { spacing } from '@/theme';
import type { VaccinationCard } from '@/types/vaccination';
import { getCardSituation, getSituationBadges } from '@/utils/dependents';

/**
 * Resumo da situação de uma caderneta (D32): atrasadas e aguardando conferência, ou "Em dia".
 * Sem a caderneta (falha ao carregar), "Situação indisponível"
 */
export function SituationBadges({ card }: { card: VaccinationCard | null }) {
  const badges = card
    ? getSituationBadges(getCardSituation(card.vaccines))
    : [{ label: 'Situação indisponível', tone: 'neutral' as const, icon: 'cloud-offline-outline' as const }];

  return (
    <View style={styles.row}>
      {badges.map((badge) => (
        <Badge key={badge.label} label={badge.label} tone={badge.tone} icon={badge.icon} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
