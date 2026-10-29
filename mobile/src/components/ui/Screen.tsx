import type { ReactNode, Ref } from 'react';
import {
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface Props {
  children: ReactNode;
  // Cabeçalho fixo acima da rolagem (ex.: StepHeader)
  header?: ReactNode;
  // Rodapé fixo abaixo da rolagem (ex.: botões de ação)
  footer?: ReactNode;
  // Nas abas, a barra inferior já cuida da margem de baixo
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  // Puxar para atualizar (só quando onRefresh é informado)
  refreshing?: boolean;
  onRefresh?: () => void;
  // Rolagem (ex.: voltar ao topo ao trocar de página)
  scrollRef?: Ref<ScrollViewInstance>;
}

/**
 * Base das telas: área segura, fundo `background`, rolagem e teclado sem cobrir os campos
 */
export function Screen({
  children,
  header,
  footer,
  edges = ['top', 'bottom'],
  contentStyle,
  refreshing = false,
  onRefresh,
  scrollRef,
}: Props) {
  return (
    // Com cabeçalho, a área da barra de status fica branca como ele
    <SafeAreaView style={[styles.safeArea, header !== undefined && styles.safeAreaWithHeader]} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {header}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          <View style={styles.inner}>{children}</View>
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeAreaWithHeader: {
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  inner: {
    flexGrow: 1,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
});
