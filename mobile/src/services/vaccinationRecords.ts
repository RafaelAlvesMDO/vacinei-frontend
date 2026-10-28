import { api } from './api';
import type { ApiSuccessResponse } from '@/types/auth';
import type { ManualRecordPayload, SavedRecord } from '@/types/vaccination';

interface SavedRecordResponse {
  record: SavedRecord;
}

/**
 * Cadastro manual na própria caderneta (RF005, D30): entra como MANUAL e aguardando confirmação (D06)
 */
export async function createRecord(payload: ManualRecordPayload): Promise<SavedRecord> {
  const response = await api.post<ApiSuccessResponse<SavedRecordResponse>>('/vaccination-records', payload);
  return response.data.data.record;
}

/**
 * Edição pelo titular, só enquanto o registro não estiver confirmado. Substitui o registro inteiro
 */
export async function updateRecord(id: string, payload: ManualRecordPayload): Promise<SavedRecord> {
  const response = await api.put<ApiSuccessResponse<SavedRecordResponse>>(`/vaccination-records/${id}`, payload);
  return response.data.data.record;
}

export async function deleteRecord(id: string): Promise<void> {
  await api.delete(`/vaccination-records/${id}`);
}
