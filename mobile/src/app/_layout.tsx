import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { loadSession } from '@/services/tokenStorage';
import { colors, fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // A sessão salva vai para a memória antes da primeira requisição (o interceptor lê o token de lá)
  useEffect(() => {
    loadSession().finally(() => setSessionLoaded(true));
  }, []);

  // Sem a fonte (erro de carregamento), o app segue com a fonte do sistema
  const ready = (fontsLoaded || fontError !== null) && sessionLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </>
  );
}
