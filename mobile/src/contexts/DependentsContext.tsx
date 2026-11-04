import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parseApiError } from '@/services/auth';
import { getDependentCard, listDependents } from '@/services/dependents';
import { useAuth } from '@/hooks/useAuth';
import type { Dependent } from '@/types/dependent';
import type { VaccinationCard } from '@/types/vaccination';

export interface DependentOverview {
  dependent: Dependent;
  // Caderneta para o resumo da situação; null se não carregou
  card: VaccinationCard | null;
}

export interface DependentsContextValue {
  dependents: DependentOverview[] | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  reload: (options?: { refreshing?: boolean; silent?: boolean }) => void;
  // Mostra na hora o dependente salvo (cadastro ou edição) e atualiza a lista em segundo plano
  saved: (dependent: Dependent) => void;
  // Tira da lista na hora o dependente removido
  removed: (id: string) => void;
}

export const DependentsContext = createContext<DependentsContextValue | null>(null);

/**
 * Dependentes do usuário logado (RF012, D33), com a caderneta de cada um para o resumo da situação (D32).
 * O GET /dependents não traz o resumo, então as cadernetas são buscadas em paralelo (aceitável para poucos
 * dependentes; melhoria futura: o resumo vir da API). Vale também para o profissional na ala Cidadão (D11)
 */
export function DependentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [dependents, setDependents] = useState<DependentOverview[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchAll = useCallback(() => {
    if (!userId) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;

    listDependents(signal)
      .then(async (list) => {
        const cards = await Promise.allSettled(list.map((dependent) => getDependentCard(dependent.id, signal)));
        if (signal.aborted) return;
        setDependents(
          list.map((dependent, index) => {
            const result = cards[index];
            return { dependent, card: result.status === 'fulfilled' ? result.value : null };
          }),
        );
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!signal.aborted) setError(parseApiError(reason, 'Não foi possível carregar os seus dependentes.').message);
      })
      .finally(() => {
        if (signal.aborted) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, [userId]);

  // `silent`: atualiza sem indicador (ex.: ao voltar para a tela)
  const reload = useCallback(
    (options?: { refreshing?: boolean; silent?: boolean }) => {
      if (options?.refreshing) setIsRefreshing(true);
      else if (!options?.silent) setIsLoading(true);
      if (!options?.silent) setError(null);
      fetchAll();
    },
    [fetchAll],
  );

  const saved = useCallback(
    (dependent: Dependent) => {
      setDependents((current) => {
        if (!current) return current;
        const exists = current.some((item) => item.dependent.id === dependent.id);
        return exists
          ? current.map((item) => (item.dependent.id === dependent.id ? { ...item, dependent } : item))
          : [{ dependent, card: null }, ...current];
      });
      fetchAll();
    },
    [fetchAll],
  );

  const removed = useCallback(
    (id: string) => {
      setDependents((current) => current && current.filter((item) => item.dependent.id !== id));
      fetchAll();
    },
    [fetchAll],
  );

  useEffect(() => {
    fetchAll();
    return () => controllerRef.current?.abort();
  }, [fetchAll]);

  const value = useMemo(
    () => ({ dependents, isLoading, isRefreshing, error, reload, saved, removed }),
    [dependents, isLoading, isRefreshing, error, reload, saved, removed],
  );

  return <DependentsContext.Provider value={value}>{children}</DependentsContext.Provider>;
}
