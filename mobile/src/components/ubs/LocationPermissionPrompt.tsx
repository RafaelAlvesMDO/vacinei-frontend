import { StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Screen } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  onAllow: () => void;
  onSkip: () => void;
  isRequesting: boolean;
}

/**
 * Explicação antes do pedido de localização do sistema (RNF09, RF008 nota 6): para que ela serve
 * e que não é salva. "Agora não" segue para a lista sem ordenação por distância
 */
export function LocationPermissionPrompt({ onAllow, onSkip, isRequesting }: Props) {
  return (
    <Screen
      edges={['top']}
      contentStyle={styles.content}
      footer={
        <View style={styles.actions}>
          <Button
            label="Permitir"
            icon="navigate-outline"
            onPress={onAllow}
            loading={isRequesting}
            loadingLabel="Aguardando permissão..."
          />
          <Button label="Agora não" variant="link" onPress={onSkip} disabled={isRequesting} />
        </View>
      }
    >
      <Text style={typography.title} accessibilityRole="header">
        Encontrar UBS
      </Text>

      <View style={styles.body}>
        <View style={styles.iconBox}>
          <View style={styles.iconCircle}>
            <Icon name="location-outline" size={32} color={colors.white} />
          </View>
        </View>

        <Text style={[typography.title, styles.center]}>Encontre a UBS mais próxima</Text>
        <Text style={[typography.body, styles.center, styles.description]}>
          Usamos sua localização apenas para ordenar as unidades por distância e ajudar a traçar a melhor rota.
        </Text>

        <View style={styles.privacy} accessible>
          <Icon name="shield-checkmark-outline" color={colors.primary} />
          <Text style={[typography.muted, styles.privacyText]}>Sua localização não será salva nem compartilhada.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  body: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  iconBox: {
    width: 112,
    height: 112,
    borderRadius: radius.lg + 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
  description: {
    color: colors.muted,
  },
  privacy: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  privacyText: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: spacing.sm,
  },
});
