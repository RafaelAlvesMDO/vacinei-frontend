import { api } from './api';
import type { ApiSuccessResponse } from '@/types/auth';
import type { CatalogVaccine } from '@/types/vaccination';

/**
 * Vacinas ativas do catálogo, com as doses (GET /vaccines)
 */
export async function listVaccines(signal?: AbortSignal): Promise<CatalogVaccine[]> {
  const response = await api.get<ApiSuccessResponse<CatalogVaccine[]>>('/vaccines', { signal });
  return response.data.data;
}
