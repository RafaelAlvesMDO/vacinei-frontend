import { isAxiosError } from 'axios';
import { api } from './api';
import { clearSession } from './tokenStorage';
import type {
  ApiErrorResponse,
  ApiMessageResponse,
  ApiSuccessResponse,
  AuthResponse,
  LoginCredentials,
  ParsedApiError,
  RegisterPayload,
  ResetPasswordPayload,
  UserProfile,
  ValidationIssue,
} from '@/types/auth';

/**
 * Autentica o usuário via POST /auth/login. Quem grava a sessão é o AuthContext,
 * depois de conferir se o perfil pode usar o app (ADMIN não pode, D23)
 */
export async function authenticate({ email, password }: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<ApiSuccessResponse<AuthResponse>>('/auth/login', {
    email: email.trim(),
    password,
  });
  return response.data.data;
}

/**
 * Cadastro público de cidadão ou profissional (POST /users). O profissional nasce pendente de verificação (RS001)
 */
export async function registerUser(payload: RegisterPayload): Promise<void> {
  await api.post('/users', payload);
}

/**
 * Solicita o código de recuperação. A resposta é sempre a mesma, exista ou não a conta (D04)
 */
export async function forgotPassword(email: string): Promise<string> {
  const response = await api.post<ApiMessageResponse>('/auth/forgot-password', { email: email.trim() });
  return response.data?.message || 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.';
}

/**
 * Redefine a senha com o código de 6 dígitos. 3 códigos errados bloqueiam por 15 min (429)
 */
export async function resetPassword({ email, code, newPassword }: ResetPasswordPayload): Promise<void> {
  await api.post<ApiMessageResponse>('/auth/reset-password', { email: email.trim(), code, newPassword });
}

/**
 * Busca o perfil completo do usuário autenticado (GET /auth/me)
 */
export async function getProfile(): Promise<UserProfile> {
  const response = await api.get<ApiSuccessResponse<UserProfile>>('/auth/me');
  return response.data.data;
}

/**
 * Remove as credenciais do aparelho e encerra a sessão
 */
export async function signOut(): Promise<void> {
  await clearSession();
}

/**
 * Campos aninhados do Zod viram caminhos com ponto (ex.: "professionalRegistry.uf")
 */
function collectFieldErrors(issue: ValidationIssue, path: string, fieldErrors: Record<string, string>): void {
  const firstError = issue._errors?.[0];
  if (firstError) fieldErrors[path] = firstError;

  for (const [key, child] of Object.entries(issue)) {
    if (key === '_errors' || !child || Array.isArray(child)) continue;
    collectFieldErrors(child, `${path}.${key}`, fieldErrors);
  }
}

/**
 * Normaliza erros do Axios no formato padrão da API ({ status, message, issues })
 */
export function parseApiError(error: unknown, fallbackMessage: string): ParsedApiError {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return { status: null, message: fallbackMessage, fieldErrors: {} };
  }

  if (!error.response) {
    return {
      status: null,
      message: 'Não foi possível conectar ao servidor da API. Verifique sua conexão.',
      fieldErrors: {},
    };
  }

  const { status, data } = error.response;
  const fieldErrors: Record<string, string> = {};

  if (data?.issues) {
    for (const [field, issue] of Object.entries(data.issues)) {
      if (issue) collectFieldErrors(issue, field, fieldErrors);
    }
  }

  return {
    status,
    message: data?.message || fallbackMessage,
    fieldErrors,
  };
}
