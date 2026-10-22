import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * Splash do app enquanto a sessão salva é conferida (GET /auth/me). Mesmo fundo do splash nativo (`brand`),
 * para a troca não piscar
 */
export function SessionSplash() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={styles.logoBox}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
        </View>
        <Text style={styles.name}>Vacinei!?</Text>
        <Text style={styles.tagline}>Sua caderneta, sempre com você</Text>
      </View>

      <View style={styles.status} accessible accessibilityLiveRegion="polite" accessibilityLabel="Verificando sessão ativa">
        <ActivityIndicator color={colors.white} />
        <Text style={styles.statusText}>Verificando sessão ativa...</Text>
      </View>

      <Text style={styles.footer}>Acesso seguro e dados protegidos conforme a LGPD.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand,
    padding: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoBox: {
    padding: spacing.sm,
    borderRadius: radius.lg + 4,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    color: colors.white,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
  status: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    textAlign: 'center',
  },
});
