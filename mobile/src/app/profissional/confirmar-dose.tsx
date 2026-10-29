import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { ConfirmDoseFlow, type PendingRecord } from '@/components/professional/ConfirmDoseFlow';
import { VerifiedOnly } from '@/components/professional/VerifiedOnly';
import { Screen, StateMessage, StepHeader } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { useAuth } from '@/hooks/useAuth';
import { useCitizenCard } from '@/hooks/useCitizenCard';
import { useVaccineCatalog } from '@/hooks/useVaccineCatalog';
import type { VaccinationCard } from '@/types/vaccination';

/**
 * Registrar vacinação, etapas 2 e 3 (RF010). `?vaccineId=` sugere a vacina; `?recordId=` confirma o registro
 * do cidadão com a vacina e a dose fixas
 */
export default function ConfirmDoseScreen() {
  return (
    <VerifiedOnly>
      <ConfirmDoseContent />
    </VerifiedOnly>
  );
}

function findPendingRecord(card: VaccinationCard, recordId: string): PendingRecord | null {
  for (const item of card.vaccines) {
    const record = item.records.find((candidate) => candidate.id === recordId);
    if (record && record.status !== 'CONFIRMADO') {
      return { vaccineId: item.vaccine.id, vaccineName: item.vaccine.name, record };
    }
  }
  return null;
}

function ConfirmDoseContent() {
  const { citizenId, vaccineId, recordId } = useLocalSearchParams<{
    citizenId: string;
    vaccineId?: string;
    recordId?: string;
  }>();
  const { user } = useAuth();
  const { data: card, errorMessage, reload } = useCitizenCard(citizenId);
  const catalog = useVaccineCatalog();

  const exit = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/profissional/cidadao/[citizenId]', params: { citizenId } });
  const goToPanel = () => {
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/profissional/painel');
  };

  const blocked = (title: string, message: string) => (
    <Screen header={<StepHeader title="Registrar vacinação" onBack={exit} />}>
      <StateMessage
        variant="empty"
        icon="shield-outline"
        title={title}
        message={message}
        action={{ label: 'Voltar à caderneta', icon: 'arrow-back', onPress: exit }}
      />
    </Screen>
  );

  // RS006 (D11): a API também recusa com 403
  if (user?.id === citizenId) {
    return blocked(
      'Confirmação não permitida',
      'Você não pode confirmar a própria vacinação. Outro profissional de saúde deve conferir as suas doses.',
    );
  }

  if (!card) {
    return (
      <Screen header={<StepHeader title="Registrar vacinação" onBack={exit} />}>
        <CardLoadState error={errorMessage} onRetry={() => reload()} loadingTitle="Carregando a caderneta..." />
      </Screen>
    );
  }

  return (
    <LoadedFlow
      card={card}
      recordId={recordId ?? null}
      blocked={blocked}
      flowProps={{
        catalog: catalog.vaccines,
        catalogError: catalog.error,
        onReloadCatalog: catalog.reload,
        onReloadCard: () => reload(),
        initialVaccineId: vaccineId ?? null,
        professionalName: user?.name ?? '—',
        onExit: exit,
        onGoToPanel: goToPanel,
      }}
    />
  );
}

type FlowProps = Omit<ComponentProps<typeof ConfirmDoseFlow>, 'card' | 'pendingRecord'>;

interface LoadedFlowProps {
  card: VaccinationCard;
  recordId: string | null;
  blocked: (title: string, message: string) => ReactNode;
  flowProps: FlowProps;
}

// O registro do cidadão é lido uma vez, na chegada da caderneta: depois de confirmado, a caderneta recarregada
// já o traz como CONFIRMADO, e a tela de sucesso precisa continuar
function LoadedFlow({ card, recordId, blocked, flowProps }: LoadedFlowProps) {
  const [pendingRecord] = useState(() => (recordId ? findPendingRecord(card, recordId) : null));

  if (recordId && !pendingRecord) {
    return blocked('Registro já conferido', 'Este registro já foi confirmado ou não está mais na caderneta do cidadão.');
  }
  return <ConfirmDoseFlow card={card} pendingRecord={pendingRecord} {...flowProps} />;
}
