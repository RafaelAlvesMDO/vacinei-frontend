import { api } from './api';
import type { ApiSuccessResponse } from '../types/auth';
import type { DashboardSummary, MonthlyTotal, RecentDose } from '../types/dashboard';

/**
 * Indicadores agregados do painel (ADMIN ou profissional verificado)
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<ApiSuccessResponse<DashboardSummary>>('/dashboard/summary');
  return response.data.data;
}

/**
 * Total de registros por mês nos últimos 12 meses (ADMIN ou profissional verificado)
 */
export async function getMonthlyTotals(): Promise<MonthlyTotal[]> {
  const response = await api.get<ApiSuccessResponse<MonthlyTotal[]>>('/dashboard/monthly');
  return response.data.data;
}

/**
 * Doses aplicadas recentemente, com cidadão identificado (apenas profissional verificado)
 */
export async function getRecentDoses(limit = 10): Promise<RecentDose[]> {
  const response = await api.get<ApiSuccessResponse<RecentDose[]>>('/dashboard/recent-doses', {
    params: { limit },
  });
  return response.data.data;
}
