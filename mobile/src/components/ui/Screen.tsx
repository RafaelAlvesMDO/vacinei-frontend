import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface Props {
  children: ReactNode;
  // Cabeçalho fixo acima da rolagem (ex.: StepHeader)
  header?: ReactNode;
  // Nas abas, a barra inferior já cuida da margem de baixo
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Base das telas: área segura, fundo `background`, rolagem e teclado sem cobrir os campos
 */
export function Screen({ children, header, edges = ['top', 'bottom'], contentStyle }: Props) {
  return (
    // Com cabeçalho, a área da barra de status fica branca como ele
    <SafeAreaView style={[styles.safeArea, header !== undefined && styles.safeAreaWithHeader]} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {header}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>{children}</View>
        </ScrollView>
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
  inner: {
    flexGrow: 1,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
});
