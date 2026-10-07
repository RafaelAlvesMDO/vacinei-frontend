import { api } from './api';
import type { LoginCredentials, AuthResponse, ApiSuccessResponse, User } from '../types/auth';

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
