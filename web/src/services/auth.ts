import { isAxiosError } from 'axios';
import { api } from './api';
import { clearSession, saveSession } from './tokenStorage';
import type {
  LoginCredentials,
  AuthResponse,
  ApiSuccessResponse,
  ApiMessageResponse,
  ApiErrorResponse,
  ParsedApiError,
  UserProfile,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  ValidationIssue,
} from '../types/auth';
import type { RegisterProfessionalPayload } from '../types/professional';

/**
 * Autentica o usuário via POST /auth/login e persiste a sessão
 * conforme a opção "Lembrar de mim"
 */
export async function authenticate({ email, password, rememberMe = false }: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<ApiSuccessResponse<AuthResponse>>('/auth/login', { email, password });
  const { user, token, refreshToken } = response.data.data;

  saveSession(token, refreshToken, user, rememberMe);

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
 * Remove credenciais salvas e encerra a sessão
 */
export function signOut(): void {
  clearSession();
}

/**
 * Cadastro público de profissional de saúde (POST /users). A conta nasce
 * pendente de verificação pelo administrador (RS001)
 */
export async function registerProfessional(payload: RegisterProfessionalPayload): Promise<void> {
  await api.post('/users', payload);
}

/**
 * Solicita o envio de um código de recuperação de senha para o e-mail informado
 */
export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await api.post<ApiMessageResponse>('/auth/forgot-password', {
    email: email.trim(),
  });

  return {
    message:
      response.data?.message ||
      'Se o e-mail estiver cadastrado, você receberá um código de recuperação.',
  };
}

/**
 * Redefine a senha a partir do código de recuperação recebido por e-mail
 */
export async function resetPassword({
  email,
  code,
  newPassword,
}: ResetPasswordPayload): Promise<ResetPasswordResponse> {
  const response = await api.post<ApiMessageResponse>('/auth/reset-password', {
    email: email.trim(),
    code: code.trim(),
    newPassword,
  });

  return {
    message: response.data?.message || 'Senha redefinida com sucesso.',
  };
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
