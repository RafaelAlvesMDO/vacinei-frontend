import { api } from './api';
import type { ApiSuccessResponse } from '@/types/auth';
import type { DashboardSummary, OverdueList, OverdueParams, RecentDose } from '@/types/dashboard';

/**
 * Indicadores agregados do painel (RF009)
 */
export async function getDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  const response = await api.get<ApiSuccessResponse<DashboardSummary>>('/dashboard/summary', { signal });
  return response.data.data;
}

/**
 * Doses registradas recentemente, com o cidadão identificado (só profissional verificado)
 */
export async function getRecentDoses(limit: number, signal?: AbortSignal): Promise<RecentDose[]> {
  const response = await api.get<ApiSuccessResponse<RecentDose[]>>('/dashboard/recent-doses', {
    params: { limit },
    signal,
  });
  return response.data.data;
}

/**
 * Busca ativa (D21, D32): pessoas com doses atrasadas (mais atrasadas primeiro) ou com doses aguardando
 * conferência (por nome), conforme o `status`. Paginada (D22)
 */
export async function getOverdue(params: OverdueParams, signal?: AbortSignal): Promise<OverdueList> {
  const response = await api.get<ApiSuccessResponse<OverdueList>>('/dashboard/overdue', {
    params: { page: params.page, limit: params.limit, search: params.search || undefined, status: params.status },
    signal,
  });
  return response.data.data;
}
