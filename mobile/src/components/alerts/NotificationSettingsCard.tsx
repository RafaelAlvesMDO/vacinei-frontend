import { useState } from 'react';
import { Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { Banner, Button, Card } from '@/components/ui';
import { useVaccineAlerts } from '@/hooks/useVaccineAlerts';
import { colors, spacing, typography } from '@/theme';
import type { AlertPreferences } from '@/utils/vaccineAlerts';

const OPTIONS: { key: keyof AlertPreferences; label: string; description: string }[] = [
  {
    key: 'alerts',
    label: 'Alertas de vacina',
    description: 'Doses atrasadas e doses informadas aguardando conferência na UBS, uma vez por dia.',
  },
  {
    key: 'reminders',
    label: 'Lembretes da próxima dose',
    description: '7 dias antes e no dia da data prevista, para não atrasar.',
  },
];

/**
 * Preferências de notificação no Perfil (RF007, D31). Ligar uma opção sem permissão abre o pedido do
 * sistema; se o sistema não deixar pedir de novo, o cartão leva às configurações do aparelho
 */
export function NotificationSettingsCard() {
  const { preferences, permission, setPreference } = useVaccineAlerts();
  const [pending, setPending] = useState<keyof AlertPreferences | null>(null);

  const granted = permission?.state === 'granted';
  const blocked = permission?.state === 'denied' && !permission.canAskAgain;
  const anyOn = preferences.alerts || preferences.reminders;

  const toggle = async (key: keyof AlertPreferences, value: boolean) => {
    setPending(key);
    try {
      await setPreference(key, value);
    } finally {
      setPending(null);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={typography.subtitle} accessibilityRole="header">
        Notificações
      </Text>
      <Text style={typography.muted}>
        Uma notificação consolidada por dia, às 8h, calculada no seu aparelho a partir da caderneta.
      </Text>

      {OPTIONS.map((option) => {
        // Sem permissão, a opção aparece desligada até o sistema autorizar
        const isOn = preferences[option.key] && granted;
        return (
          <View key={option.key} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={typography.label}>{option.label}</Text>
              <Text style={typography.muted}>{option.description}</Text>
            </View>
            <Switch
              value={isOn}
              onValueChange={(value) => void toggle(option.key, value)}
              disabled={pending !== null || blocked}
              accessibilityLabel={option.label}
              accessibilityHint={option.description}
              trackColor={{ false: colors.input, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.input}
            />
          </View>
        );
      })}

      {!granted && anyOn && permission && (
        <>
          <Banner
            tone="warning"
            icon="notifications-off-outline"
            title="Notificações bloqueadas no aparelho"
            message={
              blocked
                ? 'Para receber os avisos, permita as notificações do Vacinei!? nas configurações do celular.'
                : 'Toque em uma das opções acima para permitir as notificações do Vacinei!?.'
            }
          />
          {blocked && (
            <Button
              label="Abrir configurações"
              variant="secondary"
              icon="settings-outline"
              onPress={() => void Linking.openSettings()}
            />
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
