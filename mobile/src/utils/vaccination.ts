import type { BadgeTone, IconName } from '@/components/ui';
import type { CardRecord, CardVaccine, VaccineScheduleStatus } from '@/types/vaccination';
import { normalizeSearch } from './format';

// Caderneta sem vacinas. Digitalização (etapa 8) e cadastro manual (etapa 5) ainda não existem
export const EMPTY_CARD_MESSAGE =
  'Você ainda não tem vacinas registradas. Em breve você poderá digitalizar sua caderneta ou cadastrar manualmente.';

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
export function getRecordBadge(record: CardRecord): { label: string; tone: BadgeTone; icon: IconName } {
  if (record.status === 'CONFIRMADO') return { label: 'Confirmado', tone: 'primary', icon: 'checkmark-circle-outline' };
  return { label: 'Aguardando confirmação', tone: 'warning', icon: 'time-outline' };
}

// Registro da última dose aplicada, para mostrar a origem na lista
export function getLastRecord(item: CardVaccine): CardRecord | null {
  if (!item.lastDose) return null;
  const lastDoseId = item.lastDose.id;
  return item.records.find((record) => record.dose.id === lastDoseId) ?? null;
}

// Registros da dose mais recente para a mais antiga
export function sortRecords(records: CardRecord[]): CardRecord[] {
  return [...records].sort((a, b) => b.dose.doseNumber - a.dose.doseNumber);
}
