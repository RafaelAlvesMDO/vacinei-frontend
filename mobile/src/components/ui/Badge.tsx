import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme';
import { Icon, type IconName } from './Icon';

export type BadgeTone = 'primary' | 'neutral' | 'warning' | 'danger';

interface Props {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
}

const TONES: Record<BadgeTone, { background: string; text: string }> = {
  primary: { background: colors.surface, text: colors.primary },
  neutral: { background: colors.background, text: colors.muted },
  warning: { background: colors.warningSoft, text: colors.warning },
  danger: { background: colors.dangerSoft, text: colors.danger },
};

export function Badge({ label, tone = 'primary', icon }: Props) {
  const palette = TONES[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      {icon && <Icon name={icon} size={14} color={palette.text} />}
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    // Com a fonte ampliada em 320px, o texto quebra dentro do badge em vez de vazar do cartão
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
});
