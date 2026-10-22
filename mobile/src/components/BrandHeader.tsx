import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '@/theme';

/**
 * Logo + "Vacinei!?" no topo do login e da escolha de ala
 */
export function BrandHeader() {
  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
      <View style={styles.text}>
        <Text style={styles.name} accessibilityRole="header">
          Vacinei!?
        </Text>
        <Text style={typography.muted}>Área do cidadão e do profissional</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.primaryDark,
  },
});
