import { useCallback } from 'react';
import { getVaccinationCard } from '@/services/citizens';
import type { ParsedApiError } from '@/types/auth';
import { useForbiddenSync } from './useForbiddenSync';
import { useRequest } from './useRequest';

/**
 * Caderneta de um cidadão na ala Profissional (só profissional verificado)
 */
export function useCitizenCard(citizenId: string) {
  const load = useCallback((signal: AbortSignal) => getVaccinationCard(citizenId, signal), [citizenId]);
  const request = useRequest(load, 'Não foi possível carregar a caderneta do cidadão.');
  useForbiddenSync(request.error?.status);
  return { ...request, errorMessage: getCardErrorMessage(request.error) };
}

function getCardErrorMessage(error: ParsedApiError | null): string | null {
  if (!error) return null;
  if (error.status === 404 || error.status === 400) return 'Cidadão não encontrado. Busque novamente pelo nome ou CPF.';
  return error.message;
}
