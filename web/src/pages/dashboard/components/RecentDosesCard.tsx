import React from 'react';
import { Syringe } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../../components/ui/CardState';
import { useAsync } from '../../../hooks/useAsync';
import { getRecentDoses } from '../../../services/dashboard';
import { formatDate } from '../../../utils/format';

const RECENT_DOSES_LIMIT = 8;
const fetchRecentDoses = () => getRecentDoses(RECENT_DOSES_LIMIT);

// Registro sem CONFIRMADO foi lançado pelo cidadão e aguarda um profissional (RF007, nota 7).
// O /dashboard/recent-doses não retorna `origin`, então a distinção é feita pelo status.
function StatusBadge({ status }: { status: string }) {
  return status === 'CONFIRMADO' ? (
    <Badge variant="accent">Confirmado</Badge>
  ) : (
    <Badge variant="warning">Aguardando confirmação</Badge>
  );
}

// Exclusivo do PROFISSIONAL_SAUDE: identifica cidadãos com dados de saúde (LGPD)
export const RecentDosesCard: React.FC = () => {
  const { data, isLoading, error, reload } = useAsync(
    fetchRecentDoses,
    'Não foi possível carregar as doses recentes.'
  );

  return (
    <Card title="Doses recentes" description="Últimas aplicações registradas" className="h-full">
      {isLoading ? (
        <CardLoading label="Carregando doses..." />
      ) : error ? (
        <CardError message={error.message} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <CardEmpty icon={Syringe} message="Nenhuma dose registrada recentemente." />
      ) : (
        <ul className="divide-y divide-border -my-1">
          {data.map((dose) => (
            <li key={dose.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary-dark truncate">{dose.citizen.name}</p>
                <p className="text-sm text-muted">
                  {dose.vaccine.name} · {dose.dose.doseName}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusBadge status={dose.status} />
                <time dateTime={dose.applicationDate} className="text-xs text-muted">
                  {formatDate(dose.applicationDate)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default RecentDosesCard;
