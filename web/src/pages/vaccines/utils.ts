import type { TargetAudience } from '../../types/vaccination';

export const TARGET_AUDIENCE_LABELS: Record<TargetAudience, string> = {
  CRIANCA: 'Criança',
  ADOLESCENTE: 'Adolescente',
  ADULTO: 'Adulto',
  IDOSO: 'Idoso',
  GESTANTE: 'Gestante',
  ESPECIAL: 'Especial',
};

export const TARGET_AUDIENCE_OPTIONS = (Object.keys(TARGET_AUDIENCE_LABELS) as TargetAudience[]).map((value) => ({
  value,
  label: TARGET_AUDIENCE_LABELS[value],
}));

export function isTargetAudience(value: string | null): value is TargetAudience {
  return value !== null && value in TARGET_AUDIENCE_LABELS;
}

function plural(value: number, singular: string, pluralForm: string): string {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

/**
 * Idade recomendada: 0 → "Ao nascer", 2 → "2 meses", 15 → "1 ano e 3 meses", 48 → "4 anos"
 */
export function formatRecommendedAge(months: number | null): string {
  if (months === null) return '—';
  if (months === 0) return 'Ao nascer';
  if (months < 12) return plural(months, 'mês', 'meses');

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearsLabel = plural(years, 'ano', 'anos');
  return rest === 0 ? yearsLabel : `${yearsLabel} e ${plural(rest, 'mês', 'meses')}`;
}

/**
 * Intervalo desde a dose anterior: 60 → "60 dias". Sem intervalo (1ª dose) → "—"
 */
export function formatInterval(days: number | null): string {
  if (days === null) return '—';
  return plural(days, 'dia', 'dias');
}
