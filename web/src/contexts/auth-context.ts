import { createContext } from 'react';
import type { LoginCredentials, User } from '../types/auth';

export interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  // Verdadeiro enquanto a sessão salva é restaurada na inicialização
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<User>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData | undefined>(undefined);

// Cidadãos usam apenas o aplicativo mobile
export class CitizenAccessError extends Error {
  constructor() {
    super(
      'Acesso exclusivo: Este gerenciador web é destinado apenas a Profissionais de Saúde e Administradores. Por favor, utilize o aplicativo móvel VACINEI!?'
    );
    this.name = 'CitizenAccessError';
  }
}
