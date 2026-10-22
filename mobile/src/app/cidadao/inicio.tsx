import { Text } from 'react-native';
import { Banner, Card, Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { typography } from '@/theme';
import { getFirstName } from '@/utils/roles';

// Provisória: a caderneta digital chega na etapa 3
export default function CitizenHome() {
  const { user } = useAuth();

  return (
    <Screen edges={['top']}>
      <Text style={typography.title} accessibilityRole="header">
        Olá, {user ? getFirstName(user.name) : ''}
      </Text>
      <Card>
        <Text style={typography.subtitle}>Sua caderneta de vacinação</Text>
        <Text style={typography.muted}>
          Aqui você vai acompanhar as vacinas em dia, as atrasadas e as próximas doses.
        </Text>
      </Card>
      <Banner message="A caderneta digital chega na próxima versão do app." />
    </Screen>
  );
}
