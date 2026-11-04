import { useEffect } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Screen, StepHeader } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  subtitle: string;
  // Enquanto reduz a foto, antes do envio
  preparing: boolean;
  onCancel: () => void;
}

/**
 * Etapa 3: leitura em andamento. A API não informa o progresso, então o indicador é indeterminado.
 * O leitor de tela é avisado de que a leitura começou (RNF04)
 */
export function ReadingStep({ subtitle, preparing, onCancel }: Props) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Lendo a caderneta. Isso pode levar até 20 segundos.');
  }, []);

  return (
    <Screen
      header={<StepHeader title="Lendo a caderneta" subtitle={subtitle} onBack={onCancel} backLabel="Cancelar" step={{ current: 3, total: 4 }} />}
      footer={<Button label="Cancelar" icon="close" variant="secondary" onPress={onCancel} />}
    >
      <View style={styles.body} accessibilityLiveRegion="polite">
        <View style={styles.halo}>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Carregando" />
        </View>
        <Text style={[typography.title, styles.center]} accessibilityRole="header">
          {preparing ? 'Preparando a foto' : 'Lendo sua caderneta'}
        </Text>
        <Text style={[typography.muted, styles.center]}>
          Estamos identificando as vacinas, as datas e os lotes. Isso pode levar até 20 segundos.
        </Text>
        <View style={styles.note}>
          <Icon name="shield-checkmark-outline" size={18} color={colors.muted} />
          <Text style={typography.muted}>Mantenha o aplicativo aberto durante a leitura.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  halo: {
    width: 112,
    height: 112,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
