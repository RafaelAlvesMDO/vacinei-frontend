import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface Props {
  variant: 'loading' | 'empty' | 'error';
  title: string;
  message?: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void; icon?: IconName };
}

const DEFAULT_ICONS: Record<Exclude<Props['variant'], 'loading'>, IconName> = {
  empty: 'document-text-outline',
  error: 'cloud-offline-outline',
};

/**
 * Estado de carregando, vazio ou erro de uma lista, centralizado na tela (RNF03).
 * O erro é anunciado pelo leitor de tela ao aparecer
 */
export function StateMessage({ variant, title, message, icon, action }: Props) {
  const isError = variant === 'error';

  return (
    <View
      style={styles.container}
      accessibilityRole={isError ? 'alert' : undefined}
      accessibilityLiveRegion={variant === 'empty' ? undefined : isError ? 'assertive' : 'polite'}
    >
      {variant === 'loading' ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={[styles.iconBox, isError && styles.iconBoxError]}>
          <Icon name={icon ?? DEFAULT_ICONS[variant]} size={32} color={isError ? colors.danger : colors.primary} />
        </View>
      )}
      <View style={styles.text}>
        <Text style={[typography.subtitle, styles.center]} accessibilityRole="header">
          {title}
        </Text>
        {message && <Text style={[typography.muted, styles.center]}>{message}</Text>}
      </View>
      {action && (
        <Button
          label={action.label}
          icon={action.icon}
          variant="secondary"
          onPress={action.onPress}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxError: {
    backgroundColor: colors.dangerSoft,
  },
  text: {
    gap: spacing.xs,
    maxWidth: 360,
  },
  center: {
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
  },
});
