import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';

export type AlertTone = 'danger' | 'warning' | 'primary';

interface Props {
  tone: AlertTone;
  icon: IconName;
  title: string;
  // Dose (em cinza) e situação (na cor do aviso): "2ª dose · 18 dias em atraso"
  dose?: string;
  detail: string;
  actionLabel: string;
  accessibilityHint: string;
  onPress: () => void;
}

const TONES: Record<AlertTone, { background: string; text: string }> = {
  danger: { background: colors.dangerSoft, text: colors.danger },
  warning: { background: colors.warningSoft, text: colors.warning },
  primary: { background: colors.surface, text: colors.primary },
};

/**
 * Linha de um aviso de vacina (RF007): atrasada, aguardando conferência ou lembrete (D31). Abre a vacina
 */
export function AlertRow({ tone, icon, title, dose, detail, actionLabel, accessibilityHint, onPress }: Props) {
  const palette = TONES[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, dose, detail].filter(Boolean).join('. ')}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: palette.background }]}>
        <Icon name={icon} color={palette.text} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={typography.muted}>
          {dose ? `${dose} · ` : ''}
          <Text style={[styles.detail, { color: palette.text }]}>{detail}</Text>
        </Text>
      </View>
      <Text style={styles.action}>{actionLabel}</Text>
      <Icon name="chevron-forward" size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 56,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.primaryDark,
  },
  detail: {
    fontFamily: fonts.medium,
  },
  action: {
    flexShrink: 0,
    maxWidth: '35%',
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'right',
  },
});
