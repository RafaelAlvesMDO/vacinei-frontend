import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { colors } from '@/theme';

// Ícones que o Ionicons não tem vêm do MaterialCommunityIcons
const COMMUNITY_ICONS = ['stethoscope', 'map-marker-off-outline', 'needle'] as const;
type CommunityIconName = (typeof COMMUNITY_ICONS)[number];

export type IconName = ComponentProps<typeof Ionicons>['name'] | CommunityIconName;

interface Props {
  name: IconName;
  size?: number;
  color?: ComponentProps<typeof Ionicons>['color'];
}

function isCommunityIcon(name: IconName): name is CommunityIconName {
  return (COMMUNITY_ICONS as readonly string[]).includes(name);
}

// Ícones decorativos: o texto ao lado (ou o accessibilityLabel do botão) é que é anunciado
export function Icon({ name, size = 20, color = colors.primary }: Props) {
  const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;
  if (isCommunityIcon(name)) return <MaterialCommunityIcons name={name} size={size} color={color} {...hidden} />;
  return <Ionicons name={name} size={size} color={color} {...hidden} />;
}
