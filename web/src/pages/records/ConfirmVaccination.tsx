import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CitizenSearch } from '../../components/citizens/CitizenSearch';
import { VerificationNotice } from '../../components/feedback/VerificationNotice';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { CardEmpty } from '../../components/ui/CardState';
import { useAuth } from '../../hooks/useAuth';
import { CitizenVaccinationCard } from './components/CitizenVaccinationCard';

const PAGE_TITLE = 'Confirmar vacina';
const PAGE_SUBTITLE = 'Confirmação presencial de doses aplicadas';

// Rota /confirmar-vacina (PROFISSIONAL_SAUDE verificado, RF010). ?citizenId= abre a caderneta direto
export const ConfirmVaccination: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const citizenId = searchParams.get('citizenId')?.trim() || null;

  const registryStatus = user?.professionalRegistry?.status;

  if (registryStatus !== 'VERIFICADO') {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />
        <VerificationNotice status={registryStatus === 'RECUSADO' ? 'RECUSADO' : 'PENDENTE'} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} actions={<CitizenSearch />} />

      {citizenId ? (
        // key: troca de cidadão reinicia a caderneta e os avisos
        <CitizenVaccinationCard key={citizenId} citizenId={citizenId} />
      ) : (
        <Card>
          <CardEmpty
            icon={Search}
            message="Busque o cidadão pelo nome ou CPF para abrir a caderneta e confirmar as doses aplicadas."
          />
        </Card>
      )}
    </div>
  );
};

export default ConfirmVaccination;
