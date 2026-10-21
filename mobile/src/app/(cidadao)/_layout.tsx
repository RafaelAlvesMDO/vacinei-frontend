import { Stack } from 'expo-router';

// Ala Cidadão: vira uma barra de abas na etapa 2
export default function CitizenLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
