import { api } from './api';
import type { ApiSuccessResponse } from '@/types/auth';
import type { VaccinationCard } from '@/types/vaccination';

/**
 * Caderneta de vacinação (GET /citizens/:id/vaccination-records). Na ala Cidadão, o id é o do
 * próprio usuário, inclusive do profissional, que também tem caderneta (D11)
 */
export async function getVaccinationCard(citizenId: string, signal?: AbortSignal): Promise<VaccinationCard> {
  const response = await api.get<ApiSuccessResponse<VaccinationCard>>(`/citizens/${citizenId}/vaccination-records`, {
    signal,
  });
  return response.data.data;
}
