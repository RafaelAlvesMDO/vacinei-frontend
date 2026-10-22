import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme';
import { Icon } from './Icon';
import { TextField, type TextFieldProps } from './TextField';

type Props = Omit<TextFieldProps, 'secureTextEntry' | 'trailing' | 'icon'>;

/**
 * Campo de senha com o botão de mostrar/ocultar
 */
export function PasswordField(props: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onPress={() => setVisible((current) => !current)}
          hitSlop={8}
          style={styles.toggle}
        >
          <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} color={colors.muted} />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
