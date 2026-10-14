import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';

// Parâmetros de URL das listas paginadas (D22)
export const PAGE_PARAM = 'pagina';
export const SEARCH_PARAM = 'busca';

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/**
 * Página atual na URL (`?pagina=`, omitida na primeira). Trocar de página cria uma entrada no histórico
 */
export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get(PAGE_PARAM));

  const setPage = useCallback(
    (next: number, options: { replace?: boolean } = {}) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next <= 1) params.delete(PAGE_PARAM);
          else params.set(PAGE_PARAM, String(next));
          return params;
        },
        { replace: options.replace }
      );
    },
    [setSearchParams]
  );

  return { page, setPage };
}

/**
 * Uma página além da última (ex.: o último item dela saiu do filtro após uma ação) volta para a última.
 * `totalPages` é o da resposta da página atual, já carregada
 */
export function useClampPage(
  page: number,
  totalPages: number | undefined,
  isLoading: boolean,
  setPage: (page: number, options?: { replace?: boolean }) => void
) {
  useEffect(() => {
    if (isLoading || totalPages === undefined) return;
    const lastPage = Math.max(totalPages, 1);
    if (page > lastPage) setPage(lastPage, { replace: true });
  }, [page, totalPages, isLoading, setPage]);
}

/**
 * Atualiza filtros da URL voltando para a primeira página. `null` ou vazio remove o parâmetro
 */
export function useFilterParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const setFilters = useCallback(
    (changes: Record<string, string | null>) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          Object.entries(changes).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
          });
          params.delete(PAGE_PARAM);
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return { searchParams, setFilters };
}

/**
 * Campo de busca ligado à URL (`?busca=`): o texto digitado vai para a URL após o debounce, voltando à primeira página.
 * Termos abaixo de `minLength` caracteres equivalem a sem busca. `search` é o termo vigente, a ser enviado à API
 */
export function useSearchParamInput({ delay = 400, minLength = 1 }: { delay?: number; minLength?: number } = {}) {
  const { searchParams, setFilters } = useFilterParams();
  const search = searchParams.get(SEARCH_PARAM) ?? '';
  const [input, setInput] = useState(search);

  const trimmed = input.trim();
  const term = trimmed.length >= minLength ? trimmed : '';
  const debouncedTerm = useDebounce(term, delay);

  // Só reage ao que foi digitado, para não desfazer uma mudança da URL pelo histórico
  const lastTerm = useRef(debouncedTerm);
  useEffect(() => {
    if (lastTerm.current === debouncedTerm) return;
    lastTerm.current = debouncedTerm;
    if (debouncedTerm !== search) setFilters({ [SEARCH_PARAM]: debouncedTerm || null });
  }, [debouncedTerm, search, setFilters]);

  return { input, setInput, search, isTyping: term !== search };
}
