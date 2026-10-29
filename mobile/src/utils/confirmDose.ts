import type { CardVaccine, CatalogVaccine } from '@/types/vaccination';
import { getDaysFromDue } from './vaccination';
import { LOTE_MAX_LENGTH } from './vaccineRecord';

// Na confirmação o lote é obrigatório: de 1 a 20 letras e números (salvo em maiúsculas)
const LOTE_PATTERN = new RegExp(`^[A-Z0-9]{1,${LOTE_MAX_LENGTH}}$`);

export const INACTIVE_VACCINE_MESSAGE =
  'Esta vacina foi desativada no catálogo e não aceita novas confirmações. Os registros já existentes continuam na caderneta.';

// Situação de cada dose na caderneta: CONFIRMADO bloqueia a dose; PENDENTE = registro do cidadão a conferir
export type DoseRecordStatus = 'CONFIRMADO' | 'PENDENTE';

export function getDoseStatuses(cardVaccines: CardVaccine[]): Map<string, DoseRecordStatus> {
  const map = new Map<string, DoseRecordStatus>();
  for (const item of cardVaccines) {
    for (const record of item.records) {
      if (record.status === 'CONFIRMADO') map.set(record.dose.id, 'CONFIRMADO');
      else if (!map.has(record.dose.id)) map.set(record.dose.id, 'PENDENTE');
    }
  }
  return map;
}

/**
 * Dose sugerida (RF010 nota 3): a próxima prevista na caderneta ou a primeira ainda não confirmada
 */
export function suggestConfirmDose(
  vaccine: CatalogVaccine | undefined,
  cardVaccine: CardVaccine | undefined,
  statuses: Map<string, DoseRecordStatus>,
): string | null {
  const next = cardVaccine?.nextDose?.id;
  if (next && statuses.get(next) !== 'CONFIRMADO') return next;
  return vaccine?.doses.find((dose) => statuses.get(dose.id) !== 'CONFIRMADO')?.id ?? null;
}

/**
 * Vacinas pendentes na caderneta (atrasadas, aguardando conferência ou em dia com próxima dose) primeiro,
 * depois as demais, por nome (RF010 nota 2)
 */
export function splitCatalog(
  catalog: CatalogVaccine[],
  cardVaccines: CardVaccine[],
): { pending: CatalogVaccine[]; others: CatalogVaccine[] } {
  const byId = new Map(cardVaccines.map((item) => [item.vaccine.id, item]));
  const sorted = [...catalog].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const isPending = (vaccine: CatalogVaccine) => {
    const item = byId.get(vaccine.id);
    return !!item && item.alert.status !== 'COMPLETA';
  };
  return { pending: sorted.filter(isPending), others: sorted.filter((vaccine) => !isPending(vaccine)) };
}

/**
 * Data prevista da dose, quando ela é a próxima do esquema e ainda não chegou: aviso, sem bloqueio
 */
export function getEarlyDoseDate(cardVaccine: CardVaccine | undefined, doseId: string | null): string | null {
  if (!cardVaccine?.nextDose || cardVaccine.nextDose.id !== doseId || !cardVaccine.nextDoseDate) return null;
  const days = getDaysFromDue(cardVaccine.nextDoseDate);
  return days !== null && days < 0 ? cardVaccine.nextDoseDate : null;
}

export function validateConfirmLote(lote: string): string | null {
  if (!lote) return 'Informe o lote da vacina.';
  if (!LOTE_PATTERN.test(lote)) return 'Use só letras e números, sem espaços ou símbolos.';
  return null;
}

/**
 * Idade em anos completos a partir do nascimento (data sem horário, lida em UTC)
 */
export function getAge(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const [year, month, day] = now.toLocaleDateString('en-CA', { timeZone: 'America/Maceio' }).split('-').map(Number);
  let age = year - birth.getUTCFullYear();
  if (month - 1 < birth.getUTCMonth() || (month - 1 === birth.getUTCMonth() && day < birth.getUTCDate())) age -= 1;
  return age;
}
