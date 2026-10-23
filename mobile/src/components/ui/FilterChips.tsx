import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, touchTarget } from '@/theme';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  options: FilterOption<T>[];
  selected: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/**
 * Filtros em pílulas (ex.: Todas, Em dia, Atrasadas). A selecionada fica em `primary` cheio.
 * Quebram linha em telas estreitas, sem rolagem horizontal
 */
export function FilterChips<T extends string>({ options, selected, onChange, accessibilityLabel }: Props<T>) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        const text = option.count === undefined ? option.label : `${option.label} (${option.count})`;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={text}
            onPress={() => onChange(option.value)}
            hitSlop={{ top: 4, bottom: 4 }}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && !isSelected && styles.chipPressed,
            ]}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]}>{text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // maxWidth: com a fonte ampliada, um rótulo maior que a linha quebra dentro da pílula
  chip: {
    maxWidth: '100%',
    minHeight: touchTarget - 8,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: {
    backgroundColor: colors.surface,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDark,
  },
  textSelected: {
    color: colors.white,
  },
});
