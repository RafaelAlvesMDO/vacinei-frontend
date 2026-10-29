import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Anterior/próxima com "Página X de Y" (D22). A página atual é anunciada ao mudar
 */
export function Pagination({ page, totalPages, onChange, disabled = false }: Props) {
  if (totalPages <= 1) return null;

  return (
    <View style={styles.container}>
      <Button
        label="Anterior"
        icon="chevron-back"
        variant="secondary"
        disabled={disabled || page <= 1}
        onPress={() => onChange(page - 1)}
        style={styles.button}
      />
      <Text style={styles.label} accessibilityLiveRegion="polite">
        Página {page} de {totalPages}
      </Text>
      <Button
        label="Próxima"
        icon="chevron-forward"
        variant="secondary"
        disabled={disabled || page >= totalPages}
        onPress={() => onChange(page + 1)}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Com a fonte ampliada, o texto desce para a linha de baixo
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  button: {
    paddingHorizontal: spacing.md,
  },
  label: {
    ...typography.muted,
    flexShrink: 1,
    color: colors.primaryDark,
    textAlign: 'center',
  },
});
