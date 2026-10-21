import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/services/api';
import { parseApiError } from '@/services/auth';
import { checkHealth } from '@/services/health';
import { colors, fonts, radius, spacing, touchTarget, typography } from '@/theme';
import { formatNumber } from '@/utils/format';

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; uptime: number }
  | { kind: 'error'; message: string };

const MISSING_URL_MESSAGE =
  'EXPO_PUBLIC_API_URL não está definida. Crie o mobile/.env a partir do .env.example e reinicie o Expo.';

// 3725 → "1 h 2 min"
function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${formatNumber(hours)} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return `${Math.floor(seconds)} s`;
}

// Tela inicial provisória (etapa 1): confere a conexão com a API pelo celular. Vira o login na etapa 2
export default function Welcome() {
  const [health, setHealth] = useState<HealthState>(() =>
    API_URL ? { kind: 'loading' } : { kind: 'error', message: MISSING_URL_MESSAGE }
  );
  // Cada toque em "Testar de novo" incrementa a tentativa e refaz a chamada
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!API_URL) return;
    const controller = new AbortController();

    checkHealth(controller.signal).then(
      (data) => setHealth({ kind: 'ok', uptime: data.uptime }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setHealth({ kind: 'error', message: parseApiError(error, 'A API respondeu com erro.').message });
      }
    );

    return () => controller.abort();
  }, [attempt]);

  const testConnection = () => {
    if (!API_URL) return;
    setHealth({ kind: 'loading' });
    setAttempt((current) => current + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            accessibilityLabel="Logo do Vacinei!?"
          />
          <Text style={typography.title} accessibilityRole="header">
            Vacinei!?
          </Text>
          <Text style={[typography.muted, styles.center]}>
            Base do app em construção. O login chega na etapa 2.
          </Text>
        </View>

        <View style={styles.card} accessibilityLiveRegion="polite">
          <Text style={typography.subtitle}>Conexão com a API</Text>
          <Text style={typography.muted} selectable>
            {API_URL || 'URL não configurada'}
          </Text>

          {health.kind === 'loading' && (
            <View style={styles.statusRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={typography.body}>Testando a conexão...</Text>
            </View>
          )}
          {health.kind === 'ok' && (
            <View style={[styles.banner, styles.bannerSuccess]}>
              <Text style={[styles.bannerTitle, { color: colors.success }]}>A API respondeu</Text>
              <Text style={typography.muted}>No ar há {formatUptime(health.uptime)}.</Text>
            </View>
          )}
          {health.kind === 'error' && (
            <View style={[styles.banner, styles.bannerDanger]}>
              <Text style={[styles.bannerTitle, { color: colors.danger }]}>A API não respondeu</Text>
              <Text style={[typography.muted, { color: colors.danger }]}>{health.message}</Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: health.kind === 'loading' }}
            disabled={health.kind === 'loading'}
            onPress={testConnection}
            style={({ pressed }) => [
              styles.button,
              styles.buttonPrimary,
              pressed && styles.buttonPrimaryPressed,
              health.kind === 'loading' && styles.buttonDisabled,
            ]}
          >
            <Text style={typography.button}>Testar de novo</Text>
          </Pressable>
        </View>

        <View style={styles.links}>
          <Text style={typography.label}>Telas provisórias</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/inicio')}
            style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && styles.buttonSecondaryPressed]}
          >
            <Text style={styles.buttonSecondaryText}>Ala Cidadão</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/painel')}
            style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && styles.buttonSecondaryPressed]}
          >
            <Text style={styles.buttonSecondaryText}>Ala Profissional</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
  },
  center: {
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  banner: {
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  bannerSuccess: {
    backgroundColor: colors.successSoft,
  },
  bannerDanger: {
    backgroundColor: colors.dangerSoft,
  },
  bannerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  links: {
    gap: spacing.md,
  },
  button: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryPressed: {
    backgroundColor: colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryPressed: {
    backgroundColor: colors.surface,
  },
  buttonSecondaryText: {
    ...typography.button,
    color: colors.primaryDark,
  },
});
