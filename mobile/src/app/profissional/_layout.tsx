import { Tabs } from 'expo-router';
import { tabIcon, tabScreenOptions } from '@/components/navigation/tabScreenOptions';

// Ala Profissional (D23). Abas provisórias: a etapa 6 traz busca, confirmação de doses e busca ativa
export default function ProfessionalLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="painel" options={{ title: 'Painel', tabBarIcon: tabIcon('grid-outline', 'grid') }} />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
  );
}
