import { isAxiosError } from 'axios';
import { api } from './api';
import { clearSession, saveSession } from './tokenStorage';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthResponse,
  LoginCredentials,
  ParsedApiError,
  UserProfile,
  ValidationIssue,
} from '@/types/auth';

/**
 * Autentica o usuário via POST /auth/login e grava a sessão no aparelho.
 * Sem "Lembrar de mim": a sessão dura até sair ou expirar
 */
export async function authenticate({ email, password }: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<ApiSuccessResponse<AuthResponse>>('/auth/login', {
    email: email.trim(),
    password,
  });
  const { user, token, refreshToken } = response.data.data;

  await saveSession(token, refreshToken, user);

  return { user, token, refreshToken };
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
