import type { Ala, ProfessionalVerificationStatus, UserRole } from '@/types/auth';

export const ROLE_LABELS: Record<UserRole, string> = {
  CIDADAO: 'Cidadão',
  PROFISSIONAL_SAUDE: 'Profissional de saúde',
  ADMIN: 'Administrador',
};

export const ALA_LABELS: Record<Ala, string> = {
  cidadao: 'Ala Cidadão',
  profissional: 'Ala Profissional',
};

export const VERIFICATION_LABELS: Record<ProfessionalVerificationStatus, string> = {
  PENDENTE: 'Verificação pendente',
  VERIFICADO: 'Registro verificado',
  RECUSADO: 'Registro recusado',
};

/**
 * "Mariana Costa" → "Mariana"
 */
export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/**
 * "Mariana Costa" → "MC"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}
