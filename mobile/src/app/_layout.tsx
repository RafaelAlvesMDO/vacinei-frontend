import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SessionSplash } from '@/components/SessionSplash';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { colors, fontAssets } from '@/theme';

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

/**
 * Rotas protegidas por sessão, perfil e ala (D23). Quando a sessão ou a ala muda, o Expo Router
 * leva para a primeira rota liberada. As permissões de verdade continuam no backend (D01)
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

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isProfessional && ala === null}>
          <Stack.Screen name="escolher-ala" />
        </Stack.Protected>
        <Stack.Protected guard={!!user && ala === 'cidadao'}>
          <Stack.Screen name="cidadao" />
        </Stack.Protected>
        <Stack.Protected guard={isProfessional && ala === 'profissional'}>
          <Stack.Screen name="profissional" />
        </Stack.Protected>
        {/* Pública: aberta pelo cadastro e pelo Perfil */}
        <Stack.Screen name="privacidade" />
      </Stack>
    </>
  );
}
