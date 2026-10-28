import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon } from '@/components/ui';
import { useVaccineAlerts } from '@/hooks/useVaccineAlerts';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * Explicação antes do pedido de notificações do sistema (RF007, D31): o que é avisado, quando e que o
 * cálculo fica no aparelho. "Agora não" esconde o cartão; os alertas podem ser ativados depois no Perfil
 */
export function NotificationPrompt() {
  const { enable, dismissPrompt } = useVaccineAlerts();
  const [requesting, setRequesting] = useState(false);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      await enable();
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon name="notifications-outline" color={colors.white} />
        </View>
        <Text style={[typography.subtitle, styles.title]} accessibilityRole="header">
          Ative os alertas de vacina
        </Text>
      </View>
      <Text style={typography.body}>
        Avisamos uma vez por dia, às 8h, quando uma dose estiver atrasada ou aguardando conferência na UBS, e
        lembramos 7 dias antes e no dia da próxima dose.
      </Text>
      <View style={styles.privacy} accessible>
        <Icon name="shield-checkmark-outline" size={18} color={colors.primary} />
        <Text style={[typography.muted, styles.privacyText]}>
          Os avisos são calculados no seu aparelho a partir da caderneta. Você pode desativá-los no Perfil.
        </Text>
      </View>
      <Button
        label="Ativar alertas"
        icon="notifications-outline"
        onPress={() => void handleEnable()}
        loading={requesting}
        loadingLabel="Aguardando permissão..."
      />
      <Button label="Agora não" variant="link" onPress={dismissPrompt} disabled={requesting} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  privacyText: {
    flex: 1,
    minWidth: 0,
  },
});
