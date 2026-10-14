import React from 'react';
import { Link } from 'react-router-dom';
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
        // Container query: com o card estreito (celular ou meia tela), badge e data vão para a linha de baixo
        <ul className="@container divide-y divide-border -my-1">
          {data.map((dose) => (
            <li key={dose.id} className="py-3 flex flex-col gap-1.5 @sm:flex-row @sm:items-start @sm:justify-between @sm:gap-3">
              <div className="min-w-0">
                {/* RF009 nota 4: o nome abre a caderneta do cidadão */}
                <Link
                  to={`/confirmar-vacina?citizenId=${encodeURIComponent(dose.citizen.id)}`}
                  title={`Abrir a caderneta de ${dose.citizen.name}`}
                  className="block truncate rounded text-sm font-semibold text-primary-dark hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {dose.citizen.name}
                </Link>
                <p className="text-sm text-muted break-words">
                  {dose.vaccine.name} · {dose.dose.doseName}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 @sm:shrink-0 @sm:flex-col @sm:items-end @sm:gap-1.5">
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
