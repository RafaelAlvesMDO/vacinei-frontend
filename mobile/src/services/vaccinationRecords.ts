import { api } from './api';
import type { ApiSuccessResponse } from '@/types/auth';
import type { ConfirmDosePayload, ConfirmDoseResult, ManualRecordPayload, SavedRecord } from '@/types/vaccination';

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

/**
 * Confirmação presencial (RF010). 201 → dose nova; 200 → registro do cidadão confirmado; 409 → já confirmada.
 * A API recusa a própria vacinação do profissional (RS006)
 */
export async function confirmDose(payload: ConfirmDosePayload): Promise<ConfirmDoseResult> {
  const response = await api.post<ApiSuccessResponse<ConfirmDoseResult>>('/vaccination-records/confirm', payload);
  return response.data.data;
}
