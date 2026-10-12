import { api } from './api';
import type { ApiSuccessResponse } from '../types/auth';
import type { ConfirmDosePayload, ConfirmDoseResult } from '../types/vaccination';

/**
 * Confirmação presencial de dose (RF010). O profissional responsável vem da sessão (RS006).
 * 201 → dose nova (CREATED); 200 → registro do cidadão confirmado (CONFIRMED_EXISTING); 409 → já confirmada.
 */
export async function confirmDose(payload: ConfirmDosePayload): Promise<ConfirmDoseResult> {
  const response = await api.post<ApiSuccessResponse<ConfirmDoseResult>>('/vaccination-records/confirm', payload);
  return response.data.data;
}
