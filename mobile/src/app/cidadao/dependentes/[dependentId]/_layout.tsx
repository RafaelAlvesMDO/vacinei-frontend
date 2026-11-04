import { Stack, useLocalSearchParams } from 'expo-router';
import { VaccinationCardProvider } from '@/contexts/VaccinationCardContext';
import { colors } from '@/theme';

// Rotas de um dependente (D33): perfil, edição e as mesmas telas da caderneta do titular, com a caderneta dele
export default function DependentLayout() {
  const { dependentId } = useLocalSearchParams<{ dependentId: string }>();

  return (
    <VaccinationCardProvider owner={{ kind: 'dependent', id: dependentId }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="editar" />
        <Stack.Screen name="caderneta" />
        <Stack.Screen name="vacina/[vaccineId]" />
        <Stack.Screen name="registro-vacina" />
        <Stack.Screen name="digitalizar" options={{ gestureEnabled: false }} />
      </Stack>
    </VaccinationCardProvider>
  );
}
