import React from 'react';
import { Syringe } from 'lucide-react';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../../components/ui/CardState';
import { useAsync } from '../../../hooks/useAsync';
import { getRecentDoses } from '../../../services/dashboard';
import type { VaccineStatus } from '../../../types/dashboard';
import { formatDate } from '../../../utils/format';

const STATUS_BADGES: Record<VaccineStatus, { label: string; variant: BadgeVariant }> = {
  EM_DIA: { label: 'Em dia', variant: 'success' },
  ATRASADA: { label: 'Atrasada', variant: 'danger' },
  COMPLETA: { label: 'Completa', variant: 'primary' },
  CONFIRMADO: { label: 'Confirmado', variant: 'accent' },
};

const RECENT_DOSES_LIMIT = 8;
const fetchRecentDoses = () => getRecentDoses(RECENT_DOSES_LIMIT);

function isVaccineStatus(status: string): status is VaccineStatus {
  return Object.hasOwn(STATUS_BADGES, status);
}

// Valores fora do enum conhecido aparecem como texto cru
function StatusBadge({ status }: { status: string }) {
  if (!isVaccineStatus(status)) return <Badge>{status}</Badge>;
  const { label, variant } = STATUS_BADGES[status];
  return <Badge variant={variant}>{label}</Badge>;
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
