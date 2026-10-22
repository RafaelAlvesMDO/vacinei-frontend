import { Text } from 'react-native';
import { RestrictedAccess } from '@/components/professional/RestrictedAccess';
import { Banner, Card, Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { typography } from '@/theme';
import { getFirstName } from '@/utils/roles';

// Provisória: busca de cidadãos, confirmação de doses e busca ativa chegam na etapa 6
export default function ProfessionalPanel() {
  const { user } = useAuth();
  const registry = user?.professionalRegistry;

  if (!registry?.isVerified) {
    return (
      <Screen edges={['top']}>
        <RestrictedAccess status={registry?.status ?? 'PENDENTE'} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <Text style={typography.title} accessibilityRole="header">
        Olá, {user ? getFirstName(user.name) : ''}
      </Text>
      <Card>
        <Text style={typography.subtitle}>Painel do profissional</Text>
        <Text style={typography.muted}>
          Aqui você vai buscar cidadãos, confirmar doses e acompanhar a busca ativa de doses atrasadas.
        </Text>
      </Card>
      <Banner message="As ferramentas de atendimento chegam na próxima versão do app." />
    </Screen>
  );
}
