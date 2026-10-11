import type { User } from '../types/auth';

const TOKEN_KEY = '@vacinei:token';
const REFRESH_TOKEN_KEY = '@vacinei:refreshToken';
const USER_KEY = '@vacinei:user';

const KEYS = [TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY];

// "Lembrar de mim" persiste no localStorage; caso contrário, a sessão dura até fechar a aba
function getActiveStorage(): Storage | null {
  if (localStorage.getItem(REFRESH_TOKEN_KEY)) return localStorage;
  if (sessionStorage.getItem(REFRESH_TOKEN_KEY)) return sessionStorage;
  return null;
}

export function getToken(): string | null {
  return getActiveStorage()?.getItem(TOKEN_KEY) ?? null;
}

export function getRefreshToken(): string | null {
  return getActiveStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function getStoredUser(): User | null {
  const userJson = getActiveStorage()?.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

/**
 * Grava uma nova sessão, limpando qualquer resquício da sessão anterior
 */
export function saveSession(token: string, refreshToken: string, user: User, rememberMe: boolean): void {
  clearSession();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Atualiza os tokens após a renovação (rotação do refresh token), mantendo o storage original
 */
export function updateTokens(token: string, refreshToken: string): void {
  const storage = getActiveStorage() ?? sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function updateStoredUser(user: User): void {
  getActiveStorage()?.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  for (const key of KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
