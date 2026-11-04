import { api } from './api';
import type { ApiSuccessResponse } from '@/types/auth';
import type { OcrResult } from '@/types/ocr';
import type { ConfirmDosePayload, ConfirmDoseResult, ManualRecordPayload, SavedRecord } from '@/types/vaccination';

// O backend espera o serviço de OCR por até 20 s (OCR_TIMEOUT_MS); a margem cobre o envio da foto
const OCR_TIMEOUT_MS = 35000;

// Arquivo no formato que o FormData do React Native envia a partir de um caminho local
interface NativeUploadFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Leitura da caderneta por foto (RF004, D34): devolve só sugestões, sem gravar nada. Serve ao titular e aos
 * dependentes, porque quem define o dono é a rota de salvamento. A API processa a imagem em memória e a descarta
 */
export async function readCardPhoto(uri: string, signal?: AbortSignal): Promise<OcrResult> {
  const file: NativeUploadFile = { uri, name: 'caderneta.jpg', type: 'image/jpeg' };
  const body = new FormData();
  body.append('image', file as unknown as Blob);

  const response = await api.post<ApiSuccessResponse<OcrResult>>('/vaccination-records/ocr', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Sem isto, o Axios tenta serializar o FormData do React Native
    transformRequest: (data: unknown) => data,
    timeout: OCR_TIMEOUT_MS,
    signal,
  });
  return response.data.data;
}

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
