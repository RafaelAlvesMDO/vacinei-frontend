import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionCard } from '@/components/professional/ActionCard';
import { PageHeading } from '@/components/professional/PageHeading';
import { RecentDosesCard } from '@/components/professional/RecentDosesCard';
import { RestrictedAccess } from '@/components/professional/RestrictedAccess';
import { StatTile } from '@/components/professional/StatTile';
import { Banner, Screen, StateMessage } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useForbiddenSync } from '@/hooks/useForbiddenSync';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { useRequest } from '@/hooks/useRequest';
import { getDashboardSummary, getRecentDoses } from '@/services/dashboard';
import { spacing, typography } from '@/theme';
import { formatNumber } from '@/utils/format';
import { getFirstName } from '@/utils/roles';

/**
 * Painel da ala Profissional (RF009): atalhos de atendimento, indicadores do /dashboard/summary e
 * registros recentes. O gráfico mensal fica no Gerenciador Web
 */
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

  return <VerifiedPanel firstName={user ? getFirstName(user.name) : ''} />;
}

const RECENT_LIMIT = 5;

function loadRecentDoses(signal: AbortSignal) {
  return getRecentDoses(RECENT_LIMIT, signal);
}

function VerifiedPanel({ firstName }: { firstName: string }) {
  const summary = useRequest(getDashboardSummary, 'Não foi possível carregar os indicadores.');
  const recent = useRequest(loadRecentDoses, 'Não foi possível carregar os registros recentes.');
  useForbiddenSync(summary.error?.status ?? recent.error?.status);
  const data = summary.data;
  const reloadSummary = summary.reload;
  const reloadRecent = recent.reload;

  // Voltando de uma confirmação, os números e os registros já aparecem atualizados
  const reloadAll = useCallback(
    (options?: { refreshing?: boolean }) => {
      reloadSummary(options);
      reloadRecent(options);
    },
    [reloadSummary, reloadRecent],
  );
  useReloadOnFocus(reloadAll);

  const openOverdue = (grupo?: 'aguardando') =>
    router.navigate({ pathname: '/profissional/busca-ativa', params: grupo ? { grupo } : {} });

  return (
    <Screen
      edges={['top']}
      refreshing={summary.isRefreshing || recent.isRefreshing}
      onRefresh={() => reloadAll({ refreshing: true })}
    >
      <PageHeading
        eyebrow="Central de vacinação"
        title={`Olá, ${firstName}`}
        subtitle="Registre aplicações, consulte cadernetas e acompanhe as doses pendentes."
      />

      <ActionCard
        highlighted
        icon="needle"
        title="Registrar vacinação"
        description="Localize o cidadão e confirme uma dose aplicada."
        onPress={() => router.navigate('/profissional/cidadaos')}
      />
      <ActionCard
        icon="time-outline"
        title="Busca ativa"
        description="Cidadãos com doses atrasadas ou aguardando conferência."
        onPress={() => openOverdue()}
      />

      <View style={styles.section}>
        <Text style={typography.subtitle} accessibilityRole="header">
          Indicadores
        </Text>
        {!data ? (
          summary.error ? (
            <StateMessage
              variant="error"
              title="Não foi possível carregar os indicadores"
              message={summary.error.message}
              action={{ label: 'Tentar novamente', icon: 'refresh', onPress: () => summary.reload() }}
            />
          ) : (
            <StateMessage variant="loading" title="Carregando indicadores..." />
          )
        ) : (
          <>
            {summary.error && <Banner tone="danger" title="Não foi possível atualizar" message={summary.error.message} />}
            <StatTile
              title="Cadernetas"
              value={formatNumber(data.totalCadernetas)}
              icon="people-outline"
              description="Cidadãos com caderneta no Vacinei!?"
            />
            <StatTile
              title="Vacinas registradas"
              value={formatNumber(data.totalVacinasRegistradas)}
              icon="needle"
              description="Doses registradas nas cadernetas"
            />
            <StatTile
              title="Doses atrasadas"
              value={formatNumber(data.totalDosesAtrasadas)}
              icon="alert-circle-outline"
              tone={data.totalDosesAtrasadas > 0 ? 'danger' : 'primary'}
              description="Vencidas e sem nenhum registro"
              onPress={() => openOverdue()}
              accessibilityHint="Abre a busca ativa das doses atrasadas"
            />
            <StatTile
              title="Aguardando conferência"
              value={formatNumber(data.totalDosesAguardandoConferencia)}
              icon="hourglass-outline"
              tone={data.totalDosesAguardandoConferencia > 0 ? 'warning' : 'primary'}
              description="Informadas pelo cidadão, sem confirmação"
              onPress={() => openOverdue('aguardando')}
              accessibilityHint="Abre a busca ativa das doses aguardando conferência"
            />
          </>
        )}
      </View>

      <RecentDosesCard doses={recent.data} error={recent.error?.message ?? null} onRetry={() => recent.reload()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
});
