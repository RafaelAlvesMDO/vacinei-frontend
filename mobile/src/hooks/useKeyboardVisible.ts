import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * Se o teclado está aberto. Usa os eventos "Did", os únicos disparados no Android. `onShow` roda a cada abertura
 * (ex.: rolar até o campo depois que a tela encolheu)
 */
export function useKeyboardVisible(onShow?: () => void): boolean {
  const [visible, setVisible] = useState(() => Keyboard.isVisible());

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setVisible(true);
      onShow?.();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [onShow]);

  return visible;
}
