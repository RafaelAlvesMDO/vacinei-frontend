import * as SecureStore from 'expo-secure-store';
import type { StoredUser, User } from '@/types/auth';

// O SecureStore aceita só letras, números, ".", "-" e "_" nas chaves
const TOKEN_KEY = 'vacinei.token';
const REFRESH_TOKEN_KEY = 'vacinei.refreshToken';
const USER_KEY = 'vacinei.user';

const KEYS = [TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY];

interface Session {
  token: string;
  refreshToken: string;
  user: StoredUser;
}

// Cópia em memória: o SecureStore é assíncrono e o interceptor lê o token a cada requisição.
// loadSession() a preenche na abertura do app; as gravações atualizam a memória e o aparelho
let session: Session | null = null;

function toStoredUser({ id, name, email, role, professionalRegistry }: User | StoredUser): StoredUser {
  return { id, name, email, role, professionalRegistry };
}

/**
 * Lê a sessão salva no aparelho. Chamado uma vez na abertura do app
 */
export async function loadSession(): Promise<Session | null> {
  try {
    const [token, refreshToken, userJson] = await Promise.all(KEYS.map((key) => SecureStore.getItemAsync(key)));
    if (!token || !refreshToken || !userJson) {
      session = null;
      return null;
    }
    session = { token, refreshToken, user: toStoredUser(JSON.parse(userJson) as StoredUser) };
    return session;
  } catch {
    // Dados corrompidos ou chave do aparelho perdida: começa sem sessão
    await clearSession();
    return null;
  }
}

export function getToken(): string | null {
  return session?.token ?? null;
}

export function getRefreshToken(): string | null {
  return session?.refreshToken ?? null;
}

export function getStoredUser(): StoredUser | null {
  return session?.user ?? null;
}

/**
 * Grava uma nova sessão, guardando só o usuário mínimo (sem CPF, celular e nascimento)
 */
export async function saveSession(token: string, refreshToken: string, user: User): Promise<void> {
  const storedUser = toStoredUser(user);
  session = { token, refreshToken, user: storedUser };
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(storedUser)),
  ]);
}

/**
 * Atualiza os tokens após a renovação (rotação do refresh token)
 */
export async function updateTokens(token: string, refreshToken: string): Promise<void> {
  if (!session) return;
  session = { ...session, token, refreshToken };
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function updateStoredUser(user: User | StoredUser): Promise<void> {
  if (!session) return;
  const storedUser = toStoredUser(user);
  session = { ...session, user: storedUser };
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(storedUser));
}

export async function clearSession(): Promise<void> {
  session = null;
  await Promise.all(KEYS.map((key) => SecureStore.deleteItemAsync(key)));
}
