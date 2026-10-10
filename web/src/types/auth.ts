export type UserRole = 'PROFISSIONAL_SAUDE' | 'ADMIN' | 'CIDADAO';

export interface ProfessionalRegistry {
  id: string;
  councilType: string;
  councilNumber: string;
  councilState: string;
  occupation: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
  avatarUrl?: string | null;
  professionalRegistry?: ProfessionalRegistry | null;
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

export interface ApiSuccessResponse<T> {
  status: 'success';
  data: T;
}

export interface RequestAccessResponse {
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

// Formato de erros de validação retornado pelo Zod (format())
export type ValidationIssues = Record<string, { _errors?: string[] } | undefined>;

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
