import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme';

interface Props {
  // Data URI do recorte (PNG em escala de cinza) vindo da API
  uri: string | null;
  // O que o recorte mostra, anunciado pelo leitor de tela (ex.: "Recorte da data de aplicação na foto")
  label: string;
  // Legenda visível acima da imagem
  caption?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Recorte da foto da caderneta para o cidadão conferir o que foi lido (RF004). Sem recorte, um aviso no lugar
 */
export function CropImage({ uri, label, caption, height = 64, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {caption && (
        <Text style={styles.caption} importantForAccessibility="no" accessibilityElementsHidden>
          {caption}
        </Text>
      )}
      {uri ? (
        <View style={[styles.frame, { height }]}>
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
            accessible
            accessibilityRole="image"
            accessibilityLabel={label}
          />
        </View>
      ) : (
        <View style={[styles.frame, styles.empty, { minHeight: Math.min(height, 48) }]} accessible accessibilityLabel={`${label}: indisponível`}>
          <Text style={styles.emptyText}>Recorte indisponível</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    minWidth: 0,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  frame: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
});
