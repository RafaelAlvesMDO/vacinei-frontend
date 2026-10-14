import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../../components/ui/CardState';
import { useAsync } from '../../../hooks/useAsync';
import { listProfessionals } from '../../../services/professionals';
import { formatNumber } from '../../../utils/format';

// Só a primeira página dos pendentes; o total vem da API (D22)
const PREVIEW_LIMIT = 5;
const fetchPendingProfessionals = () => listProfessionals({ status: 'PENDENTE', limit: PREVIEW_LIMIT });

// Exclusivo do ADMIN: mostra apenas dados cadastrais, sem dados de saúde (LGPD)
export const PendingProfessionalsCard: React.FC = () => {
  const { data, isLoading, error, reload } = useAsync(
    fetchPendingProfessionals,
    'Não foi possível carregar os profissionais pendentes.'
  );

  return (
    <Card
      title="Profissionais pendentes"
      description={
        data && data.total > 0
          ? `${formatNumber(data.total)} ${data.total === 1 ? 'registro aguardando' : 'registros aguardando'} verificação`
          : 'Registros aguardando verificação'
      }
      className="h-full"
      action={
        <Link
          to="/profissionais?status=pendentes"
          className="text-sm font-semibold text-primary hover:text-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Ver todos
        </Link>
      }
    >
      {isLoading ? (
        <CardLoading label="Carregando profissionais..." />
      ) : error ? (
        <CardError message={error.message} onRetry={reload} />
      ) : !data || data.items.length === 0 ? (
        <CardEmpty icon={UserCheck} message="Nenhum profissional aguardando verificação." />
      ) : (
        <>
          <ul className="divide-y divide-border -my-1">
            {data.items.map((professional) => (
              <li key={professional.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary-dark truncate">{professional.name}</p>
                  <p className="text-sm text-muted">
                    {professional.category} · {professional.registry.registryNumber}/{professional.registry.uf}
                  </p>
                </div>
                <Badge variant="warning">Pendente</Badge>
              </li>
            ))}
          </ul>
          {data.total > data.items.length && (
            <p className="mt-3 text-xs text-muted">
              E mais {formatNumber(data.total - data.items.length)} em Profissionais.
            </p>
          )}
        </>
      )}
    </Card>
  );
};

export default PendingProfessionalsCard;
