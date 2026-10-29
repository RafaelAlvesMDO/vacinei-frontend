import { Pressable, StyleSheet } from 'react-native';
import { colors, spacing, touchTarget } from '@/theme';
import { Icon } from './Icon';
import { TextField, type TextFieldProps } from './TextField';

interface Props extends Omit<TextFieldProps, 'value' | 'onChangeText' | 'trailing' | 'icon'> {
  value: string;
  onChangeText: (text: string) => void;
}

/**
 * Campo de busca: lupa à direita e, com texto, o botão de limpar
 */
export function SearchField({ value, onChangeText, ...props }: Props) {
  return (
    <TextField
      value={value}
      onChangeText={onChangeText}
      autoCorrect={false}
      returnKeyType="search"
      trailing={
        value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            onPress={() => onChangeText('')}
            style={styles.clear}
          >
            <Icon name="close-circle" color={colors.muted} />
          </Pressable>
        ) : (
          <Icon name="search" color={colors.muted} />
        )
      }
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  clear: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.md,
  },
});
