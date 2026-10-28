import React, { useEffect } from 'react';
import { AlertTriangle, BookOpen, CalendarCheck, Syringe } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardSummary, getMonthlyTotals } from '../../services/dashboard';
import { formatMonthLong, formatNumber } from '../../utils/format';
import { CitizenSearch } from '../../components/citizens/CitizenSearch';
import { MonthlyChart } from './components/MonthlyChart';
import { PendingProfessionalsCard } from './components/PendingProfessionalsCard';
import { QuickActions } from './components/QuickActions';
import { RecentDosesCard } from './components/RecentDosesCard';
import { VerificationNotice } from '../../components/feedback/VerificationNotice';

const PAGE_TITLE = 'Dashboard';
const PAGE_SUBTITLE = 'Visão geral da vacinação';

export const Dashboard: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const isAdmin = user?.role === 'ADMIN';
  const isProfessional = user?.role === 'PROFISSIONAL_SAUDE';
  const registryStatus = user?.professionalRegistry?.status;
  const canViewDashboard = isAdmin || (isProfessional && registryStatus === 'VERIFICADO');

  const summary = useAsync(getDashboardSummary, 'Não foi possível carregar os indicadores.', canViewDashboard);
  const monthly = useAsync(getMonthlyTotals, 'Não foi possível carregar os registros mensais.', canViewDashboard);

  // 403 para o profissional indica que a verificação mudou desde o login: sincroniza o perfil
  const isForbidden = isProfessional && (summary.error?.status === 403 || monthly.error?.status === 403);
  useEffect(() => {
    if (isForbidden) refreshProfile().catch(() => undefined);
  }, [isForbidden, refreshProfile]);

  if (!user) return null;

  if (isProfessional && (!canViewDashboard || isForbidden)) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />
        <VerificationNotice status={registryStatus === 'RECUSADO' ? 'RECUSADO' : 'PENDENTE'} />
      </div>
    );
  }

  const summaryError = summary.error?.message ?? null;
  const currentMonth = monthly.data?.at(-1);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} actions={isProfessional ? <CitizenSearch /> : undefined} />

      <div className="grid grid-cols-2 gap-4 lg:gap-6 xl:grid-cols-4">
        <StatCard
          title="Cadernetas cadastradas"
          icon={BookOpen}
          value={summary.data ? formatNumber(summary.data.totalCadernetas) : null}
          isLoading={summary.isLoading}
          error={summaryError}
          onRetry={summary.reload}
        />
        <StatCard
          title="Vacinas registradas"
          icon={Syringe}
          value={summary.data ? formatNumber(summary.data.totalVacinasRegistradas) : null}
          isLoading={summary.isLoading}
          error={summaryError}
          onRetry={summary.reload}
        />
        <StatCard
          title="Doses atrasadas"
          icon={AlertTriangle}
          variant="danger"
          value={summary.data ? formatNumber(summary.data.totalDosesAtrasadas) : null}
          // Só doses sem nenhum registro; as informadas pelo cidadão ficam à parte (D32)
          description={
            summary.data
              ? `+ ${formatNumber(summary.data.totalDosesAguardandoConferencia)} aguardando conferência`
              : undefined
          }
          isLoading={summary.isLoading}
          error={summaryError}
          onRetry={summary.reload}
          // Só o profissional acessa a lista nominal (busca ativa); o ADMIN vê apenas o total (LGPD, D21)
          to={isProfessional ? '/confirmar-vacina' : undefined}
          linkLabel="Ver busca ativa"
        />
        <StatCard
          title="Registros neste mês"
          icon={CalendarCheck}
          value={monthly.data ? formatNumber(currentMonth?.total ?? 0) : null}
          description={currentMonth ? formatMonthLong(currentMonth.month) : undefined}
          isLoading={monthly.isLoading}
          error={monthly.error?.message ?? null}
          onRetry={monthly.reload}
        />
      </div>

      {/* grid-cols-1 (minmax(0, 1fr)): sem ele, a coluna implícita cresce com o gráfico e vaza da tela */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <MonthlyChart
            data={monthly.data}
            isLoading={monthly.isLoading}
            error={monthly.error?.message ?? null}
            onRetry={monthly.reload}
          />
          <QuickActions role={user.role} />
        </div>

        {isAdmin ? <PendingProfessionalsCard /> : <RecentDosesCard />}
      </div>
    </div>
  );
};

export default Dashboard;
