import type { UserRole } from './auth';

// Responsável de um dependente (D33). Titulares vêm com `responsible: null`
export interface CitizenResponsible {
  id: string;
  name: string;
}

// GET /citizens: CPF mascarado ("***.123.456-**"). O profissional também aparece, porque tem caderneta (D11).
// Dependentes (D33) vêm com o responsável; sem CPF, `cpf: null`
export interface CitizenSearchResult {
  id: string;
  name: string;
  birthDate: string | null;
  cpf: string | null;
  role: Extract<UserRole, 'CIDADAO' | 'PROFISSIONAL_SAUDE'>;
  responsible: CitizenResponsible | null;
}
