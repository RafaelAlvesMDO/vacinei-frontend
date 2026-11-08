import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';

type TabsScreenOptions = NonNullable<ComponentProps<typeof Tabs.Screen>['options']>;
type TabOptions = Exclude<TabsScreenOptions, (...args: never[]) => unknown>;

// Rótulo das abas: cresce com a fonte do sistema até este limite (com 4 ou 5 abas, maior que isso não cabe
// na largura de cada aba). O leitor de tela lê o nome da aba inteiro, e o rótulo encolhe para não ser truncado
const LABEL_MAX_FONT_SCALE = 1.3;
const LABEL_FONT_SIZE = 12;
const LABEL_LINE_HEIGHT = 16;
// Ícone (24) e os espaços acima, entre o ícone e o rótulo e abaixo dele
const BAR_CONTENT_HEIGHT = 40;

/**
 * Barra de abas das duas alas: ativa em `primary`, inativa em `muted`, fundo branco.
 * A altura acompanha a escala da fonte (a padrão é fixa e cortava o rótulo com a fonte ampliada)
 */
export function useTabScreenOptions(): TabOptions {
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const labelScale = Math.min(Math.max(fontScale, 1), LABEL_MAX_FONT_SCALE);
  const height = BAR_CONTENT_HEIGHT + Math.ceil(LABEL_LINE_HEIGHT * labelScale) + insets.bottom;

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border, height },
    tabBarLabel: TabLabel,
    sceneStyle: { backgroundColor: colors.background },
  };
}

function TabLabel({ color, children }: { color: ColorValue; children: string }) {
  return (
    <Text
      style={[styles.label, { color }]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
      maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
    >
      {children}
    </Text>
  );
}

/**
 * Ícone da aba: contorno quando inativa e preenchido quando ativa
 */
export function tabIcon(outline: IconName, filled: IconName): TabOptions['tabBarIcon'] {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    // As cores das abas vêm do tema (strings); o ColorValue do RN também admite número e null
    return <Icon name={focused ? filled : outline} size={24} color={typeof color === 'string' ? color : undefined} />;
  }
  return TabIcon;
}

/**
 * Ícone da aba central "Digitalizar" (design da Início): círculo `primary` elevado acima da barra, com o ícone
 * branco. O rótulo e o alvo de toque continuam os da aba
 */
export function scanTabIcon() {
  return (
    <View style={styles.scanCircle}>
      <Icon name="scan-outline" size={26} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    maxWidth: '100%',
    paddingHorizontal: 2,
    fontFamily: fonts.semibold,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    textAlign: 'center',
  },
  scanCircle: {
    width: 52,
    height: 52,
    marginTop: -20,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
