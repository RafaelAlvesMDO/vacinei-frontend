import { Tabs } from 'expo-router';
import { tabIcon, tabScreenOptions } from '@/components/navigation/tabScreenOptions';

// Ala Cidadão (D23). Abas provisórias: as próximas etapas trazem caderneta, UBS e dependentes
export default function CitizenLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="inicio" options={{ title: 'Início', tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
  );
}
