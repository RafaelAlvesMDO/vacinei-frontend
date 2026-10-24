import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * Aviso de mapa fora do ar (RNF15). A lista continua abaixo dele
 */
export function MapUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={styles.text} accessible accessibilityRole="alert" accessibilityLiveRegion="assertive">
        <View style={styles.iconBox}>
          <Icon name="close-circle-outline" size={28} color={colors.warning} />
        </View>
        <Text style={[typography.subtitle, styles.center]}>Mapa indisponível agora</Text>
        <Text style={[typography.muted, styles.center]}>
          Não foi possível carregar o serviço de mapas. Você ainda pode consultar as unidades abaixo.
        </Text>
      </View>
      <Button label="Tentar novamente" icon="refresh" variant="secondary" onPress={onRetry} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  text: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
