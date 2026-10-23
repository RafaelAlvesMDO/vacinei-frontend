import { Stack } from 'expo-router';
import { VaccinationCardProvider } from '@/contexts/VaccinationCardContext';
import { colors } from '@/theme';

// Ala Cidadão (D23): as abas e, por cima delas, o detalhe da vacina. A caderneta é carregada uma vez para todas
export default function CitizenLayout() {
  return (
    <VaccinationCardProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(abas)" />
        <Stack.Screen name="vacina/[vaccineId]" />
      </Stack>
    </VaccinationCardProvider>
  );
}
