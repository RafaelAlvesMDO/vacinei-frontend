import { useFonts } from 'expo-font';
import { Stack, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SessionSplash } from '@/components/SessionSplash';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { colors, fontAssets } from '@/theme';
import type { Ala, StoredUser } from '@/types/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  // Sem a fonte (erro de carregamento), o app segue com a fonte do sistema
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

// Destino de cada estado da sessão. Desde o SDK 58, sem `redirectTo` o Expo Router leva à primeira rota liberada
// em ordem alfabética, que para o profissional na ala Profissional era a pública `privacidade`
function getHomeHref(user: StoredUser | null, ala: Ala | null): Href {
  if (!user) return '/';
  if (ala === 'cidadao') return '/cidadao/inicio';
  if (ala === 'profissional') return '/profissional/painel';
  return '/escolher-ala';
}

/**
 * Rotas protegidas por sessão, perfil e ala (D23). Quando a sessão ou a ala muda, a rota bloqueada
 * leva ao destino do novo estado. As permissões de verdade continuam no backend (D01)
 */
function RootNavigator() {
  const { user, ala, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <>
        <StatusBar style="light" />
        <SessionSplash />
      </>
    );
  }

  const isProfessional = user?.role === 'PROFISSIONAL_SAUDE';
  const home = getHomeHref(user, ala);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected redirectTo={home} guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected redirectTo={home} guard={isProfessional && ala === null}>
          <Stack.Screen name="escolher-ala" />
        </Stack.Protected>
        <Stack.Protected redirectTo={home} guard={!!user && ala === 'cidadao'}>
          <Stack.Screen name="cidadao" />
        </Stack.Protected>
        <Stack.Protected redirectTo={home} guard={isProfessional && ala === 'profissional'}>
          <Stack.Screen name="profissional" />
        </Stack.Protected>
        {/* Pública: aberta pelo cadastro e pelo Perfil */}
        <Stack.Screen name="privacidade" />
      </Stack>
    </>
  );
}
