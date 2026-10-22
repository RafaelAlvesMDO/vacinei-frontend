import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { onlyDigits } from '@/utils/format';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  editable?: boolean;
}

/**
 * Código numérico em caixas (recuperação de senha). Um único TextInput transparente, por cima das caixas,
 * recebe o toque, a digitação e a colagem do código; as caixas só desenham os dígitos
 */
export function CodeInput({ label, value, onChange, length = 6, error, editable = true }: Props) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View style={styles.container}>
      <Text style={typography.label} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
      </Text>

      <View>
        <View style={styles.boxes} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {Array.from({ length }, (_, index) => (
            <View
              key={index}
              style={[
                styles.box,
                focused && index === activeIndex && styles.boxActive,
                !!error && styles.boxError,
              ]}
            >
              <Text style={styles.digit}>{value[index] ?? ''}</Text>
            </View>
          ))}
        </View>
        <TextInput
          accessibilityLabel={`${label}, ${length} dígitos`}
          accessibilityHint={error}
          value={value}
          onChangeText={(text) => onChange(onlyDigits(text).slice(0, length))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={length}
          caretHidden
          style={styles.input}
        />
      </View>

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  boxes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
  },
  boxActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  boxError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  digit: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.primaryDark,
  },
  // Transparente, mas tocável e focável pelo leitor de tela
  input: {
    ...StyleSheet.absoluteFill,
    color: 'transparent',
    opacity: 0.02,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
});
