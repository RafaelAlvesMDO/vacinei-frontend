import { useState } from 'react';
import {
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  type PanResponderInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, StepHeader } from '@/components/ui';
import type { CardPhoto, CropRect } from '@/services/cardPhoto';
import { colors, fonts, radius, spacing, touchTarget } from '@/theme';

type Edge = 'top' | 'right' | 'bottom' | 'left';

// Fração cortada de cada lado (0 = nada cortado)
type Insets = Record<Edge, number>;

const EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];
const FULL: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
const OPPOSITE: Record<Edge, Edge> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const EDGE_LABELS: Record<Edge, string> = { top: 'superior', right: 'direita', bottom: 'inferior', left: 'esquerda' };
// Sobra pelo menos 25% da foto em cada direção: cortar mais impede o reconhecimento do modelo
const MIN_SPAN = 0.25;
// Passo das ações do leitor de tela
const STEP = 0.05;
// Margem em volta da foto para as alças (alvo de 48 px) ficarem dentro da área de toque
const PAD = touchTarget / 2;
// A partir desta escala de fonte, o aviso começa recolhido para não tirar espaço da foto
const COLLAPSE_FONT_SCALE = 1.3;
const WARNING = 'Mantenha a página inteira no recorte; cortar demais impede o reconhecimento da caderneta.';

function setEdge(insets: Insets, edge: Edge, value: number): Insets {
  const max = Math.max(0, 1 - MIN_SPAN - insets[OPPOSITE[edge]]);
  return { ...insets, [edge]: Math.min(Math.max(value, 0), max) };
}

/**
 * Estado dos gestos do recorte, fora da renderização: as alças arrastadas, o tamanho da foto na tela e os
 * ajustes do leitor de tela. Cada mudança é repassada à tela por `onChange`. O recorte fica em frações da
 * foto, então continua certo quando a foto muda de tamanho na tela
 */
function createCropController(onChange: (insets: Insets) => void) {
  let insets = FULL;
  let start = FULL;
  let size = { width: 0, height: 0 };

  const update = (next: Insets) => {
    insets = next;
    onChange(next);
  };

  const create = (edge: Edge) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        start = insets;
      },
      onPanResponderMove: (_event, gesture) => {
        if (size.width === 0 || size.height === 0) return;
        const value =
          edge === 'top'
            ? start.top + gesture.dy / size.height
            : edge === 'bottom'
              ? start.bottom - gesture.dy / size.height
              : edge === 'left'
                ? start.left + gesture.dx / size.width
                : start.right - gesture.dx / size.width;
        update(setEdge(insets, edge, value));
      },
    });

  const responders: Record<Edge, PanResponderInstance> = {
    top: create('top'),
    right: create('right'),
    bottom: create('bottom'),
    left: create('left'),
  };

  return {
    responders,
    setSize: (width: number, height: number) => {
      size = { width, height };
    },
    adjust: (edge: Edge, delta: number) => update(setEdge(insets, edge, insets[edge] + delta)),
    getInsets: () => insets,
  };
}

/**
 * Tamanho da foto na tela: inteira na área disponível, com a proporção mantida ("contain"). Usa a largura e
 * a altura da foto atual, então vale para foto vertical, horizontal e girada
 */
function fitPhoto(photo: CardPhoto, area: { width: number; height: number }) {
  const availableWidth = area.width - PAD * 2;
  const availableHeight = area.height - PAD * 2;
  if (availableWidth <= 0 || availableHeight <= 0) return null;
  const photoWidth = photo.width > 0 ? photo.width : 3;
  const photoHeight = photo.height > 0 ? photo.height : 4;
  const scale = Math.min(availableWidth / photoWidth, availableHeight / photoHeight);
  return { width: photoWidth * scale, height: photoHeight * scale };
}

interface Props {
  photo: CardPhoto;
  subtitle: string;
  applying: boolean;
  onCancel: () => void;
  // null: nada foi cortado
  onApply: (rect: CropRect | null) => void;
}

/**
 * Recorte livre da foto (sem proporção fixa), na etapa "Conferir foto": quatro alças, uma em cada borda,
 * arrastadas com o dedo ou ajustadas pelo leitor de tela (5% por vez). Tela própria, que funciona no Expo Go
 * e no APK: o recorte nativo do seletor de fotos só existe na hora de tirar ou escolher a foto.
 * Sem rolagem: a foto ocupa o espaço entre o cabeçalho e a barra fixa do rodapé (aviso e botões)
 */
export function CropStep({ photo, subtitle, applying, onCancel, onApply }: Props) {
  const { fontScale } = useWindowDimensions();
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [insets, setInsets] = useState<Insets>(FULL);
  const [controller] = useState(() => createCropController(setInsets));
  // Com a fonte ampliada, o aviso começa recolhido (um toque mostra o texto)
  const [warningOpen, setWarningOpen] = useState(fontScale < COLLAPSE_FONT_SCALE);

  const onAccessibilityAction = (edge: Edge) => (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') controller.adjust(edge, STEP);
    if (event.nativeEvent.actionName === 'decrement') controller.adjust(edge, -STEP);
  };

  const onAreaLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setArea({ width, height });
  };

  const onImageLayout = (event: LayoutChangeEvent) => {
    controller.setSize(event.nativeEvent.layout.width, event.nativeEvent.layout.height);
  };

  const apply = () => {
    const { top, right, bottom, left } = controller.getInsets();
    if (top + right + bottom + left < 0.005) {
      onApply(null);
      return;
    }
    const originX = Math.round(left * photo.width);
    const originY = Math.round(top * photo.height);
    onApply({
      originX,
      originY,
      width: Math.min(photo.width - originX, Math.round((1 - left - right) * photo.width)),
      height: Math.min(photo.height - originY, Math.round((1 - top - bottom) * photo.height)),
    });
  };

  const fitted = fitPhoto(photo, area);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StepHeader title="Recortar foto" subtitle={subtitle} onBack={onCancel} step={{ current: 2, total: 4 }} />

      <View style={styles.area} onLayout={onAreaLayout}>
        {fitted && (
          <CropCanvas
            photo={photo}
            width={fitted.width}
            height={fitted.height}
            insets={insets}
            controller={controller}
            onImageLayout={onImageLayout}
            onAccessibilityAction={onAccessibilityAction}
          />
        )}
      </View>

      <View style={styles.footer}>
        {warningOpen ? (
          <View style={styles.warning} accessible accessibilityRole="text">
            <Icon name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.warningText} maxFontSizeMultiplier={1.6}>
              {WARNING}
            </Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.warning, styles.warningCollapsed, pressed && styles.warningPressed]}
            onPress={() => setWarningOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Aviso sobre o recorte. ${WARNING}`}
            accessibilityHint="Mostra o aviso na tela"
          >
            <Icon name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.warningText} numberOfLines={1} maxFontSizeMultiplier={1.6}>
              Ver aviso sobre o recorte
            </Text>
          </Pressable>
        )}
        <View style={styles.actions}>
          <Button label="Cancelar" variant="secondary" onPress={onCancel} disabled={applying} style={styles.action} />
          <Button
            label="Aplicar recorte"
            icon="crop-outline"
            onPress={apply}
            loading={applying}
            loadingLabel="Recortando..."
            style={styles.action}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

interface CanvasProps {
  photo: CardPhoto;
  width: number;
  height: number;
  insets: Insets;
  controller: ReturnType<typeof createCropController>;
  onImageLayout: (event: LayoutChangeEvent) => void;
  onAccessibilityAction: (edge: Edge) => (event: AccessibilityActionEvent) => void;
}

// Foto com a área fora do recorte escurecida, a moldura e as quatro alças
function CropCanvas({ photo, width, height, insets, controller, onImageLayout, onAccessibilityAction }: CanvasProps) {
  const centerX = (insets.left + (1 - insets.left - insets.right) / 2) * width;
  const centerY = (insets.top + (1 - insets.top - insets.bottom) / 2) * height;
  const handlePosition: Record<Edge, { x: number; y: number }> = {
    top: { x: centerX, y: insets.top * height },
    bottom: { x: centerX, y: (1 - insets.bottom) * height },
    left: { x: insets.left * width, y: centerY },
    right: { x: (1 - insets.right) * width, y: centerY },
  };

  return (
    <View style={{ width: width + PAD * 2, height: height + PAD * 2 }}>
      <View style={[styles.image, { left: PAD, top: PAD, width, height }]} onLayout={onImageLayout}>
        <Image
          source={{ uri: photo.uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel="Foto da caderneta com a área do recorte"
        />
        <View style={[styles.shade, { left: 0, right: 0, top: 0, height: insets.top * height }]} />
        <View style={[styles.shade, { left: 0, right: 0, bottom: 0, height: insets.bottom * height }]} />
        <View
          style={[
            styles.shade,
            { left: 0, top: insets.top * height, bottom: insets.bottom * height, width: insets.left * width },
          ]}
        />
        <View
          style={[
            styles.shade,
            { right: 0, top: insets.top * height, bottom: insets.bottom * height, width: insets.right * width },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.frame,
            {
              top: insets.top * height,
              left: insets.left * width,
              right: insets.right * width,
              bottom: insets.bottom * height,
            },
          ]}
        />
      </View>

      {EDGES.map((edge) => (
        <View
          key={edge}
          {...controller.responders[edge].panHandlers}
          // A foto começa em PAD e a alça tem 2 × PAD: o canto da alça fica no próprio ponto da borda
          style={[styles.handle, { left: handlePosition[edge].x, top: handlePosition[edge].y }]}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Borda ${EDGE_LABELS[edge]} do recorte`}
          accessibilityHint="Arraste, ou deslize para cima e para baixo, para cortar mais ou menos deste lado"
          accessibilityValue={{ text: `${Math.round(insets[edge] * 100)}% cortado` }}
          accessibilityActions={[
            { name: 'increment', label: 'Cortar mais' },
            { name: 'decrement', label: 'Cortar menos' },
          ]}
          onAccessibilityAction={onAccessibilityAction(edge)}
        >
          <View style={styles.handleDot} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Branca como o cabeçalho e o rodapé, que ocupam as bordas da área segura
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // Espaço entre o cabeçalho e o rodapé, medido para a foto caber inteira
  area: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
    overflow: 'hidden',
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  warningCollapsed: {
    minHeight: touchTarget,
  },
  warningPressed: {
    opacity: 0.8,
  },
  warningText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.warning,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  action: {
    flexGrow: 1,
    flexBasis: 140,
  },
  image: {
    position: 'absolute',
    overflow: 'hidden',
  },
  shade: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  frame: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.white,
  },
  handle: {
    position: 'absolute',
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleDot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.primary,
  },
});
