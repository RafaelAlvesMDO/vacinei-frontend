import { router, useRootNavigationState, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToNotificationTaps } from '@/services/vaccineNotifications';

/**
 * Toque na notificação (RF007 nota 4, D36): abre o detalhe da vacina ou a caderneta filtrada, do titular ou
 * do dependente. Fica no navegador raiz, montado depois da restauração da sessão, para tratar também o
 * toque que abriu o app fechado. O profissional na ala Profissional passa para a ala Cidadão antes.
 * No Expo Go, a escuta não é ligada (o toque só abre o app)
 */
export function NotificationTapHandler() {
  const { user, ala, chooseAla } = useAuth();
  const navigationState = useRootNavigationState();
  const isNavigationReady = Boolean(navigationState?.key);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => subscribeToNotificationTaps(setPendingUrl), []);

  useEffect(() => {
    if (!pendingUrl || !isNavigationReady) return;
    // A troca de ala leva à Início da ala Cidadão; a rota abre na próxima passagem
    if (user && ala !== 'cidadao') {
      chooseAla('cidadao');
      return;
    }
    // Depois da renderização, para não competir com o redirecionamento das rotas protegidas. Sem sessão,
    // os lembretes já foram cancelados: o toque só abre o login
    const timer = setTimeout(() => {
      setPendingUrl(null);
      if (user) router.push(pendingUrl as Href);
    }, 0);
    return () => clearTimeout(timer);
  }, [pendingUrl, isNavigationReady, user, ala, chooseAla]);

  return null;
}
