import { Stack } from 'expo-router';
import { colors } from '@/theme';

// Ala Profissional (D23): as abas e, por cima delas, a caderneta do cidadão e a confirmação de dose
export default function ProfessionalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(abas)" />
      <Stack.Screen name="cidadao/[citizenId]" />
      <Stack.Screen name="confirmar-dose" />
    </Stack>
  );
}
