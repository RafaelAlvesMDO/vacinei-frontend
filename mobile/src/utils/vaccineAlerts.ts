import type { CardVaccine, PendingDose } from '@/types/vaccination';
import { formatCalendarDate } from './format';
import { AWAITING_MESSAGE, formatOverdue, formatPendingDoses, getDaysFromDue } from './vaccination';

// Avisos de vacina (RF007) e lembretes antecipados (D31), calculados a partir da caderneta. Funções puras,
// usadas dentro do app (Início e Central) e nas notificações do sistema do build instalável (D36)

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

const byName = (a: { vaccineName: string }, b: { vaccineName: string }) =>
  a.vaccineName.localeCompare(b.vaccineName, 'pt-BR');

/**
 * Avisos do dia `day` (fuso de Maceió):
 * - atrasada: a próxima dose (sem nenhum registro) venceu; começa no dia seguinte à data prevista (nota 6);
 * - aguardando conferência: doses informadas e não confirmadas. Só a confirmação encerra o alerta (nota 7, D32);
 * - lembrete: a próxima dose vence num dos dias de `reminderDays` antes da data (0 = no dia).
 * Uma vacina atrasada também pode ter doses aguardando conferência (doses diferentes)
 */
function collectNotices(
  vaccines: CardVaccine[],
  day: Date,
  preferences: AlertPreferences,
  reminderDays: number[],
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
    } else if (preferences.reminders && reminderDays.includes(-fromDue)) {
      // fromDue <= 0 aqui; Math.abs evita o -0 no dia da data
      digest.reminders.push({
        ...base,
        doseName: item.nextDose.doseName,
        dueDate: item.nextDoseDate,
        daysUntil: Math.abs(fromDue),
      });
    }
  }

  digest.overdue.sort((a, b) => b.days - a.days || byName(a, b));
  digest.awaiting.sort(byName);
  digest.reminders.sort((a, b) => a.daysUntil - b.daysUntil || byName(a, b));
  return digest;
}

/**
 * Avisos de hoje dentro do app: atrasadas, aguardando conferência e a dose prevista para hoje (as dos
 * próximos dias ficam em `getUpcomingDoses`). Não dependem das preferências de notificação
 */
export function getTodayNotices(vaccines: CardVaccine[], now = new Date()): DailyDigest {
  return collectNotices(vaccines, now, ALL_ALERTS, [0]);
}

/**
 * Avisos da notificação consolidada do dia `day` (D31, D36): os alertas e os lembretes de 7 dias antes e
 * do dia, conforme as preferências do Perfil
 */
export function buildDailyDigest(
  vaccines: CardVaccine[],
  day: Date,
  preferences: AlertPreferences = ALL_ALERTS,
): DailyDigest {
  return collectNotices(vaccines, day, preferences, [0, REMINDER_DAYS_BEFORE]);
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

// "18 dias" ou "mais de 1 ano", para a lista da notificação consolidada
function formatShortOverdue(days: number): string {
  return formatOverdue(days).replace(' em atraso', '').replace('Há mais', 'mais');
}

/**
 * De quem é a caderneta da notificação (D33, D36) e as rotas abertas ao tocar (RF007 nota 4)
 */
export interface DigestTarget {
  // null para o titular; o primeiro nome do dependente, que vai no título
  personName: string | null;
  vaccineUrl: (vaccineId: string) => string;
  cardUrl: (filter: 'ATRASADA' | 'AGUARDANDO_CONFERENCIA' | null) => string;
}

export const SELF_TARGET: DigestTarget = {
  personName: null,
  vaccineUrl: (vaccineId) => `/cidadao/vacina/${vaccineId}`,
  cardUrl: (filter) => (filter ? `/cidadao/caderneta?filtro=${filter}` : '/cidadao/caderneta'),
};

export function getDependentTarget(dependentId: string, firstName: string): DigestTarget {
  const base = `/cidadao/dependentes/${dependentId}`;
  return {
    personName: firstName,
    vaccineUrl: (vaccineId) => `${base}/vacina/${vaccineId}`,
    cardUrl: (filter) => (filter ? `${base}/caderneta?filtro=${filter}` : `${base}/caderneta`),
  };
}

export interface DigestNotification {
  title: string;
  body: string;
  // Rota aberta ao tocar (nota 4): o detalhe da vacina, ou a caderneta da pessoa quando há várias
  url: string;
}

/**
 * Texto da notificação consolidada do dia de uma pessoa (nota 8, D36). null quando não há aviso.
 * Para um dependente, o nome dele abre o título
 */
export function formatDigestNotification(
  digest: DailyDigest,
  target: DigestTarget = SELF_TARGET,
): DigestNotification | null {
  const vaccineIds = getDigestVaccineIds(digest);
  if (vaccineIds.length === 0) return null;

  const prefix = target.personName ? `${target.personName} · ` : '';
  const cardOwner = target.personName ? 'a caderneta' : 'sua caderneta';

  if (vaccineIds.length === 1) {
    const url = target.vaccineUrl(vaccineIds[0]);
    const [overdue] = digest.overdue;
    const [awaiting] = digest.awaiting;
    const [reminder] = digest.reminders;

    if (overdue) {
      const extra = awaiting ? ` Aguardando conferência: ${formatPendingDoses(awaiting.doses)}.` : '';
      return {
        title: `${prefix}${overdue.vaccineName}: dose em atraso`,
        body: `${overdue.doseName} · ${formatOverdue(overdue.days)}. Toque para ver a vacina.${extra}`,
        url,
      };
    }
    if (awaiting) {
      const message = target.personName ? AWAITING_MESSAGE.replace('sua caderneta', 'a caderneta') : AWAITING_MESSAGE;
      return {
        title: `${prefix}${awaiting.vaccineName}: aguardando conferência`,
        body: `${message}: ${formatPendingDoses(awaiting.doses)}.`,
        url,
      };
    }
    return {
      title: `${prefix}Lembrete: ${reminder.vaccineName}`,
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
      `Aguardando conferência: ${digest.awaiting.map((alert) => alert.vaccineName).join(', ')}. Leve ${cardOwner} à UBS.`,
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
    title: target.personName
      ? `${target.personName}: ${vaccineIds.length} vacinas precisam de atenção`
      : `${vaccineIds.length} vacinas precisam da sua atenção`,
    body: lines.join('\n'),
    url: target.cardUrl(filter),
  };
}
