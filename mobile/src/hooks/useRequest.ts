import { useCallback, useEffect, useRef, useState } from 'react';
import { parseApiError } from '@/services/auth';
import type { ParsedApiError } from '@/types/auth';

interface Settled<T> {
  // Chamada que produziu o resultado: enquanto for diferente da atual, a tela está carregando
  source: unknown;
  data: T | null;
  error: ParsedApiError | null;
}

/**
 * Dados de uma chamada à API, refeita quando `load` muda (usar `useCallback`). A requisição anterior é
 * cancelada e os dados anteriores continuam na tela até a resposta da nova
 */
export function useRequest<T>(load: (signal: AbortSignal) => Promise<T>, fallbackMessage: string) {
  const [settled, setSettled] = useState<Settled<T>>({ source: null, data: null, error: null });
  // "Tentar novamente" com a mesma chamada
  const [isReloading, setIsReloading] = useState(false);
  // Puxar para atualizar
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSettled({ source: load, data, error: null });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        const error = parseApiError(reason, fallbackMessage);
        setSettled((current) => ({ source: load, data: current.data, error }));
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsReloading(false);
        setIsRefreshing(false);
      });
  }, [load, fallbackMessage]);

  const reload = useCallback(
    (options?: { refreshing?: boolean }) => {
      if (options?.refreshing) setIsRefreshing(true);
      else setIsReloading(true);
      fetchData();
    },
    [fetchData],
  );

  useEffect(() => {
    fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData]);

  return {
    data: settled.data,
    error: settled.error,
    isLoading: settled.source !== load || isReloading,
    isRefreshing,
    reload,
  };
}
