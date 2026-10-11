import { api } from './api';
import type { ApiSuccessResponse } from '../types/auth';
import type { CitizenSearchResult } from '../types/citizen';

/**
 * Busca cidadãos por nome ou CPF (2 a 100 caracteres, máximo de 20 resultados)
 */
export async function searchCitizens(search: string, signal?: AbortSignal): Promise<CitizenSearchResult[]> {
  const response = await api.get<ApiSuccessResponse<CitizenSearchResult[]>>('/citizens', {
    params: { search: search.trim() },
    signal,
  });
  return response.data.data;
}
