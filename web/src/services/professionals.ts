import { api } from './api';
import type { ApiSuccessResponse } from '../types/auth';
import type { Professional } from '../types/professional';

interface ListProfessionalsFilters {
  // false: pendentes e recusados; true: verificados; omitido: todos
  verified?: boolean;
}

/**
 * Lista os profissionais de saúde (apenas ADMIN)
 */
export async function listProfessionals({ verified }: ListProfessionalsFilters = {}): Promise<Professional[]> {
  const response = await api.get<ApiSuccessResponse<Professional[]>>('/professionals', {
    params: verified === undefined ? undefined : { verified },
  });
  return response.data.data;
}

/**
 * Verifica o registro do profissional (RS001). 409 se já verificado
 */
export async function verifyProfessional(id: string): Promise<Professional> {
  const response = await api.patch<ApiSuccessResponse<Professional>>(`/professionals/${id}/verify`);
  return response.data.data;
}

/**
 * Recusa o registro do profissional; se já verificado, revoga a verificação. 409 se a recusa já foi registrada
 */
export async function rejectProfessional(id: string, reason?: string): Promise<Professional> {
  const response = await api.patch<ApiSuccessResponse<Professional>>(
    `/professionals/${id}/reject`,
    reason ? { reason } : {}
  );
  return response.data.data;
}
