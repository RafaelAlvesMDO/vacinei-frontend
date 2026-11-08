import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, touchTarget } from '@/theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  selected: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/**
 * Alternância entre visões da mesma tela (ex.: Lista e Mapa): trilho `surface` e a opção ativa em branco
 */
export function SegmentedControl<T extends string>({ options, selected, onChange, accessibilityLabel }: Props<T>) {
  return (
    <View style={styles.container} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  // Borda transparente nas inativas para o texto não pular ao trocar de opção
  segment: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  // A borda `primary` marca a opção ativa sem depender só da cor do texto (WCAG 1.4.1 e 1.4.11)
  segmentSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  text: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  textSelected: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
});
