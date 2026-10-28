import type { CardVaccine, PendingDose } from '@/types/vaccination';
import { formatCalendarDate } from './format';
import { AWAITING_MESSAGE, formatOverdue, formatPendingDoses, getDaysFromDue } from './vaccination';

// Alertas de vacina (RF007) e lembretes antecipados (D31), calculados a partir da caderneta. Funções puras

export interface AlertPreferences {
  // Doses atrasadas e aguardando conferência (RF007)
  alerts: boolean;
  // 7 dias antes e no dia da data prevista (D31)
  reminders: boolean;
}

export const ALL_ALERTS: AlertPreferences = { alerts: true, reminders: true };

// Lembrete antecipado (D31): 7 dias antes e no dia da data prevista
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
  // 0 = hoje; REMINDER_DAYS_BEFORE = daqui a 7 dias
  daysUntil: number;
}

// Avisos de um dia, agregados por vacina (RF007 nota 2)
export interface DailyDigest {
  overdue: OverdueAlert[];
  awaiting: AwaitingAlert[];
  reminders: ReminderAlert[];
}

/**
 * Avisos do dia `day` (fuso de Maceió):
 * - atrasada: a próxima dose (sem nenhum registro) venceu; começa no dia seguinte à data prevista (nota 6);
 * - aguardando conferência: doses informadas e não confirmadas. Só a confirmação encerra o alerta (nota 7, D32);
 * - lembrete: a próxima dose vence hoje ou daqui a 7 dias (D31).
 * Uma vacina atrasada também pode ter doses aguardando conferência (doses diferentes)
 */
export function buildDailyDigest(
  vaccines: CardVaccine[],
  day: Date,
  preferences: AlertPreferences = ALL_ALERTS,
): DailyDigest {
  const digest: DailyDigest = { overdue: [], awaiting: [], reminders: [] };

  for (const item of vaccines) {
    const base = { vaccineId: item.vaccine.id, vaccineName: item.vaccine.name };

    if (preferences.alerts && item.alert.pendingDoses.length > 0) {
      digest.awaiting.push({ ...base, doses: item.alert.pendingDoses });
    }

    const fromDue = getDaysFromDue(item.nextDoseDate, day);
    if (!item.nextDose || !item.nextDoseDate || fromDue === null) continue;

    if (fromDue > 0) {
      if (preferences.alerts) digest.overdue.push({ ...base, doseName: item.nextDose.doseName, days: fromDue });
    } else if (preferences.reminders && (fromDue === 0 || fromDue === -REMINDER_DAYS_BEFORE)) {
      digest.reminders.push({
        ...base,
        doseName: item.nextDose.doseName,
        dueDate: item.nextDoseDate,
        daysUntil: -fromDue,
      });
    }
  }

  const byName = (a: { vaccineName: string }, b: { vaccineName: string }) =>
    a.vaccineName.localeCompare(b.vaccineName, 'pt-BR');
  digest.overdue.sort((a, b) => b.days - a.days || byName(a, b));
  digest.awaiting.sort(byName);
  digest.reminders.sort((a, b) => a.daysUntil - b.daysUntil || byName(a, b));
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
    .sort((a, b) => a.daysUntil - b.daysUntil || a.vaccineName.localeCompare(b.vaccineName, 'pt-BR'));
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

// "18 dias" ou "mais de 1 ano", para a lista da notificação consolidada
function formatShortOverdue(days: number): string {
  return formatOverdue(days).replace(' em atraso', '').replace('Há mais', 'mais');
}

export interface DigestNotification {
  title: string;
  body: string;
  // Rota aberta ao tocar (nota 4): o detalhe da vacina, ou a caderneta quando há várias
  url: string;
}

/**
 * Texto da notificação consolidada do dia (nota 8). null quando não há aviso
 */
export function formatDigestNotification(digest: DailyDigest): DigestNotification | null {
  const vaccineIds = getDigestVaccineIds(digest);
  if (vaccineIds.length === 0) return null;

  if (vaccineIds.length === 1) {
    const url = `/cidadao/vacina/${vaccineIds[0]}`;
    const [overdue] = digest.overdue;
    const [awaiting] = digest.awaiting;
    const [reminder] = digest.reminders;

    if (overdue) {
      const extra = awaiting ? ` Aguardando conferência: ${formatPendingDoses(awaiting.doses)}.` : '';
      return {
        title: `${overdue.vaccineName}: dose em atraso`,
        body: `${overdue.doseName} · ${formatOverdue(overdue.days)}. Toque para registrar a nova dose.${extra}`,
        url,
      };
    }
    if (awaiting) {
      return {
        title: `${awaiting.vaccineName}: aguardando conferência`,
        body: `${AWAITING_MESSAGE}: ${formatPendingDoses(awaiting.doses)}.`,
        url,
      };
    }
    return {
      title: `Lembrete: ${reminder.vaccineName}`,
      body: `${reminder.doseName} ${formatReminderWhen(reminder)}. Procure uma UBS para não atrasar.`,
      url,
    };
  }

  const lines: string[] = [];
  if (digest.overdue.length > 0) {
    lines.push(
      `Em atraso: ${digest.overdue
        // Separado por "·", sem parênteses: os nomes já trazem os seus ("Tríplice Viral (SCR) · 2ª Dose · 86 dias")
        .map((alert) => `${alert.vaccineName} · ${alert.doseName} · ${formatShortOverdue(alert.days)}`)
        .join('; ')}.`,
    );
  }
  if (digest.awaiting.length > 0) {
    lines.push(
      `Aguardando conferência: ${digest.awaiting.map((alert) => alert.vaccineName).join(', ')}. Leve sua caderneta à UBS.`,
    );
  }
  if (digest.reminders.length > 0) {
    lines.push(
      `Lembrete: ${digest.reminders
        .map((alert) => `${alert.vaccineName} ${alert.daysUntil === 0 ? 'hoje' : `em ${alert.daysUntil} dias`}`)
        .join(', ')}.`,
    );
  }

  const filter =
    digest.overdue.length > 0 ? 'ATRASADA' : digest.awaiting.length > 0 ? 'AGUARDANDO_CONFERENCIA' : null;
  return {
    title: `${vaccineIds.length} vacinas precisam da sua atenção`,
    body: lines.join('\n'),
    url: filter ? `/cidadao/caderneta?filtro=${filter}` : '/cidadao/caderneta',
  };
}
