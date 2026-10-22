import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  findNodeHandle,
  useWindowDimensions,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  icon?: IconName;
  confirmLabel: string;
  // Texto anunciado no botão de confirmar durante o carregamento (ex.: "Saindo...")
  loadingLabel?: string;
  cancelLabel?: string;
  // "danger" para ações destrutivas: botão e ícone em vermelho
  variant?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Abaixo desta largura (ou com fonte muito ampliada) os botões ficam empilhados
const SIDE_BY_SIDE_MIN_WIDTH = 360;
const SIDE_BY_SIDE_MAX_FONT_SCALE = 1.3;

/**
 * Diálogo de confirmação no padrão do DESIGN.md, no lugar do alerta nativo.
 * Fecha ao tocar fora, no "Cancelar" e no voltar do Android (exceto durante o carregamento).
 * O leitor de tela recebe o foco no título ao abrir
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  icon,
  confirmLabel,
  loadingLabel,
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { width, fontScale } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const titleRef = useRef<Text>(null);

  const isDanger = variant === 'danger';
  const sideBySide = width >= SIDE_BY_SIDE_MIN_WIDTH && fontScale <= SIDE_BY_SIDE_MAX_FONT_SCALE;
  const dismiss = () => {
    if (!loading) onCancel();
  };

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }

    let animation: Animated.CompositeAnimation | null = null;
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      animation = Animated.timing(progress, {
        toValue: 1,
        duration: reduceMotion ? 0 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      animation.start();
    });

    // Espera o Modal montar para mover o foco do leitor de tela
    const focusTimer = setTimeout(() => {
      const node = titleRef.current && findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 300);

    return () => {
      active = false;
      animation?.stop();
      clearTimeout(focusTimer);
    };
  }, [visible, progress]);

  const cardStyle = {
    opacity: progress,
    transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Fechar o diálogo"
          disabled={loading}
        />

        <Animated.View style={[styles.card, cardStyle]} accessibilityViewIsModal>
          {icon && (
            <View style={[styles.iconCircle, isDanger && styles.iconCircleDanger]}>
              <Icon name={icon} size={28} color={isDanger ? colors.danger : colors.primary} />
            </View>
          )}

          <Text ref={titleRef} style={[typography.subtitle, styles.center]} accessibilityRole="header">
            {title}
          </Text>
          <Text style={[typography.muted, styles.center, styles.message]}>{message}</Text>

          <View style={[styles.actions, sideBySide && styles.actionsRow]}>
            <Button
              label={cancelLabel}
              variant="secondary"
              onPress={dismiss}
              disabled={loading}
              style={sideBySide && styles.actionRowItem}
            />
            <Button
              label={confirmLabel}
              loadingLabel={loadingLabel}
              danger={isDanger}
              loading={loading}
              onPress={onConfirm}
              style={sideBySide && styles.actionRowItem}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconCircleDanger: {
    backgroundColor: colors.dangerSoft,
  },
  center: {
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  // Empilhados: confirmar em cima (column-reverse), como no web
  actions: {
    alignSelf: 'stretch',
    flexDirection: 'column-reverse',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionRowItem: {
    flex: 1,
  },
});
