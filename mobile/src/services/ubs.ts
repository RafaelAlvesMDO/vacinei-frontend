import { api } from './api';
import type { ApiSuccessResponse } from '@/types/auth';
import type { Coords, Ubs } from '@/types/ubs';

// Raio da busca por proximidade. Cobre Maceió inteira a partir de qualquer bairro
export const NEARBY_RADIUS_KM = 50;

/**
 * UBS ativas, em ordem alfabética (GET /ubs)
 */
export async function listUbs(signal?: AbortSignal): Promise<Ubs[]> {
  const response = await api.get<ApiSuccessResponse<Ubs[]>>('/ubs', { signal });
  return response.data.data;
}

/**
 * UBS ativas no raio, com `distanceKm` e ordenadas pela distância (RF008 nota 2).
 * A localização só vai na consulta: não é salva no aparelho nem no servidor
 */
export async function listNearbyUbs(coords: Coords, signal?: AbortSignal): Promise<Ubs[]> {
  const response = await api.get<ApiSuccessResponse<Ubs[]>>('/ubs', {
    params: { latitude: coords.latitude, longitude: coords.longitude, radiusKm: NEARBY_RADIUS_KM },
    signal,
  });
  return response.data.data;
}

export async function getUbs(id: string, signal?: AbortSignal): Promise<Ubs> {
  const response = await api.get<ApiSuccessResponse<Ubs>>(`/ubs/${id}`, { signal });
  return response.data.data;
}
