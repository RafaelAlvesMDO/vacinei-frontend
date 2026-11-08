import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Banner, Button, Card, type BannerTone } from '@/components/ui';
import type { VaccineAlertsContextValue } from '@/contexts/VaccineAlertsContext';
import { sendTestVaccineAlert, showNotificationTest, type TestNotificationResult } from '@/services/vaccineNotifications';
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

interface Props {
  alerts: VaccineAlertsContextValue;
}

/**
 * Preferências de notificação no Perfil (RF007, D31, D36): alertas e lembretes desligados separadamente.
 * Ligar uma opção sem permissão abre o pedido do sistema; se o sistema não deixar pedir de novo, o cartão
 * leva às configurações do aparelho. No Expo Go, as notificações do sistema ficam desligadas
 */
export function NotificationSettingsCard({ alerts }: Props) {
  const { preferences, permission, setPreference } = alerts;
  const [pending, setPending] = useState<keyof AlertPreferences | null>(null);

  const unavailable = permission?.state === 'unavailable';
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
        Uma notificação por pessoa por dia, às 8h, para você e os seus dependentes, calculada no seu aparelho a
        partir da caderneta.
      </Text>

      {OPTIONS.map((option) => {
        // Sem permissão, a opção aparece desligada até o sistema autorizar
        const isOn = preferences[option.key] && granted;
        const disabled = pending !== null || blocked || unavailable || !permission;
        return (
          <View key={option.key} style={styles.row}>
            {/* O texto também alterna o interruptor (alvo maior). Para o leitor de tela, o interruptor já tem o
                mesmo rótulo e a descrição como dica, então o texto não vira um segundo botão */}
            <Pressable
              accessible={false}
              onPress={() => void toggle(option.key, !isOn)}
              disabled={disabled}
              style={styles.rowText}
            >
              <Text style={typography.label}>{option.label}</Text>
              <Text style={typography.muted}>{option.description}</Text>
            </Pressable>
            <Switch
              value={isOn}
              onValueChange={(value) => void toggle(option.key, value)}
              disabled={disabled}
              accessibilityLabel={option.label}
              accessibilityHint={option.description}
              trackColor={{ false: colors.input, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.input}
            />
          </View>
        );
      })}

      {unavailable && (
        <Banner
          tone="info"
          icon="phone-portrait-outline"
          title="Disponível no app instalado"
          message="As notificações no celular funcionam no app instalado (APK). Aqui no Expo Go, os avisos ficam na Central de notificações."
        />
      )}

      {!granted && !unavailable && anyOn && permission && (
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

      {showNotificationTest && !unavailable && <TestNotificationButton alerts={alerts} granted={granted} />}
    </Card>
  );
}

const TEST_FEEDBACK: Record<TestNotificationResult, { tone: BannerTone; message: string }> = {
  sent: { tone: 'success', message: 'A notificação de hoje chega em 5 segundos. Saia do app para vê-la na barra.' },
  empty: {
    tone: 'info',
    message: 'Hoje não há avisos na sua caderneta nem na dos dependentes, então nenhuma notificação seria enviada.',
  },
  denied: { tone: 'warning', message: 'Permita as notificações para enviar o teste.' },
  error: { tone: 'danger', message: 'Não foi possível agendar a notificação de teste.' },
};

/**
 * Desenvolvimento e APK `preview` (D36): dispara em 5 s a notificação de hoje da primeira pessoa com avisos,
 * com a caderneta real, para conferir o texto e o toque sem mudar o relógio
 */
function TestNotificationButton({ alerts, granted }: Props & { granted: boolean }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<TestNotificationResult | null>(null);

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      setResult(await sendTestVaccineAlert(alerts.people));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.test}>
      <Button
        label="Enviar notificação de teste"
        variant="secondary"
        icon="paper-plane-outline"
        onPress={() => void send()}
        loading={sending}
        loadingLabel="Agendando..."
        disabled={alerts.people.length === 0 || !granted}
      />
      {result && <Banner tone={TEST_FEEDBACK[result].tone} message={TEST_FEEDBACK[result].message} />}
    </View>
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
    paddingVertical: spacing.xs,
  },
  test: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
});
