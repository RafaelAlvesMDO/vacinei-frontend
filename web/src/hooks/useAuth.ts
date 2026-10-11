import { useContext } from 'react';
import { AuthContext, type AuthContextData } from '../contexts/auth-context';

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }

  return context;
}
