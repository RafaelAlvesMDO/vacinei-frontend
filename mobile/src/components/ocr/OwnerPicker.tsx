import { StyleSheet, Text, View } from 'react-native';
import { RadioCard, Screen, StepHeader } from '@/components/ui';
import { spacing, typography } from '@/theme';
import type { Dependent } from '@/types/dependent';
import { describeDependent } from '@/utils/dependents';

interface Props {
  userName: string | undefined;
  dependents: Dependent[];
  onChooseSelf: () => void;
  onChooseDependent: (dependent: Dependent) => void;
  onBack: () => void;
}

/**
 * Etapa 1, antes das orientações: de quem é a caderneta que será fotografada (D33). As doses lidas são salvas na
 * caderneta escolhida. Só aparece para quem tem dependentes
 */
export function OwnerPicker({ userName, dependents, onChooseSelf, onChooseDependent, onBack }: Props) {
  return (
    <Screen header={<StepHeader title="Digitalizar caderneta" onBack={onBack} step={{ current: 1, total: 4 }} />}>
      <View style={styles.heading}>
        <Text style={typography.title} accessibilityRole="header">
          De quem é esta caderneta?
        </Text>
        <Text style={typography.muted}>As doses lidas da foto serão salvas na caderneta escolhida.</Text>
      </View>

      <View style={styles.list} accessibilityRole="list">
        <RadioCard
          mode="button"
          icon="person-outline"
          title="Você"
          description={userName ? `Sua caderneta · ${userName}` : 'Sua caderneta'}
          onPress={onChooseSelf}
        />
        {dependents.map((dependent) => (
          <RadioCard
            key={dependent.id}
            mode="button"
            icon="people-outline"
            title={dependent.name}
            description={`Dependente · ${describeDependent(dependent)}`}
            onPress={() => onChooseDependent(dependent)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
});
