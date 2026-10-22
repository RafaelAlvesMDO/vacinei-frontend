import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { Icon, type IconName } from './Icon';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

interface Props {
  tone?: BannerTone;
  title?: string;
  message?: string;
  icon?: IconName;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<BannerTone, { background: string; text: string; icon: IconName }> = {
  info: { background: colors.surface, text: colors.primaryDark, icon: 'information-circle-outline' },
  success: { background: colors.successSoft, text: colors.success, icon: 'checkmark-circle-outline' },
  warning: { background: colors.warningSoft, text: colors.warning, icon: 'alert-circle-outline' },
  danger: { background: colors.dangerSoft, text: colors.danger, icon: 'alert-circle-outline' },
};

/**
 * Caixa de aviso (DESIGN.md): verde-clara para informação e sucesso, âmbar para aviso e vermelha para erro.
 * Avisos e erros são anunciados ao aparecer (RNF03)
 */
export function Banner({ tone = 'info', title, message, icon, children, style }: Props) {
  const palette = TONES[tone];
  const announce = tone === 'danger' || tone === 'warning';

  return (
    <View
      style={[styles.container, { backgroundColor: palette.background }, style]}
      accessible
      accessibilityRole={announce ? 'alert' : 'text'}
      accessibilityLiveRegion={announce ? 'assertive' : 'polite'}
    >
      <Icon name={icon ?? palette.icon} color={palette.text} />
      <View style={styles.body}>
        {title && <Text style={[styles.title, { color: tone === 'info' ? colors.primaryDark : palette.text }]}>{title}</Text>}
        {message && <Text style={[typography.muted, { color: tone === 'info' ? colors.muted : palette.text }]}>{message}</Text>}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
});
