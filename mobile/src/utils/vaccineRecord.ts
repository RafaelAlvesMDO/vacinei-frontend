import type { CardVaccine, CatalogDose, CatalogVaccine, ManualRecordPayload } from '@/types/vaccination';
import { getTodayIso, normalizeSearch, parseDateInput, toDateInput } from './format';

// Mesma regra do lote na confirmação: até 20 letras e números, salvo em maiúsculas
export const LOTE_MAX_LENGTH = 20;
const LOTE_PATTERN = /^[A-Z0-9]{1,20}$/;
const MIN_YEAR = 1900;

// Valores do formulário de cadastro manual (data como digitada: DD/MM/AAAA)
export interface RecordFormValues {
  vaccineId: string | null;
  doseId: string | null;
  applicationDate: string;
  lote: string;
}

export type RecordField = keyof RecordFormValues;
export type RecordFormErrors = Partial<Record<RecordField, string>>;

/**
 * Valores iniciais vindos de fora do formulário: a vacina escolhida no detalhe, o registro
 * em edição ou, na etapa 8, a leitura da caderneta (OCR) para o cidadão conferir (RF004, RNF12).
 * A data vem no formato da API (YYYY-MM-DD)
 */
export interface RecordInitialValues {
  vaccineId?: string;
  doseId?: string;
  applicationDate?: string;
  lote?: string;
}

export function toFormValues(initial: RecordInitialValues = {}): RecordFormValues {
  return {
    vaccineId: initial.vaccineId ?? null,
    doseId: initial.doseId ?? null,
    applicationDate: initial.applicationDate ? toDateInput(initial.applicationDate) : '',
    lote: normalizeLote(initial.lote ?? ''),
  };
}

export function normalizeLote(value: string): string {
  return value.toUpperCase().slice(0, LOTE_MAX_LENGTH);
}

/**
 * Doses desta vacina que já estão na caderneta. O registro em edição não conta
 */
export function getTakenDoseIds(cardVaccine: CardVaccine | undefined, editingRecordId: string | null): Set<string> {
  return new Set(
    (cardVaccine?.records ?? []).filter((record) => record.id !== editingRecordId).map((record) => record.dose.id),
  );
}

/**
 * Dose sugerida ao escolher a vacina: a próxima pendente da caderneta ou, sem ela, a primeira ainda livre
 */
export function suggestDose(
  vaccine: CatalogVaccine,
  cardVaccine: CardVaccine | undefined,
  taken: Set<string>,
): CatalogDose | null {
  const free = vaccine.doses.filter((dose) => !taken.has(dose.id));
  const next = cardVaccine?.nextDose;
  return free.find((dose) => dose.id === next?.id) ?? free[0] ?? null;
}

/**
 * Busca no catálogo por nome ou doença, sem acentos: "sarampo" encontra "Tríplice viral (SCR)"
 */
export function matchesCatalogSearch(vaccine: CatalogVaccine, search: string): boolean {
  const term = normalizeSearch(search);
  if (!term) return true;
  return [vaccine.name, vaccine.targetDisease].some((text) => normalizeSearch(text).includes(term));
}

interface ValidationContext {
  vaccine: CatalogVaccine | undefined;
  taken: Set<string>;
  // Nascimento do titular (ISO), limite inferior da data de aplicação (RS003)
  birthDate: string | null;
}

/**
 * Regras do backend (D30) conferidas antes do envio
 */
export function validateRecordForm(values: RecordFormValues, { vaccine, taken, birthDate }: ValidationContext): RecordFormErrors {
  const errors: RecordFormErrors = {};

  if (!values.vaccineId) errors.vaccineId = 'Escolha a vacina na lista.';
  else if (!vaccine) errors.vaccineId = 'Esta vacina não está disponível no catálogo. Escolha outra na lista.';

  if (vaccine) {
    if (!values.doseId) errors.doseId = 'Escolha a dose.';
    else if (!vaccine.doses.some((dose) => dose.id === values.doseId)) errors.doseId = 'Escolha uma dose desta vacina.';
    else if (taken.has(values.doseId)) errors.doseId = 'Esta dose já está na sua caderneta.';
  }

  const date = parseDateInput(values.applicationDate);
  const birth = birthDate?.slice(0, 10) ?? null;
  if (!values.applicationDate) errors.applicationDate = 'Informe a data de aplicação.';
  else if (!date || Number(date.slice(0, 4)) < MIN_YEAR)
    errors.applicationDate = 'Informe uma data válida no formato DD/MM/AAAA.';
  else if (date > getTodayIso()) errors.applicationDate = 'A data de aplicação não pode ser futura.';
  else if (birth && date < birth)
    errors.applicationDate = `A data não pode ser anterior ao seu nascimento (${toDateInput(birth)}).`;

  if (values.lote && !LOTE_PATTERN.test(values.lote)) errors.lote = 'Use só letras e números, sem espaços ou traços.';

  return errors;
}

// Chamar só depois da validação
export function toRecordPayload(values: RecordFormValues): ManualRecordPayload {
  return {
    vaccineId: values.vaccineId ?? '',
    doseId: values.doseId ?? '',
    applicationDate: parseDateInput(values.applicationDate) ?? '',
    ...(values.lote ? { lote: values.lote } : {}),
  };
}
