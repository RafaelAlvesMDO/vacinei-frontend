import { api } from './api';
import type { ApiSuccessResponse } from '@/types/auth';
import type { CitizenSearchResult } from '@/types/citizen';
import type { VaccinationCard } from '@/types/vaccination';

/**
 * Caderneta de vacinação (GET /citizens/:id/vaccination-records). Na ala Cidadão, o id é o do
 * próprio usuário, inclusive do profissional, que também tem caderneta (D11). Na ala Profissional,
 * o do cidadão atendido (só profissional verificado)
 */
export async function getVaccinationCard(citizenId: string, signal?: AbortSignal): Promise<VaccinationCard> {
  const response = await api.get<ApiSuccessResponse<VaccinationCard>>(
    `/citizens/${encodeURIComponent(citizenId)}/vaccination-records`,
    { signal },
  );
  return response.data.data;
}

/**
 * Busca de cidadãos por nome ou CPF (2 a 100 caracteres, no máximo 20 resultados, RF010 nota 1)
 */
export async function searchCitizens(search: string, signal?: AbortSignal): Promise<CitizenSearchResult[]> {
  const response = await api.get<ApiSuccessResponse<CitizenSearchResult[]>>('/citizens', {
    params: { search: search.trim() },
    signal,
  });
  return response.data.data;
}
