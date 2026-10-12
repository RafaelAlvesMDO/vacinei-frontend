import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../../components/ui/CardState';
import { useAsync } from '../../../hooks/useAsync';
import { listProfessionals } from '../../../services/professionals';

const fetchUnverifiedProfessionals = () => listProfessionals({ verified: false });

// Exclusivo do ADMIN: mostra apenas dados cadastrais, sem dados de saúde (LGPD)
export const PendingProfessionalsCard: React.FC = () => {
  const { data, isLoading, error, reload } = useAsync(
    fetchUnverifiedProfessionals,
    'Não foi possível carregar os profissionais pendentes.'
  );

  return (
    <Card
      title="Profissionais pendentes"
      description="Registros aguardando verificação"
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
      ) : !data || data.length === 0 ? (
        <CardEmpty icon={UserCheck} message="Nenhum profissional aguardando verificação." />
      ) : (
        <ul className="divide-y divide-border -my-1">
          {data.map((professional) => (
            <li key={professional.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary-dark truncate">{professional.name}</p>
                <p className="text-sm text-muted">
                  {professional.category} · {professional.registry.registryNumber}/{professional.registry.uf}
                </p>
              </div>
              {professional.verificationStatus === 'RECUSADO' ? (
                <Badge variant="danger">Recusado</Badge>
              ) : (
                <Badge variant="warning">Pendente</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default PendingProfessionalsCard;
