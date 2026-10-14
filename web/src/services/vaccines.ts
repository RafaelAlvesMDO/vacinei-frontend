import { api } from './api';
import type { ApiSuccessResponse } from '../types/auth';
import type { Vaccine, VaccinePayload, VaccineUpdatePayload } from '../types/vaccination';

/**
 * Catálogo de vacinas ativas, com as doses ordenadas (GET /vaccines)
 */
export async function listVaccines(): Promise<Vaccine[]> {
  const response = await api.get<ApiSuccessResponse<Vaccine[]>>('/vaccines');
  return response.data.data;
}

/**
 * Catálogo completo, inclusive as vacinas desativadas. A API filtra por `isActive` (padrão `true`),
 * então as ativas e as inativas vêm em duas chamadas
 */
export async function listAllVaccines(): Promise<Vaccine[]> {
  const [active, inactive] = await Promise.all([
    api.get<ApiSuccessResponse<Vaccine[]>>('/vaccines', { params: { isActive: 'true' } }),
    api.get<ApiSuccessResponse<Vaccine[]>>('/vaccines', { params: { isActive: 'false' } }),
  ]);
  return [...active.data.data, ...inactive.data.data].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/**
 * Cadastra uma vacina com o esquema de doses. 409 se o nome já existe
 */
export async function createVaccine(payload: VaccinePayload): Promise<Vaccine> {
  const response = await api.post<ApiSuccessResponse<Vaccine>>('/vaccines', payload);
  return response.data.data;
}

/**
 * Atualiza os dados enviados da vacina (as doses não são editáveis pela API).
 * Também desativa ou reativa (`isActive`). 404 se não existe e 409 se o nome já existe
 */
export async function updateVaccine(id: string, payload: VaccineUpdatePayload): Promise<Vaccine> {
  const response = await api.put<ApiSuccessResponse<Vaccine>>(`/vaccines/${id}`, payload);
  return response.data.data;
}
