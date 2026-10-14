import type { BadgeVariant } from '../../components/ui/Badge';
import type { ProfessionalVerificationStatus, UserRole } from '../../types/auth';
import type { UserProfessionalRegistry } from '../../types/user';
import { PROFESSIONAL_CATEGORIES } from '../../utils/councils';

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'CIDADAO', label: 'Cidadão' },
  { value: 'PROFISSIONAL_SAUDE', label: 'Profissional' },
  { value: 'ADMIN', label: 'Administrador' },
];

export const ROLE_BADGE_VARIANTS: Record<UserRole, BadgeVariant> = {
  CIDADAO: 'neutral',
  PROFISSIONAL_SAUDE: 'accent',
  ADMIN: 'primary',
};

export function isUserRole(value: string | null): value is UserRole {
  return ROLE_OPTIONS.some((option) => option.value === value);
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function getCategoryLabel(category: string): string {
  return PROFESSIONAL_CATEGORIES.find((option) => option.value === category)?.label ?? category;
}

/**
 * O GET /users não traz o `verificationStatus`: verificado vence, depois a recusa registrada
 */
export function getVerificationStatus(registry: UserProfessionalRegistry): ProfessionalVerificationStatus {
  if (registry.isVerified) return 'VERIFICADO';
  if (registry.rejectedAt) return 'RECUSADO';
  return 'PENDENTE';
}

export const VERIFICATION_DISPLAY: Record<
  ProfessionalVerificationStatus,
  { label: string; variant: BadgeVariant; filter: string }
> = {
  PENDENTE: { label: 'Verificação pendente', variant: 'warning', filter: 'pendentes' },
  VERIFICADO: { label: 'Verificado', variant: 'success', filter: 'verificados' },
  RECUSADO: { label: 'Recusado', variant: 'danger', filter: 'recusados' },
};
