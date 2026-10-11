import { useCallback, useEffect, useState } from 'react';
import { parseApiError } from '../services/auth';
import type { ParsedApiError } from '../types/auth';

interface SettledState<T> {
  data: T | null;
  error: ParsedApiError | null;
  // Chamada (fetcher + tentativa) a que este resultado corresponde
  fetcher: (() => Promise<T>) | null;
  attempt: number;
}

export interface UseAsyncResult<T> {
  data: T | null;
  error: ParsedApiError | null;
  isLoading: boolean;
  reload: () => void;
}

/**
 * Executa uma chamada assíncrona ao montar e expõe dados, erro normalizado e recarga.
 * `fetcher` deve ser estável (função de módulo ou useCallback).
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  fallbackErrorMessage: string,
  enabled = true
): UseAsyncResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<SettledState<T>>({ data: null, error: null, fetcher: null, attempt: -1 });

  useEffect(() => {
    if (!enabled) return;

    let isCancelled = false;

    fetcher()
      .then((data) => {
        if (!isCancelled) setSettled({ data, error: null, fetcher, attempt });
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setSettled({ data: null, error: parseApiError(error, fallbackErrorMessage), fetcher, attempt });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [fetcher, fallbackErrorMessage, enabled, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  // Carregando enquanto o resultado salvo não corresponde à chamada atual
  const isLoading = enabled && (settled.fetcher !== fetcher || settled.attempt !== attempt);

  return { data: settled.data, error: isLoading ? null : settled.error, isLoading, reload };
}
