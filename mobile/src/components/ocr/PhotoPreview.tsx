import { Image, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Icon, Screen, StepHeader } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import type { CardPhoto } from '@/services/cardPhoto';

interface Props {
  photo: CardPhoto;
  subtitle: string;
  error: string | null;
  onRetake: () => void;
  onUse: () => void;
  onBack: () => void;
}

/**
 * Etapa 2: conferir a foto antes do envio (página inteira, legível e sem cortes)
 */
export function PhotoPreview({ photo, subtitle, error, onRetake, onUse, onBack }: Props) {
  const aspectRatio = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 3 / 4;

  return (
    <Screen
      header={<StepHeader title="Conferir foto" subtitle={subtitle} onBack={onBack} step={{ current: 2, total: 4 }} />}
      footer={
        <View style={styles.actions}>
          <Button label="Refazer" icon="refresh" variant="secondary" onPress={onRetake} style={styles.action} />
          <Button label="Usar esta foto" icon="checkmark" onPress={onUse} style={styles.action} />
        </View>
      }
    >
      {error && <Banner tone="danger" title="Não foi possível preparar a foto" message={error} />}
      <View style={styles.frame}>
        <Image
          source={{ uri: photo.uri }}
          style={[styles.image, { aspectRatio }]}
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel="Foto da caderneta que será lida"
        />
      </View>
      <View style={styles.hint} accessible>
        <Icon name="search" color={colors.muted} />
        <Text style={[typography.muted, styles.flex]}>
          Confira se a página aparece inteira, plana e legível, sem sombra nem reflexo.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  action: {
    flexGrow: 1,
    flexBasis: 140,
  },
  frame: {
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
    padding: spacing.md,
  },
  image: {
    width: '100%',
    maxHeight: 520,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
});
