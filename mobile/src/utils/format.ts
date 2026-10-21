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
 * Máscara de data durante a digitação: "15032010" → "15/03/2010"
 */
export function formatDateInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * "15/03/2010" → "2010-03-15" (formato da API). Retorna null se a data não existir no calendário
 */
export function parseDateInput(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCDate() !== Number(day) || date.getUTCMonth() !== Number(month) - 1) return null;
  return `${year}-${month}-${day}`;
}

/**
 * Minúsculas e sem acentos, para buscas no cliente: "pajucara" encontra "Pajuçara"
 */
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
