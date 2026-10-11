import type { UserRole } from '../types/auth';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  PROFISSIONAL_SAUDE: 'Profissional de Saúde',
  CIDADAO: 'Cidadão',
};
