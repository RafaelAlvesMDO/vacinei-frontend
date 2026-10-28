import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui';
import { spacing, typography } from '@/theme';
import { splitDiseases } from '@/utils/vaccination';

/**
 * Doenças que a vacina previne, uma por chip, com o rótulo em cima: o texto longo não cabe alinhado à direita
 */
export function DiseaseChips({ targetDisease }: { targetDisease: string }) {
  const diseases = splitDiseases(targetDisease);

  return (
    <View style={styles.container} accessible accessibilityLabel={`Doenças prevenidas: ${diseases.join(', ')}`}>
      <Text style={typography.muted}>Doenças prevenidas</Text>
      <View style={styles.chips}>
        {diseases.map((disease) => (
          <Badge key={disease} label={disease} tone="primary" />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
