import { useState, type ReactNode, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { colors, fonts, radius, spacing, touchTarget, typography } from '@/theme';
import { Icon, type IconName } from './Icon';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  // Ícone decorativo à direita ou um elemento interativo (ex.: mostrar senha)
  icon?: IconName;
  trailing?: ReactNode;
  ref?: Ref<TextInputInstance>;
}

/**
 * Campo com rótulo, dica e erro (DESIGN.md: branco, contorno `input`, raio 12, ~48 px).
 * O leitor de tela anuncia o rótulo, o "obrigatório" e o erro (ou a dica)
 */
export function TextField({
  label,
  required = false,
  hint,
  error,
  icon,
  trailing,
  ref,
  editable = true,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={typography.label} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <View
        style={[
          styles.inputBox,
          focused && styles.inputBoxFocused,
          !!error && styles.inputBoxError,
          !editable && styles.inputBoxDisabled,
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={required ? `${label}, obrigatório` : label}
          accessibilityHint={error ?? hint}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          placeholderTextColor={colors.muted}
          style={styles.input}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {trailing ?? (icon && <Icon name={icon} color={colors.muted} />)}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : (
        hint && <Text style={styles.hint}>{hint}</Text>
      )}
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
  inputBox: {
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
  inputBoxFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    paddingHorizontal: spacing.lg - 1,
  },
  inputBoxError: {
    borderColor: colors.danger,
    borderWidth: 2,
    paddingHorizontal: spacing.lg - 1,
  },
  inputBoxDisabled: {
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.primaryDark,
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
});
