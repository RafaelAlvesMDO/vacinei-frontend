import { isAxiosError } from 'axios';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onSessionExpired } from '@/services/api';
import { getLastAla, saveLastAla } from '@/services/alaStorage';
import { authenticate, getProfile, signOut as clearStoredSession } from '@/services/auth';
import { getStoredUser, getToken, loadSession, saveSession, updateStoredUser } from '@/services/tokenStorage';
import { cancelVaccineAlerts } from '@/services/vaccineNotifications';
import type { Ala, LoginCredentials, StoredUser } from '@/types/auth';

/**
 * ADMIN não usa o app: ele usa o Gerenciador Web (D23)
 */
export class AdminAccessError extends Error {
  constructor() {
    super('Administradores acessam o Vacinei!? pelo Gerenciador Web. O app é para cidadãos e profissionais de saúde.');
    this.name = 'AdminAccessError';
  }
}

export interface AuthContextValue {
  user: StoredUser | null;
  // null: profissional que ainda não escolheu a ala neste aparelho
  ala: Ala | null;
  // Splash "Verificando sessão ativa..." enquanto a sessão salva é restaurada
  isRestoring: boolean;
  // A sessão caiu (refresh recusado): o login mostra o aviso uma vez
  sessionExpired: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  chooseAla: (ala: Ala) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// O cidadão só tem a ala Cidadão; o profissional volta para a última ala escolhida
async function resolveAla(user: StoredUser): Promise<Ala | null> {
  if (user.role !== 'PROFISSIONAL_SAUDE') return 'cidadao';
  return getLastAla(user.id);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ala, setAla] = useState<Ala | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Ao sair ou com a sessão expirada, os alertas da caderneta não ficam agendados no aparelho (LGPD)
  const clearState = useCallback(() => {
    setUser(null);
    setAla(null);
    void cancelVaccineAlerts();
  }, []);

  // Refresh recusado: o api.ts já limpou o aparelho, falta voltar ao login
  useEffect(() => {
    onSessionExpired(() => {
      clearState();
      setSessionExpired(true);
    });
    return () => onSessionExpired(null);
  }, [clearState]);

  // Restauração: sessão do aparelho + GET /auth/me para atualizar perfil e verificação profissional
  useEffect(() => {
    let active = true;

    async function restore() {
      const session = await loadSession();
      if (!session) {
        // Sessão encerrada com o app fechado: nenhum alerta da conta anterior continua agendado
        await cancelVaccineAlerts();
        return;
      }

      try {
        const profile = await getProfile();
        if (profile.role === 'ADMIN') {
          await clearStoredSession();
          await cancelVaccineAlerts();
          return;
        }
        await updateStoredUser(profile);
      } catch (error) {
        // Sem rede, o app segue com o usuário salvo. 401 depois da renovação: conta desativada ou sessão revogada
        if (isAxiosError(error) && error.response?.status === 401) {
          await clearStoredSession();
          await cancelVaccineAlerts();
          return;
        }
        if (!getToken()) return;
      }

      const restoredUser = getStoredUser();
      if (!restoredUser || !active) return;
      const restoredAla = await resolveAla(restoredUser);
      if (!active) return;
      setUser(restoredUser);
      setAla(restoredAla);
    }

    restore().finally(() => {
      if (active) setIsRestoring(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const { user: loggedUser, token, refreshToken } = await authenticate(credentials);
    if (loggedUser.role === 'ADMIN') throw new AdminAccessError();

    await saveSession(token, refreshToken, loggedUser);
    const storedUser = getStoredUser();
    if (!storedUser) return;

    const nextAla = await resolveAla(storedUser);
    setSessionExpired(false);
    setUser(storedUser);
    setAla(nextAla);
  }, []);

  const signOut = useCallback(async () => {
    await clearStoredSession();
    setSessionExpired(false);
    clearState();
  }, [clearState]);

  const refreshProfile = useCallback(async () => {
    const profile = await getProfile();
    await updateStoredUser(profile);
    setUser(getStoredUser());
  }, []);

  const chooseAla = useCallback(
    (nextAla: Ala) => {
      if (!user) return;
      // A ala Profissional é só do profissional; as permissões continuam no backend (D01)
      if (nextAla === 'profissional' && user.role !== 'PROFISSIONAL_SAUDE') return;
      setAla(nextAla);
      if (user.role === 'PROFISSIONAL_SAUDE') void saveLastAla(user.id, nextAla);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, ala, isRestoring, sessionExpired, signIn, signOut, refreshProfile, chooseAla }),
    [user, ala, isRestoring, sessionExpired, signIn, signOut, refreshProfile, chooseAla]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
