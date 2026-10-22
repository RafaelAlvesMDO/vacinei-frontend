import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, touchTarget, typography } from '@/theme';
import { Icon, type IconName } from './Icon';

interface Props {
  title: string;
  description: string;
  icon: IconName;
  selected?: boolean;
  onPress: () => void;
  // 'radio' para escolha dentro de um formulário; 'button' quando o toque já executa a ação
  mode?: 'radio' | 'button';
  extra?: ReactNode;
}

/**
 * Cartão de escolha (perfil no cadastro, ala do profissional)
 */
export function RadioCard({ title, description, icon, selected = false, onPress, mode = 'radio', extra }: Props) {
  return (
    <Pressable
      accessibilityRole={mode}
      accessibilityState={mode === 'radio' ? { checked: selected } : undefined}
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
        <Icon name={icon} size={24} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={typography.muted}>{description}</Text>
        {extra}
      </View>
      {mode === 'radio' ? (
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      ) : (
        <Icon name="chevron-forward" color={colors.muted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 2,
    padding: spacing.lg - 1,
  },
  cardPressed: {
    backgroundColor: colors.surface,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: colors.white,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.primaryDark,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
});
