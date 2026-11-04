import { Stack } from 'expo-router';
import { DependentsProvider } from '@/contexts/DependentsContext';
import { VaccinationCardProvider } from '@/contexts/VaccinationCardContext';
import { colors } from '@/theme';

// Ala Cidadão (D23): as abas e, por cima delas, os detalhes da vacina e da UBS, o cadastro manual, a
// Central de notificações e os dependentes (D33). A caderneta e os dependentes são carregados uma vez para todas
export default function CitizenLayout() {
  return (
    <VaccinationCardProvider>
      <DependentsProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(abas)" />
          <Stack.Screen name="vacina/[vaccineId]" />
          <Stack.Screen name="registro-vacina" />
          <Stack.Screen name="digitalizar" options={{ gestureEnabled: false }} />
          <Stack.Screen name="ubs/[ubsId]" />
          <Stack.Screen name="notificacoes" />
          <Stack.Screen name="dependentes/index" />
          <Stack.Screen name="dependentes/novo" />
          <Stack.Screen name="dependentes/[dependentId]" />
        </Stack>
      </DependentsProvider>
    </VaccinationCardProvider>
  );
}
