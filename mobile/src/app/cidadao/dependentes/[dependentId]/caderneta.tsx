import { router, useLocalSearchParams } from 'expo-router';
import { CardScreen } from '@/components/vaccination/screens/CardScreen';

// Caderneta do dependente (D33): a mesma tela da aba Caderneta do titular
export default function DependentCardRoute() {
  const { dependentId } = useLocalSearchParams<{ dependentId: string }>();
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/cidadao/dependentes/[dependentId]', params: { dependentId } });

  return <CardScreen onBack={goBack} />;
}
