import { Tabs } from 'expo-router';
import { tabIcon, tabScreenOptions } from '@/components/navigation/tabScreenOptions';

// Abas da ala Cidadão. Dependentes chegam nas próximas etapas
export default function CitizenTabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="inicio" options={{ title: 'Início', tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen name="caderneta" options={{ title: 'Caderneta', tabBarIcon: tabIcon('book-outline', 'book') }} />
      <Tabs.Screen name="ubs" options={{ title: 'UBS', tabBarIcon: tabIcon('location-outline', 'location') }} />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
  );
}
