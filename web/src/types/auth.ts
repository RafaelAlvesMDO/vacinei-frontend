export type UserRole = 'PROFISSIONAL_SAUDE' | 'ADMIN' | 'CIDADAO';

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

// Resposta do PATCH /auth/me
export interface UpdatedOwnProfile {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  birthDate: string | null;
  role: UserRole;
  avatarUrl: string | null;
  updatedAt: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
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

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
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
