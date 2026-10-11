import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { onSessionExpired } from '../services/api';
import { authenticate, getProfile, signOut as clearAuthSession } from '../services/auth';
import { getRefreshToken, getStoredUser, updateStoredUser } from '../services/tokenStorage';
import type { LoginCredentials, User, UserProfile } from '../types/auth';
import { AuthContext, CitizenAccessError, type AuthContextData } from './auth-context';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(() => getRefreshToken() !== null);

  const signOut = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  const applyProfile = useCallback(
    (profile: UserProfile) => {
      if (profile.role === 'CIDADAO') {
        signOut();
        return;
      }
      updateStoredUser(profile);
      setUser(profile);
    },
    [signOut]
  );

  // Sincroniza o usuário com GET /auth/me (ex.: status de verificação do profissional)
  const refreshProfile = useCallback(async () => {
    applyProfile(await getProfile());
  }, [applyProfile]);

  const signIn = useCallback(
    async (credentials: LoginCredentials): Promise<User> => {
      const { user: authenticatedUser } = await authenticate(credentials);

      if (authenticatedUser.role === 'CIDADAO') {
        clearAuthSession();
        throw new CitizenAccessError();
      }

      setUser(authenticatedUser);
      return authenticatedUser;
    },
    []
  );

  // Quando a renovação do token falha, o interceptor limpa a sessão e o estado é zerado
  useEffect(() => {
    onSessionExpired(() => setUser(null));
    return () => onSessionExpired(null);
  }, []);

  // Restaura a sessão salva validando-a no backend
  useEffect(() => {
    if (!getRefreshToken()) return;

    let isCancelled = false;

    getProfile()
      .then((profile) => {
        if (!isCancelled) applyProfile(profile);
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        // Sem resposta do servidor, mantém o usuário salvo; erros de autenticação encerram a sessão
        if (isAxiosError(error) && error.response) signOut();
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [applyProfile, signOut]);

  const value = useMemo<AuthContextData>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      signIn,
      signOut,
      refreshProfile,
    }),
    [user, isLoading, signIn, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
