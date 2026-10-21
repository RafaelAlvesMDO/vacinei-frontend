import { Stack } from 'expo-router';

// Ala Profissional: vira uma barra de abas na etapa 2
export default function ProfessionalLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
