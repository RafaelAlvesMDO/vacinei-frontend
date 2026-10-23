import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parseApiError } from '@/services/auth';
import { getVaccinationCard } from '@/services/citizens';
import { useAuth } from '@/hooks/useAuth';
import type { VaccinationCard } from '@/types/vaccination';

export interface VaccinationCardContextValue {
  card: VaccinationCard | null;
  // Primeira carga (sem dados na tela)
  isLoading: boolean;
  // Puxar para atualizar: os dados anteriores continuam na tela
  isRefreshing: boolean;
  error: string | null;
  reload: (options?: { refreshing?: boolean }) => void;
}

export const VaccinationCardContext = createContext<VaccinationCardContextValue | null>(null);

function getErrorMessage(error: unknown): string {
  const parsed = parseApiError(error, 'Não foi possível carregar a sua caderneta.');
  if (parsed.status === 403) return 'Você não tem acesso a esta caderneta.';
  if (parsed.status === 404) return 'Não encontramos a sua caderneta. Saia e entre novamente.';
  return parsed.message;
}

/**
 * Caderneta do usuário logado, buscada uma vez e compartilhada pelas telas da ala Cidadão
 * (Início, Caderneta e Detalhe). Vale também para o profissional na ala Cidadão (D11)
 */
export function VaccinationCardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [card, setCard] = useState<VaccinationCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Busca a caderneta; o estado só muda na resposta (a requisição anterior é cancelada)
  const fetchCard = useCallback(() => {
    if (!userId) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    getVaccinationCard(userId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setCard(data);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(reason));
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, [userId]);

  const reload = useCallback(
    (options?: { refreshing?: boolean }) => {
      if (options?.refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      fetchCard();
    },
    [fetchCard],
  );

  useEffect(() => {
    fetchCard();
    return () => controllerRef.current?.abort();
  }, [fetchCard]);

  const value = useMemo(
    () => ({ card, isLoading, isRefreshing, error, reload }),
    [card, isLoading, isRefreshing, error, reload],
  );

  return <VaccinationCardContext.Provider value={value}>{children}</VaccinationCardContext.Provider>;
}
