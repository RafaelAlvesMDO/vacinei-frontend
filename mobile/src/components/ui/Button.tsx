import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing, touchTarget, typography } from '@/theme';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'link';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  // Ícone depois do texto (ex.: "Próxima ›")
  iconPosition?: 'start' | 'end';
  // Só o ícone na tela; o rótulo continua para o leitor de tela
  iconOnly?: boolean;
  loading?: boolean;
  // Texto anunciado durante o carregamento (ex.: "Entrando...")
  loadingLabel?: string;
  disabled?: boolean;
  danger?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Botão do DESIGN.md: primário (verde cheio), secundário (contorno) ou link (texto verde).
 * Alvo de toque mínimo de 48 px também no link (RNF04)
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'start',
  iconOnly = false,
  loading = false,
  loadingLabel,
  disabled = false,
  danger = false,
  accessibilityHint,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const textColor = variant === 'primary' ? colors.white : danger ? colors.danger : colors.primary;
  const text = loading && loadingLabel ? loadingLabel : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      hitSlop={variant === 'link' ? 4 : undefined}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'primary' && pressed && styles.primaryPressed,
        variant === 'primary' && danger && styles.primaryDanger,
        variant === 'primary' && danger && pressed && styles.primaryDangerPressed,
        variant === 'secondary' && styles.secondary,
        variant === 'secondary' && danger && styles.secondaryDanger,
        variant === 'secondary' && pressed && styles.secondaryPressed,
        variant === 'link' && styles.link,
        variant === 'link' && pressed && styles.linkPressed,
        iconOnly && styles.iconOnly,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={[styles.content, iconPosition === 'end' && styles.contentReversed]}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          icon && <Icon name={icon} size={variant === 'link' ? 18 : 20} color={textColor} />
        )}
        {!iconOnly && (
          <Text style={[variant === 'link' ? styles.linkText : typography.button, { color: textColor }]}>{text}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  contentReversed: {
    flexDirection: 'row-reverse',
  },
  // Quadrado com o alvo de toque mínimo (RNF04)
  iconOnly: {
    minWidth: touchTarget,
    paddingHorizontal: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryDark,
  },
  // Ações destrutivas (ex.: confirmar a saída)
  primaryDanger: {
    backgroundColor: colors.danger,
  },
  primaryDangerPressed: {
    opacity: 0.85,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryDanger: {
    borderColor: colors.danger,
  },
  secondaryPressed: {
    backgroundColor: colors.surface,
  },
  link: {
    paddingHorizontal: spacing.sm,
  },
  linkPressed: {
    backgroundColor: colors.surface,
  },
  linkText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  disabled: {
    opacity: 0.5,
  },
});
