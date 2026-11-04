import { api } from './api';
import type { ApiSuccessResponse } from '@/types/auth';
import type { Dependent, DependentPayload } from '@/types/dependent';
import type { ManualRecordPayload, SavedRecord, VaccinationCard } from '@/types/vaccination';

// Dependentes do usuário logado (RF012, D33). O responsável vem sempre do token. Um id que não é dependente
// dele responde 404, sem revelar se o cadastro existe (RS004)

const base = (id: string) => `/dependents/${encodeURIComponent(id)}`;

interface SavedRecordResponse {
  record: SavedRecord;
}

// Do mais novo para o mais velho
export async function listDependents(signal?: AbortSignal): Promise<Dependent[]> {
  const response = await api.get<ApiSuccessResponse<Dependent[]>>('/dependents', { signal });
  return response.data.data;
}

/**
 * 400: validação ou idade (menor de 18, exceto CURATELADO). 409: CPF já usado ou mesmo nome e
 * nascimento já cadastrados por este responsável (RS008)
 */
export async function createDependent(payload: DependentPayload): Promise<Dependent> {
  const response = await api.post<ApiSuccessResponse<Dependent>>('/dependents', payload);
  return response.data.data;
}

// Substitui os dados básicos. A idade só é reavaliada quando o nascimento ou o parentesco mudam
export async function updateDependent(id: string, payload: DependentPayload): Promise<Dependent> {
  const response = await api.put<ApiSuccessResponse<Dependent>>(base(id), payload);
  return response.data.data;
}

// Apaga também os registros não confirmados. Com dose confirmada, 409
export async function deleteDependent(id: string): Promise<void> {
  await api.delete(base(id));
}

// Caderneta do dependente: mesmo formato da caderneta do titular, com `citizen.responsible` preenchido
export async function getDependentCard(id: string, signal?: AbortSignal): Promise<VaccinationCard> {
  const response = await api.get<ApiSuccessResponse<VaccinationCard>>(`${base(id)}/vaccination-records`, { signal });
  return response.data.data;
}

// Registro manual na caderneta do dependente (D30): mesmas regras do titular
export async function createDependentRecord(id: string, payload: ManualRecordPayload): Promise<SavedRecord> {
  const response = await api.post<ApiSuccessResponse<SavedRecordResponse>>(`${base(id)}/vaccination-records`, payload);
  return response.data.data.record;
}

export async function updateDependentRecord(
  id: string,
  recordId: string,
  payload: ManualRecordPayload,
): Promise<SavedRecord> {
  const response = await api.put<ApiSuccessResponse<SavedRecordResponse>>(
    `${base(id)}/vaccination-records/${encodeURIComponent(recordId)}`,
    payload,
  );
  return response.data.data.record;
}

export async function deleteDependentRecord(id: string, recordId: string): Promise<void> {
  await api.delete(`${base(id)}/vaccination-records/${encodeURIComponent(recordId)}`);
}
