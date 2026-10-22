import type { ProfessionalCategory } from './professional';

export type UserRole ='PROFISSIONAL_SAUDE' | 'ADMIN' | 'CIDADAO';

export type ProfessionalVerificationStatus = 'PENDENTE' | 'VERIFICADO' | 'RECUSADO';

// Presente apenas para PROFISSIONAL_SAUDE; null para os demais perfis
export interface ProfessionalRegistry {
  isVerified: boolean;
  status: ProfessionalVerificationStatus;
}

// Usuário retornado por POST /auth/login
export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  role: UserRole;
  professionalRegistry: ProfessionalRegistry | null;
}

// LGPD (RNF10): o que fica gravado no aparelho. CPF, celular e nascimento são buscados na API quando necessários
export type StoredUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'professionalRegistry'>;

export interface Dependent {
  id: string;
  name: string;
  birthDate: string;
}

// Perfil completo retornado por GET /auth/me
export interface UserProfile extends User {
  phone: string | null;
  birthDate: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  dependents: Dependent[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Ala do app (D23): o cidadão usa só a ala Cidadão; o profissional alterna entre as duas
export type Ala = 'cidadao' | 'profissional';

// Perfis aceitos no cadastro público (D02)
export type RegisterRole = Extract<UserRole, 'CIDADAO' | 'PROFISSIONAL_SAUDE'>;

// Body do POST /users (RF001, D14). O conselho não é enviado: o backend o deriva da categoria (D12)
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  birthDate: string;
  // Consentimento à Política de Privacidade, obrigatório (D26)
  acceptedPrivacyPolicy: true;
  role: RegisterRole;
  professionalRegistry?: {
    category: ProfessionalCategory;
    registryNumber: string;
    uf: string;
  };
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
}

export interface ApiSuccessResponse<T> {
  status: 'success';
  data: T;
}

export interface ApiMessageResponse {
  status: 'success';
  message: string;
}

// Formato de erros de validação retornado pelo Zod (format()); objetos aninhados repetem o formato
export interface ValidationIssue {
  _errors?: string[];
  [field: string]: ValidationIssue | string[] | undefined;
}

export type ValidationIssues = Record<string, ValidationIssue | undefined>;

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  issues?: ValidationIssues;
}

export interface ParsedApiError {
  status: number | null;
  message: string;
  fieldErrors: Record<string, string>;
}
