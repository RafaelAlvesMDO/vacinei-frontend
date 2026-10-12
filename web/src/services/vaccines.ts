import { api } from './api';
import type { ApiSuccessResponse } from '../types/auth';
import type { Vaccine } from '../types/vaccination';

/**
 * Catálogo de vacinas ativas, com as doses ordenadas (GET /vaccines)
 */
export async function listVaccines(): Promise<Vaccine[]> {
  const response = await api.get<ApiSuccessResponse<Vaccine[]>>('/vaccines');
  return response.data.data;
}
