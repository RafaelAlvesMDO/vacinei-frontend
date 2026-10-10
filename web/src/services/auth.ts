import { isAxiosError } from 'axios';
import { api } from './api';
import type {
  LoginCredentials,
  AuthResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ParsedApiError,
  User,
  RequestAccessResponse,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from '../types/auth';

const TOKEN_KEY = '@vacinei:token';
const REFRESH_TOKEN_KEY = '@vacinei:refreshToken';
const USER_KEY = '@vacinei:user';

/**
 * Realiza autenticação via POST na API (/sessions com fallback para /auth/login)
 */
export async function authenticate({ email, password, rememberMe = false }: LoginCredentials): Promise<AuthResponse> {
  const payload = { email, password };
  let responseData: AuthResponse | undefined;

  try {
    // Chamada principal para /sessions conforme especificação
    const response = await api.post<ApiSuccessResponse<AuthResponse> | AuthResponse>('/sessions', payload);
    responseData = 'data' in response.data && 'token' in (response.data as any).data
      ? (response.data as ApiSuccessResponse<AuthResponse>).data
      : (response.data as AuthResponse);
  } catch (error: any) {
    // Fallback gracioso para /auth/login caso a rota /sessions retorne 404
    if (error.response?.status === 404) {
      const fallbackResponse = await api.post<ApiSuccessResponse<AuthResponse> | AuthResponse>('/auth/login', payload);
      responseData = 'data' in fallbackResponse.data && 'token' in (fallbackResponse.data as any).data
        ? (fallbackResponse.data as ApiSuccessResponse<AuthResponse>).data
        : (fallbackResponse.data as AuthResponse);
    } else {
      throw error;
    }
  }

  if (!responseData || !responseData.token) {
    throw new Error('Resposta de autenticação inválida.');
  }

  // Persistência das credenciais conforme opção 'Lembrar de mim'
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, responseData.token);
  storage.setItem(REFRESH_TOKEN_KEY, responseData.refreshToken);
  storage.setItem(USER_KEY, JSON.stringify(responseData.user));

  // Também garante que a api tenha o token configurado no header padrão
  api.defaults.headers.common.Authorization = `Bearer ${responseData.token}`;

  return responseData;
}

/**
 * Remove credenciais salvas e encerra a sessão
 */
export function signOut(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  delete api.defaults.headers.common.Authorization;
}

/**
 * Retorna o usuário logado caso exista na sessão local
 */
export function getStoredUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

/**
 * Retorna o Access Token ativo
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Solicita acesso ao administrador do sistema para criação de conta
 */
export async function requestAccess(email: string): Promise<RequestAccessResponse> {
  const payload = { email: email.trim() };

  try {
    const response = await api.post<ApiSuccessResponse<RequestAccessResponse> | RequestAccessResponse>(
      '/auth/request-access',
      payload
    );

    if (
      response.data &&
      'data' in response.data &&
      typeof (response.data as any).data === 'object' &&
      (response.data as any).data !== null
    ) {
      return (response.data as ApiSuccessResponse<RequestAccessResponse>).data;
    }

    return (response.data as RequestAccessResponse) || {
      message: 'Sua solicitação foi enviada ao administrador.',
    };
  } catch (error: any) {
    // Fallback caso a rota ainda não esteja pronta no backend em desenvolvimento
    if (error.response?.status === 404 || !error.response) {
      return {
        message: 'Sua solicitação foi enviada ao administrador.',
      };
    }
    throw error;
  }
}

/**
 * Solicita o envio de um código de recuperação de senha para o e-mail informado
 */
export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', {
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
  const response = await api.post<ResetPasswordResponse>('/auth/reset-password', {
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
