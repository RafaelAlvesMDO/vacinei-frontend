import { StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Screen, StepHeader } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import type { ScanMessage } from '@/utils/ocr';

interface Props {
  subtitle: string;
  failure: ScanMessage;
  onRetry: () => void;
  onManual: () => void;
  onBack: () => void;
}

/**
 * Leitura sem resultado (erro da API ou `manualFallback`): mensagem clara, outra foto ou cadastro manual (RNF12)
 */
export function ScanFailure({ subtitle, failure, onRetry, onManual, onBack }: Props) {
  return (
    <Screen
      header={<StepHeader title="Digitalizar caderneta" subtitle={subtitle} onBack={onBack} />}
      footer={
        <View style={styles.actions}>
          <Button label="Tentar outra foto" icon="camera-outline" onPress={onRetry} />
          <Button label="Cadastrar manualmente" icon="create-outline" variant="secondary" onPress={onManual} />
        </View>
      }
    >
      <View style={styles.body} accessibilityRole="alert" accessibilityLiveRegion="assertive">
        <View style={styles.iconBox}>
          <Icon name="scan-outline" size={32} color={colors.warning} />
        </View>
        <Text style={[typography.title, styles.center]} accessibilityRole="header">
          {failure.title}
        </Text>
        <Text style={[typography.body, styles.center, styles.message]}>{failure.message}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
  },
  body: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
  message: {
    color: colors.muted,
    maxWidth: 400,
  },
});
