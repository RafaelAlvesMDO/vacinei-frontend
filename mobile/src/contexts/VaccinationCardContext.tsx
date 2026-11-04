import type { Href } from 'expo-router';
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parseApiError } from '@/services/auth';
import { getVaccinationCard } from '@/services/citizens';
import { getDependentCard } from '@/services/dependents';
import { useAuth } from '@/hooks/useAuth';
import type { VaccinationCard } from '@/types/vaccination';

// De quem é a caderneta: do usuário logado ou de um dependente dele (D33)
export type CardOwner = { kind: 'self' } | { kind: 'dependent'; id: string };

// Rotas das telas da caderneta, que são as mesmas para o titular e para o dependente
export interface CardPaths {
  card: Href;
  vaccine: (vaccineId: string) => Href;
  record: (params: { vaccineId?: string; recordId?: string }) => Href;
  // Digitalizar a caderneta física (OCR, RF004)
  scan: Href;
}

export interface VaccinationCardContextValue {
  owner: CardOwner;
  paths: CardPaths;
  card: VaccinationCard | null;
  // Primeira carga (sem dados na tela)
  isLoading: boolean;
  // Puxar para atualizar: os dados anteriores continuam na tela
  isRefreshing: boolean;
  error: string | null;
  reload: (options?: { refreshing?: boolean }) => void;
}

export const VaccinationCardContext = createContext<VaccinationCardContextValue | null>(null);

const SELF: CardOwner = { kind: 'self' };

function getPaths(owner: CardOwner): CardPaths {
  if (owner.kind === 'self') {
    return {
      card: '/cidadao/caderneta',
      vaccine: (vaccineId) => ({ pathname: '/cidadao/vacina/[vaccineId]', params: { vaccineId } }),
      record: (params) => ({ pathname: '/cidadao/registro-vacina', params }),
      scan: '/cidadao/digitalizar',
    };
  }
  const dependentId = owner.id;
  return {
    card: { pathname: '/cidadao/dependentes/[dependentId]/caderneta', params: { dependentId } },
    vaccine: (vaccineId) => ({
      pathname: '/cidadao/dependentes/[dependentId]/vacina/[vaccineId]',
      params: { dependentId, vaccineId },
    }),
    record: (params) => ({ pathname: '/cidadao/dependentes/[dependentId]/registro-vacina', params: { dependentId, ...params } }),
    scan: { pathname: '/cidadao/dependentes/[dependentId]/digitalizar', params: { dependentId } },
  };
}

function getErrorMessage(error: unknown, owner: CardOwner): string {
  const isSelf = owner.kind === 'self';
  const parsed = parseApiError(
    error,
    isSelf ? 'Não foi possível carregar a sua caderneta.' : 'Não foi possível carregar a caderneta do dependente.',
  );
  if (parsed.status === 403) return 'Você não tem acesso a esta caderneta.';
  if (parsed.status === 404) {
    return isSelf
      ? 'Não encontramos a sua caderneta. Saia e entre novamente.'
      : 'Dependente não encontrado. Ele pode ter sido removido.';
  }
  return parsed.message;
}

interface ProviderProps {
  children: ReactNode;
  // Sem `owner`, a caderneta do usuário logado
  owner?: CardOwner;
}

/**
 * Caderneta buscada uma vez e compartilhada pelas telas de caderneta, detalhe e cadastro manual.
 * Na ala Cidadão, a do usuário logado (inclusive do profissional, D11); dentro das rotas de um dependente,
 * a dele (D33), com as mesmas telas
 */
export function VaccinationCardProvider({ children, owner = SELF }: ProviderProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const ownerKey = owner.kind === 'self' ? null : owner.id;
  // O dono só muda quando muda o id (o objeto pode ser recriado a cada render)
  const stableOwner = useMemo<CardOwner>(() => (ownerKey ? { kind: 'dependent', id: ownerKey } : SELF), [ownerKey]);
  const paths = useMemo(() => getPaths(stableOwner), [stableOwner]);
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

    const request =
      stableOwner.kind === 'self'
        ? getVaccinationCard(userId, controller.signal)
        : getDependentCard(stableOwner.id, controller.signal);

    request
      .then((data) => {
        if (controller.signal.aborted) return;
        setCard(data);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(reason, stableOwner));
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, [userId, stableOwner]);

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
    () => ({ owner: stableOwner, paths, card, isLoading, isRefreshing, error, reload }),
    [stableOwner, paths, card, isLoading, isRefreshing, error, reload],
  );

  return <VaccinationCardContext.Provider value={value}>{children}</VaccinationCardContext.Provider>;
}
