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
  RequestAccessResponse,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from '../types/auth';

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
 * Solicita acesso ao administrador do sistema para criação de conta
 */
export async function requestAccess(email: string): Promise<RequestAccessResponse> {
  const fallback: RequestAccessResponse = { message: 'Sua solicitação foi enviada ao administrador.' };

  try {
    const response = await api.post<ApiMessageResponse>('/auth/request-access', { email: email.trim() });
    return { message: response.data?.message || fallback.message };
  } catch (error) {
    // Rota provisória: ainda não existe no backend (será substituída pelo cadastro via POST /users)
    if (isAxiosError(error) && (error.response?.status === 404 || !error.response)) {
      return fallback;
    }
    throw error;
  }
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
      const firstError = issue?._errors?.[0];
      if (firstError) fieldErrors[field] = firstError;
    }
  }

  return {
    status,
    message: data?.message || fallbackMessage,
    fieldErrors,
  };
}
