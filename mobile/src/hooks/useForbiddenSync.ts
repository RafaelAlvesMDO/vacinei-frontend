import { useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * 403 numa rota de profissional verificado: a verificação pode ter sido revogada desde o login.
 * Confere o perfil de novo; se perdeu a verificação, a tela passa a mostrar o acesso restrito (RS001)
 */
export function useForbiddenSync(status: number | null | undefined) {
  const { refreshProfile } = useAuth();
  const isForbidden = status === 403;

  useEffect(() => {
    if (isForbidden) refreshProfile().catch(() => undefined);
  }, [isForbidden, refreshProfile]);
}
