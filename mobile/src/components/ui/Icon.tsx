import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { colors } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  name: IconName;
  size?: number;
  color?: ColorValue;
}

// Ícones decorativos: o texto ao lado (ou o accessibilityLabel do botão) é que é anunciado
export function Icon({ name, size = 20, color = colors.primary }: Props) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
