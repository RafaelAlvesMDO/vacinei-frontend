import { router, Tabs } from 'expo-router';
import { scanTabIcon, tabIcon, useTabScreenOptions } from '@/components/navigation/tabScreenOptions';
import { colors } from '@/theme';

// Abas da ala Cidadão. Os dependentes (D33) ficam no Perfil e no atalho da Início, sem aba própria.
// "Digitalizar" é a aba central do design: abre o fluxo do OCR por cima das abas, sem trocar de aba
export default function CitizenTabsLayout() {
  const screenOptions = useTabScreenOptions();
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="inicio" options={{ title: 'Início', tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen name="caderneta" options={{ title: 'Caderneta', tabBarIcon: tabIcon('book-outline', 'book') }} />
      <Tabs.Screen
        name="escanear"
        options={{
          title: 'Digitalizar',
          tabBarIcon: scanTabIcon,
          tabBarAccessibilityLabel: 'Digitalizar caderneta',
          // A aba nunca fica ativa (o fluxo abre por cima); o rótulo fica em `primary`, como no design
          tabBarInactiveTintColor: colors.primary,
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.push('/cidadao/digitalizar');
          },
        }}
      />
      <Tabs.Screen name="ubs" options={{ title: 'UBS', tabBarIcon: tabIcon('location-outline', 'location') }} />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
  );
}
