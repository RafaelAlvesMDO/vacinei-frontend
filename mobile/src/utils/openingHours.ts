// Horário de funcionamento no padrão da API: "Seg a Sex: 07:00 às 17:00 · Sáb: 07:00 às 14:00"

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
const WEEKDAY_NAMES = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'] as const;

const SLOT_SEPARATOR = ' · ';
const SLOT_REGEX = /^(.+): ([01]\d|2[0-3]):([0-5]\d) às ([01]\d|2[0-3]):([0-5]\d)$/;

// Maceió fica em UTC-3, sem horário de verão
const MACEIO_OFFSET_MS = -3 * 60 * 60 * 1000;

interface OpeningSlot {
  // Índices de WEEKDAYS (0 = segunda)
  days: number[];
  // Minutos desde a meia-noite
  opensAt: number;
  closesAt: number;
}

export interface OpeningStatus {
  isOpen: boolean;
  label: string;
}

/**
 * Faixas do texto, uma por linha na exibição. Textos fora do padrão voltam como uma linha só
 */
export function splitOpeningHours(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(SLOT_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

function weekdayIndex(name: string): number {
  return WEEKDAYS.indexOf(name as (typeof WEEKDAYS)[number]);
}

// "Seg a Sex, Dom" → [0, 1, 2, 3, 4, 6]; null fora do padrão
function parseDays(text: string): number[] | null {
  const days: number[] = [];
  for (const group of text.split(', ')) {
    const [first, last, ...rest] = group.split(' a ');
    if (rest.length > 0) return null;
    const start = weekdayIndex(first);
    const end = last === undefined ? start : weekdayIndex(last);
    if (start < 0 || end < start) return null;
    for (let day = start; day <= end; day += 1) days.push(day);
  }
  return days;
}

/**
 * Faixas estruturadas, ou null se o texto não seguir o padrão (ex.: "07:00 às 17:00", sem os dias)
 */
export function parseOpeningHours(text: string | null): OpeningSlot[] | null {
  const parts = splitOpeningHours(text);
  if (parts.length === 0) return null;

  const slots: OpeningSlot[] = [];
  for (const part of parts) {
    const match = SLOT_REGEX.exec(part);
    if (!match) return null;
    const days = parseDays(match[1]);
    const opensAt = Number(match[2]) * 60 + Number(match[3]);
    const closesAt = Number(match[4]) * 60 + Number(match[5]);
    if (!days || closesAt <= opensAt) return null;
    slots.push({ days, opensAt, closesAt });
  }
  return slots;
}

// 420 → "7h"; 450 → "7h30"
function formatHour(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`;
}

// Dia da semana (0 = segunda) e minutos desde a meia-noite em Maceió
function nowInMaceio(now: Date): { weekday: number; minutes: number } {
  const local = new Date(now.getTime() + MACEIO_OFFSET_MS);
  return {
    weekday: (local.getUTCDay() + 6) % 7,
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

function slotOn(slots: OpeningSlot[], weekday: number): OpeningSlot | undefined {
  return slots.find((slot) => slot.days.includes(weekday));
}

// Próxima abertura depois de hoje: "abre amanhã às 7h" ou "abre segunda às 7h"
function nextOpening(slots: OpeningSlot[], weekday: number): string | null {
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (weekday + offset) % 7;
    const slot = slotOn(slots, day);
    if (slot) {
      const when = offset === 1 ? 'amanhã' : WEEKDAY_NAMES[day];
      return `abre ${when} às ${formatHour(slot.opensAt)}`;
    }
  }
  return null;
}

/**
 * Status do dia no fuso de Maceió: "Aberto agora · até 17h", "Fechado · abre amanhã às 7h"
 * ou "Fechado hoje". null quando o texto não segue o padrão (a tela mostra só as faixas)
 */
export function getOpeningStatus(text: string | null, now = new Date()): OpeningStatus | null {
  const slots = parseOpeningHours(text);
  if (!slots) return null;

  const { weekday, minutes } = nowInMaceio(now);
  const today = slotOn(slots, weekday);

  if (!today) return { isOpen: false, label: 'Fechado hoje' };
  if (minutes >= today.opensAt && minutes < today.closesAt) {
    return { isOpen: true, label: `Aberto agora · até ${formatHour(today.closesAt)}` };
  }
  if (minutes < today.opensAt) {
    return { isOpen: false, label: `Fechado · abre hoje às ${formatHour(today.opensAt)}` };
  }
  const next = nextOpening(slots, weekday);
  return { isOpen: false, label: next ? `Fechado · ${next}` : 'Fechado' };
}

/**
 * Linha de horário dos cartões: o status do dia ou, fora do padrão, só as faixas (uma por linha).
 * `isOpen` é null quando não há status
 */
export function getHoursSummary(text: string | null, now = new Date()): { text: string; isOpen: boolean | null } {
  const status = getOpeningStatus(text, now);
  if (status) return { text: status.label, isOpen: status.isOpen };
  const lines = splitOpeningHours(text);
  return { text: lines.length > 0 ? lines.join('\n') : 'Horário não informado', isOpen: null };
}
