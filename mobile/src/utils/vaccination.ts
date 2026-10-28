import type { BadgeTone, IconName } from '@/components/ui';
import type { CardRecord, CardVaccine, VaccineScheduleStatus } from '@/types/vaccination';
import { normalizeSearch } from './format';

// Caderneta sem vacinas. O cadastro manual já existe; a digitalização (etapa 8) ainda não
export const EMPTY_CARD_MESSAGE =
  'Você ainda não tem vacinas registradas. Cadastre as doses que já tomou. Em breve você também poderá digitalizar sua caderneta.';

// O status vem sempre da API; o app só escolhe rótulo, cor e ícone
export const SCHEDULE_STATUS: Record<VaccineScheduleStatus, { label: string; tone: BadgeTone; icon: IconName }> = {
  ATRASADA: { label: 'Atrasada', tone: 'danger', icon: 'alert-circle-outline' },
  EM_DIA: { label: 'Em dia', tone: 'primary', icon: 'checkmark-circle-outline' },
  COMPLETA: { label: 'Completa', tone: 'primary', icon: 'shield-checkmark-outline' },
};

const STATUS_ORDER: Record<VaccineScheduleStatus, number> = { ATRASADA: 0, EM_DIA: 1, COMPLETA: 2 };

/**
 * Atrasadas primeiro, depois em dia e completas; dentro do mesmo status, por nome
 */
export function sortVaccines(vaccines: CardVaccine[]): CardVaccine[] {
  return [...vaccines].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.vaccine.name.localeCompare(b.vaccine.name, 'pt-BR'),
  );
}

/**
 * Busca por nome da vacina ou doença, sem acentos: "hepatite" encontra "Hepatite B"
 */
export function matchesVaccineSearch(item: CardVaccine, search: string): boolean {
  const term = normalizeSearch(search);
  if (!term) return true;
  return [item.vaccine.name, item.vaccine.targetDisease].some((text) => normalizeSearch(text).includes(term));
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Hoje no fuso de Maceió, como data sem horário (meia-noite UTC)
function todayInMaceio(now: Date): number {
  const [year, month, day] = now.toLocaleDateString('en-CA', { timeZone: 'America/Maceio' }).split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/**
 * Dias desde a data prevista da próxima dose, só para exibição (o status continua o da API).
 * null sem data ou quando a data ainda não passou
 */
export function getDaysOverdue(nextDoseDate: string | null, now = new Date()): number | null {
  if (!nextDoseDate) return null;
  const due = new Date(nextDoseDate);
  if (Number.isNaN(due.getTime())) return null;
  const days = Math.floor(
    (todayInMaceio(now) - Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate())) / DAY_MS,
  );
  return days > 0 ? days : null;
}

/**
 * 1 → "1 dia em atraso"; sem a contagem, "Dose atrasada"
 */
export function formatOverdue(days: number | null): string {
  if (days === null) return 'Dose atrasada';
  return `${days} ${days === 1 ? 'dia' : 'dias'} em atraso`;
}

/**
 * Registro conferido por profissional ou ainda pendente de confirmação (D06)
 */
export function getRecordBadge(record: Pick<CardRecord, 'status'>): { label: string; tone: BadgeTone; icon: IconName } {
  if (record.status === 'CONFIRMADO') return { label: 'Confirmado', tone: 'primary', icon: 'checkmark-circle-outline' };
  return { label: 'Aguardando confirmação', tone: 'warning', icon: 'time-outline' };
}

// Registro da última dose aplicada, para mostrar a origem na lista
export function getLastRecord(item: CardVaccine): CardRecord | null {
  if (!item.lastDose) return null;
  const lastDoseId = item.lastDose.id;
  return item.records.find((record) => record.dose.id === lastDoseId) ?? null;
}

const DISEASE_SEPARATOR = /^(\s*,\s*|\s+e\s+)/;

// Separa por vírgula e " e " fora de parênteses; null se os parênteses não fecham
function splitOutsideParentheses(text: string): string[] | null {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let index = 0;
  while (index < text.length) {
    const separator = depth === 0 ? DISEASE_SEPARATOR.exec(text.slice(index)) : null;
    if (separator) {
      parts.push(current);
      current = '';
      index += separator[0].length;
      continue;
    }
    const char = text[index];
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (depth < 0) return null;
    current += char;
    index += 1;
  }
  parts.push(current);
  return depth === 0 ? parts : null;
}

/**
 * "Difteria, tétano e coqueluche" → ["Difteria", "Tétano", "Coqueluche"], para exibir uma doença por chip.
 * Na dúvida, o texto fica num chip só:
 * - parênteses que não fecham;
 * - complemento que vale para todas ("Pneumonia, Meningite e Otite média por Pneumococo"): o último item tem
 *   " por " e os anteriores são palavras soltas, então separar daria "Pneumonia" sem a causa
 */
export function splitDiseases(targetDisease: string): string[] {
  const text = targetDisease.trim();
  const parts = splitOutsideParentheses(text)
    ?.map((disease) => disease.trim())
    .filter(Boolean);
  if (!parts) return text ? [capitalize(text)] : [];
  if (parts.length < 2) return parts.map(capitalize);

  const last = parts[parts.length - 1];
  const sharedQualifier = / por /.test(last) && parts.slice(0, -1).every((disease) => !/\s/.test(disease));
  if (sharedQualifier) return [capitalize(text)];

  return parts.map(capitalize);
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1);
}

// Registros da dose mais recente para a mais antiga
export function sortRecords(records: CardRecord[]): CardRecord[] {
  return [...records].sort((a, b) => b.dose.doseNumber - a.dose.doseNumber);
}
