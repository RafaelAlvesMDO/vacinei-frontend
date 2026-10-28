import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, touchTarget, typography } from '@/theme';
import { Button } from './Button';
import { Icon } from './Icon';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  // Opção visível, mas não selecionável (ex.: dose já registrada)
  disabled?: boolean;
}

interface Props<T extends string> {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * Seleção em lista (categoria profissional, UF). Abre uma folha na parte de baixo da tela,
 * sem depender de um picker nativo que muda de aparência entre Android e iOS
 */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecione',
  required = false,
  hint,
  error,
  disabled = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.container}>
      <Text style={typography.label} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${required ? ', obrigatório' : ''}: ${selected?.label ?? 'nenhuma opção selecionada'}`}
        accessibilityHint={error ?? hint ?? 'Abre a lista de opções'}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, !!error && styles.fieldError, disabled && styles.fieldDisabled]}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron-down" color={colors.muted} />
      </Pressable>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : (
        hint && <Text style={styles.hint}>{hint}</Text>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar a lista"
          />
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={typography.subtitle} accessibilityRole="header">
                {label}
              </Text>
              <Button label="Fechar" variant="link" onPress={() => setOpen(false)} />
            </View>
            <FlatList
              data={options}
              keyExtractor={(option) => option.value}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected, disabled: item.disabled }}
                    disabled={item.disabled}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      (pressed || isSelected) && styles.optionActive,
                      item.disabled && styles.optionDisabled,
                    ]}
                  >
                    <View style={styles.optionBody}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{item.label}</Text>
                      {item.description && <Text style={typography.muted}>{item.description}</Text>}
                    </View>
                    {isSelected && <Icon name="checkmark" color={colors.primary} />}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  required: {
    color: colors.danger,
  },
  field: {
    minHeight: touchTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  fieldError: {
    borderColor: colors.danger,
    borderWidth: 2,
    paddingHorizontal: spacing.lg - 1,
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  value: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.primaryDark,
  },
  placeholder: {
    color: colors.muted,
  },
  hint: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '75%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.xl,
    paddingRight: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xl,
  },
  option: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  optionActive: {
    backgroundColor: colors.surface,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...typography.body,
  },
  optionLabelSelected: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
});
