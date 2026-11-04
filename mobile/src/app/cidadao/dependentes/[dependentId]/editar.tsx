import { router, useLocalSearchParams } from 'expo-router';
import { DependentForm } from '@/components/dependents/DependentForm';
import { DependentLoadState } from '@/components/dependents/DependentLoadState';
import { Screen, StepHeader } from '@/components/ui';
import { useDependents } from '@/hooks/useDependents';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';

// Edição dos dados básicos do dependente (D33). Ao salvar, volta ao perfil com o aviso de sucesso
export default function EditDependentRoute() {
  const { dependentId } = useLocalSearchParams<{ dependentId: string }>();
  const { dependents, error, reload, saved } = useDependents();
  const { reload: reloadCard } = useVaccinationCard();
  const dependent = dependents?.find((item) => item.dependent.id === dependentId)?.dependent;

  const goToProfile = (saved?: boolean) =>
    router.dismissTo({
      pathname: '/cidadao/dependentes/[dependentId]',
      params: saved ? { dependentId, salvo: 'editado' } : { dependentId },
    });
  const exit = () => (router.canGoBack() ? router.back() : goToProfile());

  if (!dependent) {
    return (
      <Screen header={<StepHeader title="Editar dependente" onBack={exit} />}>
        <DependentLoadState loaded={dependents !== null} error={error} onRetry={() => reload()} onBack={exit} />
      </Screen>
    );
  }

  return (
    <DependentForm
      dependent={dependent}
      onExit={exit}
      onSaved={(updated) => {
        saved(updated);
        // O nome e o nascimento aparecem na caderneta (e o nascimento limita a data das doses)
        reloadCard();
        goToProfile(true);
      }}
    />
  );
}
