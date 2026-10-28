import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { colors, fonts } from '@/theme';

type TabsScreenOptions = NonNullable<ComponentProps<typeof Tabs.Screen>['options']>;
type TabOptions = Exclude<TabsScreenOptions, (...args: never[]) => unknown>;

// Barra de abas das duas alas: ativa em `primary`, inativa em `muted`, fundo branco
export const tabScreenOptions: TabOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
  tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
  sceneStyle: { backgroundColor: colors.background },
};

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
