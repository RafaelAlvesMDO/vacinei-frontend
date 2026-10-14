const MONTH_ABBREVIATIONS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * "2025-11" → "nov/25"
 */
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-');
  const abbreviation = MONTH_ABBREVIATIONS[Number(monthNumber) - 1];
  if (!year || !abbreviation) return month;
  return `${abbreviation}/${year.slice(-2)}`;
}

/**
 * "2025-11" → "novembro de 2025"
 */
export function formatMonthLong(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Data e hora de um evento (ISO) no fuso de Maceió → "10/10/2026"
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Maceio' });
}

/**
 * Datas sem horário (ex.: nascimento) são lidas em UTC para não recuar um dia
 */
export function formatCalendarDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

/**
 * Remove tudo que não é dígito → "82999990002"
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Máscara de telefone durante a digitação, adaptada ao tamanho:
 * fixo "8233150000" → "(82) 3315-0000" e celular "82999990002" → "(82) 99999-0002"
 */
export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  const splitAt = digits.length === 11 ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, splitAt)}-${digits.slice(splitAt)}`;
}

/**
 * Máscara de horário 24h durante a digitação: "0700" → "07:00" e "1730" → "17:30"
 */
export function formatTime(value: string): string {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/**
 * Máscara de CEP durante a digitação: "57051000" → "57051-000"
 */
export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Minúsculas e sem acentos, para buscas no cliente: "pajucara" encontra "Pajuçara"
 */
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
