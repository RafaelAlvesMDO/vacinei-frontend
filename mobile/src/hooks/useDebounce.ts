import { useEffect, useState } from 'react';

/**
 * Valor atualizado só depois de `delay` ms sem mudanças (ex.: buscas enquanto se digita)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}
