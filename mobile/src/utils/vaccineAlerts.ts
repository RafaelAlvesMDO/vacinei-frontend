import type { CardVaccine, PendingDose } from '@/types/vaccination';
import { formatCalendarDate } from './format';
import { getDaysFromDue } from './vaccination';

// Avisos de vacina dentro do app (RF007) e próximas doses (D31), calculados a partir da caderneta. Funções puras.
// As notificações do sistema ficam para a etapa final (D24)

// Próximas doses mostradas com antecedência (D31)
export const REMINDER_DAYS_BEFORE = 7;

export interface OverdueAlert {
  vaccineId: string;
  vaccineName: string;
  doseName: string;
  days: number;
}

export interface AwaitingAlert {
  vaccineId: string;
  vaccineName: string;
  doses: PendingDose[];
}

export interface ReminderAlert {
  vaccineId: string;
  vaccineName: string;
  doseName: string;
  dueDate: string;
  // 0 = hoje
  daysUntil: number;
}

// Avisos de um dia, agregados por vacina (RF007 nota 2)
export interface DailyDigest {
  overdue: OverdueAlert[];
  awaiting: AwaitingAlert[];
  reminders: ReminderAlert[];
}

const byName = (a: { vaccineName: string }, b: { vaccineName: string }) =>
  a.vaccineName.localeCompare(b.vaccineName, 'pt-BR');

/**
 * Avisos de hoje (fuso de Maceió):
 * - atrasada: a próxima dose (sem nenhum registro) venceu; começa no dia seguinte à data prevista (nota 6);
 * - aguardando conferência: doses informadas e não confirmadas. Só a confirmação encerra o alerta (nota 7, D32);
 * - lembrete: a próxima dose vence hoje (as dos próximos dias ficam em `getUpcomingDoses`).
 * Uma vacina atrasada também pode ter doses aguardando conferência (doses diferentes)
 */
export function getTodayNotices(vaccines: CardVaccine[], now = new Date()): DailyDigest {
  const digest: DailyDigest = { overdue: [], awaiting: [], reminders: [] };

  for (const item of vaccines) {
    const base = { vaccineId: item.vaccine.id, vaccineName: item.vaccine.name };

    if (item.alert.pendingDoses.length > 0) digest.awaiting.push({ ...base, doses: item.alert.pendingDoses });

    const fromDue = getDaysFromDue(item.nextDoseDate, now);
    if (!item.nextDose || !item.nextDoseDate || fromDue === null) continue;

    if (fromDue > 0) {
      digest.overdue.push({ ...base, doseName: item.nextDose.doseName, days: fromDue });
    } else if (fromDue === 0) {
      digest.reminders.push({ ...base, doseName: item.nextDose.doseName, dueDate: item.nextDoseDate, daysUntil: 0 });
    }
  }

  digest.overdue.sort((a, b) => b.days - a.days || byName(a, b));
  digest.awaiting.sort(byName);
  digest.reminders.sort(byName);
  return digest;
}

/**
 * Próximas doses dos próximos `withinDays` dias, sem contar hoje (para a Central de notificações)
 */
export function getUpcomingDoses(vaccines: CardVaccine[], now = new Date(), withinDays = REMINDER_DAYS_BEFORE) {
  return vaccines
    .flatMap((item) => {
      const fromDue = getDaysFromDue(item.nextDoseDate, now);
      if (!item.nextDose || !item.nextDoseDate || fromDue === null || fromDue >= 0 || -fromDue > withinDays) return [];
      return [
        {
          vaccineId: item.vaccine.id,
          vaccineName: item.vaccine.name,
          doseName: item.nextDose.doseName,
          dueDate: item.nextDoseDate,
          daysUntil: -fromDue,
        } satisfies ReminderAlert,
      ];
    })
    .sort((a, b) => a.daysUntil - b.daysUntil || byName(a, b));
}

// Vacinas distintas do dia (uma vacina pode estar atrasada e aguardando conferência)
export function getDigestVaccineIds(digest: DailyDigest): string[] {
  return [
    ...new Set([...digest.overdue, ...digest.awaiting, ...digest.reminders].map((alert) => alert.vaccineId)),
  ];
}

export function formatReminderWhen(reminder: Pick<ReminderAlert, 'daysUntil' | 'dueDate'>): string {
  if (reminder.daysUntil === 0) return 'prevista para hoje';
  if (reminder.daysUntil === 1) return 'prevista para amanhã';
  return `prevista para ${formatCalendarDate(reminder.dueDate)} (em ${reminder.daysUntil} dias)`;
}
