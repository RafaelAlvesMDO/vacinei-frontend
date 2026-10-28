import { useCallback, useEffect, useRef, useState } from 'react';
import { parseApiError } from '@/services/auth';
import { listVaccines } from '@/services/vaccines';
import type { CatalogVaccine } from '@/types/vaccination';

/**
 * Catálogo de vacinas ativas (GET /vaccines) para o cadastro manual, ordenado por nome
 */
export function useVaccineCatalog() {
  const [vaccines, setVaccines] = useState<CatalogVaccine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // O estado só muda na resposta (a requisição anterior é cancelada)
  const load = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    listVaccines(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setVaccines([...data].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(parseApiError(reason, 'Não foi possível carregar as vacinas.').message);
      });
  }, []);

  useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  const reload = useCallback(() => {
    setError(null);
    load();
  }, [load]);

  return { vaccines, error, reload };
}
