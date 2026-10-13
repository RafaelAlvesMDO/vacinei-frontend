import type { UserRole } from './auth';

// GET /citizens?search=: CPF já vem mascarado pela API. Inclui profissionais de saúde (D11)
export interface CitizenSearchResult {
  id: string;
  name: string;
  birthDate: string | null;
  cpf: string | null;
  role: Exclude<UserRole, 'ADMIN'>;
}
