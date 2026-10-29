import type { ReactNode } from 'react';
import { Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { RestrictedAccess } from './RestrictedAccess';

/**
 * Telas com dados de cidadãos: só para o profissional verificado (RS001). Se a verificação for revogada
 * durante o uso (403 + `useForbiddenSync`), a tela passa a mostrar o acesso restrito
 */
export function VerifiedOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const registry = user?.professionalRegistry;

  if (!registry?.isVerified) {
    return (
      <Screen>
        <RestrictedAccess status={registry?.status ?? 'PENDENTE'} />
      </Screen>
    );
  }
  return children;
}
