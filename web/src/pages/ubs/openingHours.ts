// Horário de funcionamento em faixas: "Seg a Sex: 07:00 às 17:00 · Sáb: 07:00 às 14:00"

export const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;

export interface OpeningSlot {
  id: string;
  // Índices de WEEKDAYS (0 = segunda)
  days: number[];
  // "HH:MM"
  opensAt: string;
  closesAt: string;
}

const SLOT_SEPARATOR = ' · ';
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const SLOT_REGEX = /^(.+): (\d{2}:\d{2}) às (\d{2}:\d{2})$/;
const TIME_RANGE_REGEX = /(\d{2}:\d{2}) às (\d{2}:\d{2})/;

let nextSlotId = 0;

export function isValidTime(value: string): boolean {
  return TIME_REGEX.test(value);
}

export function createSlot(slot: Partial<Omit<OpeningSlot, 'id'>> = {}): OpeningSlot {
  nextSlotId += 1;
  return { id: `slot-${nextSlotId}`, days: [], opensAt: '', closesAt: '', ...slot };
}

/**
 * Dias consecutivos viram intervalo ("Seg a Sex") e os soltos são separados por vírgula ("Seg, Qua")
 */
export function formatDays(days: number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const groups: string[] = [];

  let start = 0;
  while (start < sorted.length) {
    let end = start;
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1) end += 1;

    if (end - start >= 2) {
      groups.push(`${WEEKDAYS[sorted[start]]} a ${WEEKDAYS[sorted[end]]}`);
    } else {
      for (let index = start; index <= end; index += 1) groups.push(WEEKDAYS[sorted[index]]);
    }
    start = end + 1;
  }

  return groups.join(', ');
}

/**
 * Texto salvo na API, com as faixas na ordem do primeiro dia
 */
export function formatOpeningHours(slots: OpeningSlot[]): string {
  return [...slots]
    .sort((a, b) => Math.min(...a.days) - Math.min(...b.days))
    .map((slot) => `${formatDays(slot.days)}: ${slot.opensAt} às ${slot.closesAt}`)
    .join(SLOT_SEPARATOR);
}

/**
 * Faixas do texto salvo, uma por linha na exibição. Textos antigos voltam como uma linha só
 */
export function splitOpeningHours(text: string): string[] {
  return text
    .split(SLOT_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseDays(text: string): number[] | null {
  const days: number[] = [];
  for (const group of text.split(', ')) {
    const [first, last, ...rest] = group.split(' a ');
    if (rest.length > 0) return null;

    const startIndex = WEEKDAYS.indexOf(first as (typeof WEEKDAYS)[number]);
    const endIndex = last === undefined ? startIndex : WEEKDAYS.indexOf(last as (typeof WEEKDAYS)[number]);
    if (startIndex < 0 || endIndex < startIndex) return null;

    for (let day = startIndex; day <= endIndex; day += 1) days.push(day);
  }
  return days;
}

/**
 * Lê o texto salvo de volta em faixas. Retorna null se ele não seguir exatamente o
 * padrão gerado por formatOpeningHours (ex.: horários antigos sem os dias)
 */
export function parseOpeningHours(text: string): OpeningSlot[] | null {
  if (!text.trim()) return null;

  const slots: OpeningSlot[] = [];
  for (const part of text.split(SLOT_SEPARATOR)) {
    const match = SLOT_REGEX.exec(part);
    if (!match) return null;

    const days = parseDays(match[1]);
    const [, , opensAt, closesAt] = match;
    if (!days || !TIME_REGEX.test(opensAt) || !TIME_REGEX.test(closesAt) || closesAt <= opensAt) return null;

    slots.push(createSlot({ days, opensAt, closesAt }));
  }

  const allDays = slots.flatMap((slot) => slot.days);
  if (new Set(allDays).size !== allDays.length) return null;

  // Só aceita o texto se ele for exatamente o que o formulário geraria
  return formatOpeningHours(slots) === text ? slots : null;
}

/**
 * Faixa inicial para um horário antigo: aproveita "07:00 às 17:00", mas os dias ficam em branco
 */
export function slotFromLegacy(text: string): OpeningSlot {
  const match = TIME_RANGE_REGEX.exec(text);
  return createSlot(match ? { opensAt: match[1], closesAt: match[2] } : {});
}

/**
 * Erro de cada faixa, pelo id. Vazio quando todas são válidas
 */
export function validateSlots(slots: OpeningSlot[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const seenDays = new Set<number>();

  for (const slot of slots) {
    if (slot.days.length === 0) {
      errors[slot.id] = 'Selecione ao menos um dia.';
    } else if (slot.days.some((day) => seenDays.has(day))) {
      errors[slot.id] = 'Um dia não pode estar em duas faixas.';
    } else if (!TIME_REGEX.test(slot.opensAt) || !TIME_REGEX.test(slot.closesAt)) {
      errors[slot.id] = 'Informe os horários de abertura e fechamento.';
    } else if (slot.closesAt <= slot.opensAt) {
      errors[slot.id] = 'O fechamento precisa ser depois da abertura.';
    }
    for (const day of slot.days) seenDays.add(day);
  }

  return errors;
}
