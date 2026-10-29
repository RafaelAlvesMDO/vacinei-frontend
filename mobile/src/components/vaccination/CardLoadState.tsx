import { StateMessage } from '@/components/ui';

interface Props {
  error: string | null;
  onRetry?: () => void;
  // Ala Profissional: "Carregando a caderneta..."
  loadingTitle?: string;
}

/**
 * Enquanto a caderneta ainda não chegou: carregando ou erro com "Tentar novamente"
 */
export function CardLoadState({ error, onRetry, loadingTitle = 'Carregando sua caderneta...' }: Props) {
  if (error) {
    return (
      <StateMessage
        variant="error"
        title="Não foi possível carregar a caderneta"
        message={error}
        action={onRetry ? { label: 'Tentar novamente', icon: 'refresh', onPress: onRetry } : undefined}
      />
    );
  }
  return <StateMessage variant="loading" title={loadingTitle} />;
}
