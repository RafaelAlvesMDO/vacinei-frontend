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
