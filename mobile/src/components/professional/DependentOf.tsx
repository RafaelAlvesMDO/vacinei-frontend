import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui';
import { colors, typography } from '@/theme';
import type { CitizenResponsible } from '@/types/citizen';

interface Props {
  responsible: CitizenResponsible | null;
  // O próprio profissional é o responsável (RS006)
  isOwn?: boolean;
}

/**
 * "Dependente de <nome>" (D33), como no web. Não aparece para titulares
 */
export function DependentOf({ responsible, isOwn = false }: Props) {
  if (!responsible) return null;
  const text = `Dependente de ${responsible.name}${isOwn ? ' (você)' : ''}`;

  return (
    <View style={styles.row}>
      <Icon name="people-outline" size={16} color={colors.muted} />
      <Text style={[typography.muted, styles.text]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    flexShrink: 1,
  },
});
