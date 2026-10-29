import type { BadgeTone, IconName } from '@/components/ui';
import type { AlertStatus, CardRecord, CardVaccine, PendingDose } from '@/types/vaccination';
import { normalizeSearch } from './format';

// Caderneta sem vacinas. O cadastro manual já existe; a digitalização (etapa 8) ainda não
export const EMPTY_CARD_MESSAGE =
  'Você ainda não tem vacinas registradas. Cadastre as doses que já tomou. Em breve você também poderá digitalizar sua caderneta.';

// Mensagem das doses informadas e não confirmadas (D32): não é atraso, falta a conferência presencial
export const AWAITING_MESSAGE = 'Dose informada · leve sua caderneta à UBS para conferência';

/**
 * O app mostra a situação do `alert` da API (D32): uma vacina só fica em dia ou completa com as doses
 * confirmadas. O app só escolhe rótulo, cor e ícone
 */
export const SCHEDULE_STATUS: Record<AlertStatus, { label: string; tone: BadgeTone; icon: IconName }> = {
  ATRASADA: { label: 'Atrasada', tone: 'danger', icon: 'alert-circle-outline' },
  AGUARDANDO_CONFERENCIA: { label: 'Aguardando conferência', tone: 'warning', icon: 'time-outline' },
  EM_DIA: { label: 'Em dia', tone: 'primary', icon: 'checkmark-circle-outline' },
  COMPLETA: { label: 'Completa', tone: 'primary', icon: 'shield-checkmark-outline' },
};

const STATUS_ORDER: Record<AlertStatus, number> = { ATRASADA: 0, AGUARDANDO_CONFERENCIA: 1, EM_DIA: 2, COMPLETA: 3 };

/**
 * Atrasadas primeiro, depois aguardando conferência, em dia e completas; dentro do mesmo status, por nome
 */
export function sortVaccines(vaccines: CardVaccine[]): CardVaccine[] {
  return [...vaccines].sort(
    (a, b) =>
      STATUS_ORDER[a.alert.status] - STATUS_ORDER[b.alert.status] ||
      a.vaccine.name.localeCompare(b.vaccine.name, 'pt-BR'),
  );
}

// "1ª Dose" ou "1ª Dose e 2ª Dose"
export function formatPendingDoses(doses: Pick<PendingDose, 'doseName'>[]): string {
  const names = doses.map((dose) => dose.doseName);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
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

// Dia no fuso de Maceió, como data sem horário (meia-noite UTC)
function dayInMaceio(now: Date): number {
  const [year, month, day] = now.toLocaleDateString('en-CA', { timeZone: 'America/Maceio' }).split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/**
 * Dias entre a data prevista e o dia de `now` (fuso de Maceió): positivo depois da data, 0 no dia e
 * negativo antes. null sem data
 */
export function getDaysFromDue(nextDoseDate: string | null, now = new Date()): number | null {
  if (!nextDoseDate) return null;
  const due = new Date(nextDoseDate);
  if (Number.isNaN(due.getTime())) return null;
  return Math.round((dayInMaceio(now) - Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate())) / DAY_MS);
}

/**
 * Dias desde a data prevista da próxima dose, só para exibição (o status continua o da API).
 * O atraso começa no dia seguinte à data prevista (RF007 nota 6). null sem data ou quando a data ainda não passou
 */
export function getDaysOverdue(nextDoseDate: string | null, now = new Date()): number | null {
  const days = getDaysFromDue(nextDoseDate, now);
  return days !== null && days > 0 ? days : null;
}

const DAYS_PER_YEAR = 365;

/**
 * 1 → "1 dia em atraso"; acima de 1 ano, "Há mais de 1 ano em atraso" (D32); sem a contagem, "Dose atrasada"
 */
export function formatOverdue(days: number | null): string {
  if (days === null) return 'Dose atrasada';
  if (days > DAYS_PER_YEAR) return 'Há mais de 1 ano em atraso';
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
