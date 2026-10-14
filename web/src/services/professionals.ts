import { api } from './api';
import type { ApiSuccessResponse } from '../types/auth';
import type { ListProfessionalsParams, Professional, ProfessionalListPage } from '../types/professional';

/**
 * Página de profissionais de saúde (apenas ADMIN), por data de cadastro. Busca e filtros rodam na API (D22)
 */
export async function listProfessionals({
  status,
  search,
  page,
  limit,
}: ListProfessionalsParams = {}): Promise<ProfessionalListPage> {
  const response = await api.get<ApiSuccessResponse<ProfessionalListPage>>('/professionals', {
    params: { status, search: search || undefined, page, limit },
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
