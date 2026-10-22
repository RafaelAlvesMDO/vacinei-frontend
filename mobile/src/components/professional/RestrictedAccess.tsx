import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Banner, Button, Card, Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { parseApiError } from '@/services/auth';
import { colors, radius, spacing, typography } from '@/theme';
import type { ProfessionalVerificationStatus } from '@/types/auth';

interface Props {
  status: ProfessionalVerificationStatus;
}

/**
 * Aviso de acesso restrito da ala Profissional para quem ainda não foi verificado (RS001, D23).
 * Nenhum dado de cidadão aparece aqui
 */
export function RestrictedAccess({ status }: Props) {
  const { chooseAla, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'info' | 'danger'; message: string } | null>(null);
  const rejected = status === 'RECUSADO';

  // Confere de novo o status no GET /auth/me (o admin pode ter verificado a conta)
  const checkStatus = async () => {
    setChecking(true);
    setFeedback(null);
    try {
      await refreshProfile();
      setFeedback({ tone: 'info', message: 'Status atualizado. A análise ainda não foi concluída.' });
    } catch (error) {
      setFeedback({ tone: 'danger', message: parseApiError(error, 'Não foi possível atualizar o status.').message });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.iconBox, rejected && styles.iconBoxRejected]}>
        <Icon name="shield-outline" size={32} color={rejected ? colors.danger : colors.warning} />
      </View>
      <Badge
        label={rejected ? 'Registro profissional recusado' : 'Acesso profissional pendente'}
        tone={rejected ? 'danger' : 'warning'}
        icon={rejected ? 'close-circle-outline' : 'time-outline'}
      />
      <Text style={typography.title} accessibilityRole="header">
        Este painel é exclusivo para profissionais verificados
      </Text>
      <Text style={typography.muted}>
        O acesso às ferramentas de atendimento é liberado depois que a administração confere o seu registro no
        conselho de classe.
      </Text>

      {rejected ? (
        <Banner
          tone="danger"
          title="Registro recusado"
          message="Seu registro profissional não foi aprovado. Procure a administração do Vacinei!? para revisar os dados."
        />
      ) : (
        <Banner
          tone="warning"
          icon="hourglass-outline"
          title="Validação em análise"
          message="Sua solicitação foi recebida. O acesso será liberado quando a análise for concluída."
        />
      )}

      <Banner
        icon="person-outline"
        title="Enquanto isso"
        message="Use a ala Cidadão para acompanhar a sua própria caderneta de vacinação."
      />

      {feedback && <Banner tone={feedback.tone} message={feedback.message} />}

      <Button label="Acessar a ala Cidadão" icon="swap-horizontal" onPress={() => chooseAla('cidadao')} />
      {!rejected && (
        <Button
          label="Atualizar status"
          variant="secondary"
          icon="refresh"
          loading={checking}
          loadingLabel="Atualizando..."
          onPress={checkStatus}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxRejected: {
    backgroundColor: colors.dangerSoft,
  },
});
