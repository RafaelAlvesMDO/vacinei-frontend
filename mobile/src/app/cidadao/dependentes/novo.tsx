import { router } from 'expo-router';
import { DependentForm } from '@/components/dependents/DependentForm';
import { useDependents } from '@/hooks/useDependents';

// Cadastro de dependente (RF012, D33). Ao salvar, abre o perfil do novo dependente
export default function NewDependentRoute() {
  const { saved } = useDependents();
  const exit = () => (router.canGoBack() ? router.back() : router.replace('/cidadao/dependentes'));

  return (
    <DependentForm
      onExit={exit}
      onSaved={(dependent) => {
        saved(dependent);
        router.replace({
          pathname: '/cidadao/dependentes/[dependentId]',
          params: { dependentId: dependent.id, salvo: 'cadastrado' },
        });
      }}
    />
  );
}
