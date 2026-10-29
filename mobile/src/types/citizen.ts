import type { UserRole } from './auth';

// GET /citizens: CPF mascarado ("***.123.456-**"). O profissional também aparece, porque tem caderneta (D11)
export interface CitizenSearchResult {
  id: string;
  name: string;
  birthDate: string | null;
  cpf: string | null;
  role: Extract<UserRole, 'CIDADAO' | 'PROFISSIONAL_SAUDE'>;
}
