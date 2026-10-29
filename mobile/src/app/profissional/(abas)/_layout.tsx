import { Tabs } from 'expo-router';
import { tabIcon, tabScreenOptions } from '@/components/navigation/tabScreenOptions';
import { useAuth } from '@/hooks/useAuth';

// Abas da ala Profissional. Busca ativa e Cidadãos só aparecem para o profissional verificado (RS001)
export default function ProfessionalTabsLayout() {
  const { user } = useAuth();
  const verified = !!user?.professionalRegistry?.isVerified;

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="painel" options={{ title: 'Painel', tabBarIcon: tabIcon('grid-outline', 'grid') }} />
      <Tabs.Screen
        name="busca-ativa"
        options={{
          title: 'Busca ativa',
          tabBarIcon: tabIcon('time-outline', 'time'),
          href: verified ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="cidadaos"
        options={{
          title: 'Cidadãos',
          tabBarIcon: tabIcon('people-outline', 'people'),
          href: verified ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
  );
}
