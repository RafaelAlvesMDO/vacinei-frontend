import { StateMessage } from '@/components/ui';

interface Props {
  // A lista já chegou (e o dependente não está nela)
  loaded: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}

/**
 * Estados de uma tela de dependente antes de ter os dados: carregando, erro ou não encontrado (removido ou
 * de outra pessoa, RS004)
 */
export function DependentLoadState({ loaded, error, onRetry, onBack }: Props) {
  if (error) {
    return (
      <StateMessage
        variant="error"
        title="Não foi possível carregar"
        message={error}
        action={{ label: 'Tentar novamente', icon: 'refresh', onPress: onRetry }}
      />
    );
  }
  if (loaded) {
    return (
      <StateMessage
        variant="empty"
        icon="search"
        title="Dependente não encontrado"
        message="Ele pode ter sido removido."
        action={{ label: 'Voltar', icon: 'arrow-back', onPress: onBack }}
      />
    );
  }
  return <StateMessage variant="loading" title="Carregando dependente..." />;
}
