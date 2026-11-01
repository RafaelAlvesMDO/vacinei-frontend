import type { UserRole } from './auth';

// Responsável por um dependente (D33): o dependente é um cidadão sem login ligado a um titular
export interface CitizenResponsible {
  id: string;
  name: string;
}

// GET /citizens?search=: CPF já vem mascarado pela API. Inclui profissionais de saúde (D11) e dependentes (D33).
// Dependente pode não ter CPF; buscar pelo CPF do responsável também lista os dependentes dele
export interface CitizenSearchResult {
  id: string;
  name: string;
  birthDate: string | null;
  cpf: string | null;
  role: Exclude<UserRole, 'ADMIN'>;
  responsible: CitizenResponsible | null;
}
