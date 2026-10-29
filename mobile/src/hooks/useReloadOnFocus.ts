import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Recarrega os dados ao voltar para a tela (ex.: depois de confirmar uma dose). O primeiro foco é
 * ignorado, porque a tela acabou de carregar
 */
export function useReloadOnFocus(reload: () => void) {
  const focusedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) reload();
      focusedOnce.current = true;
    }, [reload]),
  );
}
