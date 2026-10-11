import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiSuccessResponse, RefreshResponse } from '../types/auth';
import { clearSession, getRefreshToken, getToken, updateTokens } from './tokenStorage';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instância sem interceptors, usada apenas na renovação para evitar laços de 401
const refreshClient = axios.create({ baseURL, timeout: 10000 });

// Rotas de autenticação em que um 401 não deve disparar a renovação do token
const AUTH_ROUTES_WITHOUT_REFRESH = ['/auth/login', '/auth/refresh'];

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let sessionExpiredHandler: (() => void) | null = null;

/**
 * Registra a ação executada quando a sessão não pode ser renovada (ex.: voltar ao login)
 */
export function onSessionExpired(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

// Requisição de renovação compartilhada entre os 401 simultâneos
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Refresh token ausente.');

  const response = await refreshClient.post<ApiSuccessResponse<RefreshResponse>>('/auth/refresh', {
    refreshToken,
  });
  const { token, refreshToken: newRefreshToken } = response.data.data;

  updateTokens(token, newRefreshToken);
  return token;
}

// Interceptor para injetar o Access Token JWT nas requisições
api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Interceptor de 401: renova o token uma única vez e repete a requisição original
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isAuthRoute = AUTH_ROUTES_WITHOUT_REFRESH.some((route) => originalRequest?.url?.includes(route));

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const token = await refreshPromise;

      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch {
      // Falha irreversível: encerra a sessão local e devolve o usuário ao login
      clearSession();
      sessionExpiredHandler?.();
      return Promise.reject(error);
    }
  }
);
