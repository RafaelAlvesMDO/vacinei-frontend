import { api } from './api';
import type { ApiSuccessResponse } from '../types/auth';
import type { Ubs, UbsPayload } from '../types/ubs';

/**
 * Lista todas as UBS, inclusive as desativadas (includeInactive só vale com token de ADMIN)
 */
export async function listAllUbs(): Promise<Ubs[]> {
  const response = await api.get<ApiSuccessResponse<Ubs[]>>('/ubs', { params: { includeInactive: true } });
  return response.data.data;
}

/**
 * Cadastra uma UBS (RF008), que nasce ativa. 409 se o CNES já existe
 */
export async function createUbs(payload: UbsPayload): Promise<Ubs> {
  const response = await api.post<ApiSuccessResponse<Ubs>>('/ubs', payload);
  return response.data.data;
}

/**
 * Atualiza os dados enviados da UBS. 404 se não existe e 409 se o CNES já existe
 */
export async function updateUbs(id: string, payload: Partial<UbsPayload>): Promise<Ubs> {
  const response = await api.put<ApiSuccessResponse<Ubs>>(`/ubs/${id}`, payload);
  return response.data.data;
}

/**
 * Desativa (false) ou reativa (true) a UBS. A UBS nunca é excluída (D10)
 */
export async function setUbsStatus(id: string, isActive: boolean): Promise<Ubs> {
  const response = await api.patch<ApiSuccessResponse<Ubs>>(`/ubs/${id}/status`, { isActive });
  return response.data.data;
}
