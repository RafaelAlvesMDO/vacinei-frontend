import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';

interface Props {
  title: string;
  description: string;
}

// Provisório (etapa 1): substituído pelas telas reais e pelos componentes de UI na etapa 2
export function ProvisionalScreen({ title, description }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={typography.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={typography.muted}>{description}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Voltar</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  button: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.surface,
  },
  buttonText: {
    ...typography.button,
    color: colors.primaryDark,
  },
});
