import { Image, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Icon, Screen, StepHeader } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import type { CardPhoto } from '@/services/cardPhoto';

// Ajuste em andamento (o botão dele mostra o carregamento e os demais ficam bloqueados)
export type PhotoTool = 'rotate-left' | 'rotate-right' | 'undo';

interface Props {
  photo: CardPhoto;
  subtitle: string;
  error: string | null;
  editError: string | null;
  // A foto tem ajustes (girada ou recortada)
  edited: boolean;
  editing: PhotoTool | null;
  onRotate: (direction: 'left' | 'right') => void;
  onCrop: () => void;
  onUndo: () => void;
  onRetake: () => void;
  onUse: () => void;
  onBack: () => void;
}

/**
 * Etapa 2: conferir a foto antes do envio (página inteira, legível e sem cortes), com giro de 90°, recorte
 * livre e "Desfazer ajustes". Os ajustes valem para a prévia e para a imagem enviada
 */
export function PhotoPreview({
  photo,
  subtitle,
  error,
  editError,
  edited,
  editing,
  onRotate,
  onCrop,
  onUndo,
  onRetake,
  onUse,
  onBack,
}: Props) {
  const aspectRatio = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 3 / 4;
  const busy = editing !== null;

  return (
    <Screen
      header={<StepHeader title="Conferir foto" subtitle={subtitle} onBack={onBack} step={{ current: 2, total: 4 }} />}
      footer={
        <View style={styles.actions}>
          <Button label="Refazer" icon="refresh" variant="secondary" onPress={onRetake} disabled={busy} style={styles.action} />
          <Button label="Usar esta foto" icon="checkmark" onPress={onUse} disabled={busy} style={styles.action} />
        </View>
      }
    >
      {error && <Banner tone="danger" title="Não foi possível preparar a foto" message={error} />}
      {editError && <Banner tone="danger" title="Não foi possível ajustar a foto" message={editError} />}
      <View style={styles.frame}>
        <Image
          source={{ uri: photo.uri }}
          style={[styles.image, { aspectRatio }]}
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel={edited ? 'Foto ajustada da caderneta que será lida' : 'Foto da caderneta que será lida'}
        />
      </View>

      <View style={styles.tools}>
        <Button
          label="Girar à esquerda"
          icon="rotate-left"
          iconOnly
          variant="secondary"
          onPress={() => onRotate('left')}
          loading={editing === 'rotate-left'}
          loadingLabel="Girando a foto..."
          disabled={busy}
          accessibilityHint="Gira a foto 90 graus no sentido anti-horário"
        />
        <Button
          label="Girar à direita"
          icon="rotate-right"
          iconOnly
          variant="secondary"
          onPress={() => onRotate('right')}
          loading={editing === 'rotate-right'}
          loadingLabel="Girando a foto..."
          disabled={busy}
          accessibilityHint="Gira a foto 90 graus no sentido horário"
        />
        <Button
          label="Recortar"
          icon="crop-outline"
          variant="secondary"
          onPress={onCrop}
          disabled={busy}
          accessibilityHint="Abre o recorte livre da foto"
          style={styles.crop}
        />
      </View>
      {edited && (
        <Button
          label="Desfazer ajustes"
          icon="arrow-undo-outline"
          variant="link"
          onPress={onUndo}
          loading={editing === 'undo'}
          loadingLabel="Desfazendo..."
          disabled={busy}
          accessibilityHint="Volta à foto original"
          style={styles.undo}
        />
      )}

      <View style={styles.hint} accessible>
        <Icon name="search" color={colors.muted} />
        <Text style={[typography.muted, styles.flex]}>
          Confira se a página aparece inteira, plana e legível, sem sombra nem reflexo. Se precisar, gire ou recorte
          a foto.
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
  tools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  crop: {
    flexGrow: 1,
    flexBasis: 120,
  },
  undo: {
    alignSelf: 'flex-start',
    marginLeft: -spacing.sm,
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
