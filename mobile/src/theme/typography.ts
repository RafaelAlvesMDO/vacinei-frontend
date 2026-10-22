import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import type { TextStyle } from 'react-native';
import { colors } from './colors';

// Pesos usados pelo DESIGN.md, carregados no layout raiz com useFonts
export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
};

// No React Native cada peso é uma família própria (fontWeight não troca o arquivo da fonte)
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, color: colors.primaryDark },
  subtitle: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 26, color: colors.primaryDark },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.primaryDark },
  muted: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.primaryDark },
  button: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24, color: colors.white },
} satisfies Record<string, TextStyle>;
