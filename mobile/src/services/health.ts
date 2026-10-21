import { api } from './api';
import type { HealthResponse } from '@/types/health';

/**
 * Confere se a API responde (GET /health, público). Timeout curto para o teste de conexão
 */
export async function checkHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>('/health', { timeout: 5000, signal });
  return response.data;
}
