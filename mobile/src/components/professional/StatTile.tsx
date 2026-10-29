import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';

export type StatTone = 'primary' | 'danger' | 'warning';

interface Props {
  title: string;
  value: string;
  icon: IconName;
  tone?: StatTone;
  description?: string;
  // Com `onPress`, o cartão vira um botão (ex.: abre a busca ativa)
  onPress?: () => void;
  accessibilityHint?: string;
}

const TONES: Record<StatTone, { background: string; text: string }> = {
  primary: { background: colors.surface, text: colors.primary },
  danger: { background: colors.dangerSoft, text: colors.danger },
  warning: { background: colors.warningSoft, text: colors.warning },
};

/**
 * Indicador do painel (RF009): título, número em destaque, ícone e linha de apoio na cor do indicador
 */
export function StatTile({ title, value, icon, tone = 'primary', description, onPress, accessibilityHint }: Props) {
  const palette = TONES[tone];
  const label = [title, value, description].filter(Boolean).join('. ');

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.icon, { backgroundColor: palette.background }]}>
          <Icon name={icon} color={palette.text} />
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
      {(description || onPress) && (
        <View style={styles.footer}>
          {description && <Text style={[styles.description, { color: palette.text }]}>{description}</Text>}
          {onPress && <Icon name="chevron-forward" size={16} color={palette.text} />}
        </View>
      )}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.card} accessible accessibilityLabel={label}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.muted,
    flex: 1,
    minWidth: 0,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.primaryDark,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  description: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
});
