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
