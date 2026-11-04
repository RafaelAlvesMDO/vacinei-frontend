import type { BadgeTone, IconName } from '@/components/ui';
import type { Dependent, DependentPayload, Relationship, Sex } from '@/types/dependent';
import type { CardVaccine } from '@/types/vaccination';
import { isValidCpf, formatCpf } from './cpf';
import { getTodayIso, onlyDigits, parseDateInput, toDateInput } from './format';
import { normalizeName, validateFullName } from './name';

// Regras do cadastro de dependentes (D33). Funções puras, usadas pelo formulário e pela lista

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  FILHO: 'Filho(a)',
  PAI_MAE: 'Pai/Mãe',
  CONJUGE: 'Cônjuge',
  CURATELADO: 'Curatelado(a)',
  OUTRO: 'Outro',
};

export const RELATIONSHIPS: Relationship[] = ['FILHO', 'PAI_MAE', 'CONJUGE', 'CURATELADO', 'OUTRO'];

export const SEX_LABELS: Record<Sex, string> = {
  FEMININO: 'Feminino',
  MASCULINO: 'Masculino',
};

export const SEXES: Sex[] = ['FEMININO', 'MASCULINO'];

// ECA: dependente com menos de 18 anos, exceto curatelado (D33)
export const ADULT_AGE = 18;
export const ADULT_RULE_MESSAGE =
  'Dependentes com 18 anos ou mais só podem ser cadastrados com o parentesco Curatelado(a).';

const MIN_BIRTH_YEAR = 1900;

function dateParts(iso: string): [number, number, number] {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return [year, month, day];
}

// Meses completos entre o nascimento e hoje (fuso de Maceió)
function getAgeInMonths(birthDate: string, now = new Date()): number {
  const [by, bm, bd] = dateParts(birthDate);
  const [ty, tm, td] = dateParts(getTodayIso(now));
  return (ty - by) * 12 + (tm - bm) - (td < bd ? 1 : 0);
}

/**
 * "2018-03-18" → "8 anos"; abaixo de 1 ano, em meses ("5 meses", "Menos de 1 mês")
 */
export function formatAge(birthDate: string, now = new Date()): string {
  const months = getAgeInMonths(birthDate, now);
  if (months < 1) return 'Menos de 1 mês';
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

export function isAdult(birthDate: string, now = new Date()): boolean {
  return getAgeInMonths(birthDate, now) >= ADULT_AGE * 12;
}

// "8 anos · Filho(a)"
export function describeDependent(dependent: Pick<Dependent, 'birthDate' | 'relationship'>): string {
  const age = formatAge(dependent.birthDate);
  return dependent.relationship ? `${age} · ${RELATIONSHIP_LABELS[dependent.relationship]}` : age;
}

export interface CardSituation {
  total: number;
  overdue: number;
  awaiting: number;
}

// Situação da caderneta pelo alerta de cada vacina (D32)
export function getCardSituation(vaccines: CardVaccine[]): CardSituation {
  return {
    total: vaccines.length,
    overdue: vaccines.filter((item) => item.alert.status === 'ATRASADA').length,
    awaiting: vaccines.filter((item) => item.alert.status === 'AGUARDANDO_CONFERENCIA').length,
  };
}

export interface SituationBadge {
  label: string;
  tone: BadgeTone;
  icon: IconName;
}

// Atrasadas e aguardando conferência à parte; sem pendências, "Em dia" (ou "Sem vacinas")
export function getSituationBadges({ total, overdue, awaiting }: CardSituation): SituationBadge[] {
  const badges: SituationBadge[] = [];
  if (overdue > 0) {
    badges.push({
      label: `${overdue} ${overdue === 1 ? 'atrasada' : 'atrasadas'}`,
      tone: 'danger',
      icon: 'alert-circle-outline',
    });
  }
  if (awaiting > 0) {
    badges.push({ label: `${awaiting} aguardando conferência`, tone: 'warning', icon: 'time-outline' });
  }
  if (badges.length > 0) return badges;
  if (total === 0) return [{ label: 'Sem vacinas', tone: 'neutral', icon: 'book-outline' }];
  return [{ label: 'Em dia', tone: 'primary', icon: 'checkmark-circle-outline' }];
}

export function formatVaccineCount(total: number): string {
  return `${total} ${total === 1 ? 'vacina' : 'vacinas'}`;
}

// Formulário de cadastro e edição
export interface DependentFormValues {
  name: string;
  // DD/MM/AAAA
  birthDate: string;
  sex: Sex | null;
  // Com máscara; vazio = sem CPF
  cpf: string;
  relationship: Relationship | null;
}

export type DependentField = keyof DependentFormValues;
export type DependentFormErrors = Partial<Record<DependentField, string>>;

export const EMPTY_DEPENDENT_FORM: DependentFormValues = {
  name: '',
  birthDate: '',
  sex: null,
  cpf: '',
  relationship: null,
};

export function toDependentForm(dependent: Dependent): DependentFormValues {
  return {
    name: dependent.name,
    birthDate: toDateInput(dependent.birthDate),
    sex: dependent.sex,
    cpf: dependent.cpf ? formatCpf(dependent.cpf) : '',
    relationship: dependent.relationship,
  };
}

/**
 * Valida o formulário. Na edição (`initial`), a regra de idade só vale se o nascimento ou o parentesco
 * mudarem, como na API: quem completou 18 anos depois do cadastro continua editável
 */
export function validateDependentForm(
  values: DependentFormValues,
  initial?: Dependent | null,
  now = new Date(),
): DependentFormErrors {
  const errors: DependentFormErrors = {};

  if (!normalizeName(values.name)) errors.name = 'Informe o nome completo do dependente.';
  else {
    const nameError = validateFullName(values.name);
    if (nameError) errors.name = nameError;
  }

  const birthDate = parseDateInput(values.birthDate);
  if (!values.birthDate) errors.birthDate = 'Informe a data de nascimento.';
  else if (!birthDate || Number(birthDate.slice(0, 4)) < MIN_BIRTH_YEAR)
    errors.birthDate = 'Informe uma data válida no formato DD/MM/AAAA.';
  else if (birthDate > getTodayIso(now)) errors.birthDate = 'A data de nascimento não pode ser futura.';

  if (!values.sex) errors.sex = 'Selecione o sexo.';

  if (values.cpf && !isValidCpf(values.cpf)) errors.cpf = 'CPF inválido. Confira os números.';

  if (!values.relationship) errors.relationship = 'Selecione o parentesco.';

  if (birthDate && !errors.birthDate && values.relationship && values.relationship !== 'CURATELADO') {
    const changed =
      !initial || birthDate !== initial.birthDate.slice(0, 10) || values.relationship !== initial.relationship;
    if (changed && isAdult(birthDate, now)) errors.relationship = ADULT_RULE_MESSAGE;
  }

  return errors;
}

// Chamar só depois de validar
export function toDependentPayload(values: DependentFormValues): DependentPayload {
  const cpf = onlyDigits(values.cpf);
  return {
    name: normalizeName(values.name),
    birthDate: parseDateInput(values.birthDate) ?? '',
    sex: values.sex ?? 'FEMININO',
    cpf: cpf || null,
    relationship: values.relationship ?? 'OUTRO',
  };
}
