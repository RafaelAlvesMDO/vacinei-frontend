import { Stack } from 'expo-router';
import { VaccinationCardProvider } from '@/contexts/VaccinationCardContext';
import { VaccineAlertsProvider } from '@/contexts/VaccineAlertsContext';
import { colors } from '@/theme';

// Ala Cidadão (D23): as abas e, por cima delas, os detalhes da vacina e da UBS, o cadastro manual e a
// Central de notificações. A caderneta é carregada uma vez para todas, e os alertas são reagendados a cada carga
export default function CitizenLayout() {
  return (
    <VaccinationCardProvider>
      <VaccineAlertsProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(abas)" />
          <Stack.Screen name="vacina/[vaccineId]" />
          <Stack.Screen name="registro-vacina" />
          <Stack.Screen name="ubs/[ubsId]" />
          <Stack.Screen name="notificacoes" />
        </Stack>
      </VaccineAlertsProvider>
    </VaccinationCardProvider>
  );
}
