import { StateMessage } from '@/components/ui';

interface Props {
  error: string | null;
  onRetry: () => void;
}

/**
 * Enquanto a caderneta ainda não chegou: carregando ou erro com "Tentar novamente"
 */
export function CardLoadState({ error, onRetry }: Props) {
  if (error) {
    return (
      <StateMessage
        variant="error"
        title="Não foi possível carregar a caderneta"
        message={error}
        action={{ label: 'Tentar novamente', icon: 'refresh', onPress: onRetry }}
      />
    );
  }
  return <StateMessage variant="loading" title="Carregando sua caderneta..." />;
}
