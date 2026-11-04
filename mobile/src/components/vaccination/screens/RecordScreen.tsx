import { router, useLocalSearchParams } from 'expo-router';
import { Screen, StateMessage, StepHeader } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { VaccineRecordFlow } from '@/components/vaccination/VaccineRecordFlow';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import type { VaccinationCard } from '@/types/vaccination';
import { getCardTexts } from '@/utils/vaccination';

type Params = { vaccineId?: string; recordId?: string };

function findRecord(card: VaccinationCard, recordId: string) {
  for (const item of card.vaccines) {
    const record = item.records.find((candidate) => candidate.id === recordId);
    if (record) return record;
  }
  return null;
}

/**
 * Cadastro manual (RF005): `?vaccineId=` já preenche a vacina (detalhe da vacina) e
 * `?recordId=` edita um registro ainda não confirmado (D30). Serve ao titular e aos dependentes (D33)
 */
export function RecordScreen() {
  const { vaccineId, recordId } = useLocalSearchParams<Params>();
  const { owner, paths, card, error, reload } = useVaccinationCard();
  const texts = getCardTexts(owner.kind === 'self', card?.citizen.name);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(paths.card));

  if (!card) {
    return (
      <Screen header={<StepHeader title={recordId ? 'Editar registro' : 'Cadastrar vacina'} onBack={goBack} />}>
        <CardLoadState error={error} onRetry={() => reload()} loadingTitle={texts.loadingTitle} />
      </Screen>
    );
  }

  if (!recordId) {
    return <VaccineRecordFlow card={card} initialValues={{ vaccineId }} onExit={goBack} />;
  }

  const record = findRecord(card, recordId);
  if (!record || record.status === 'CONFIRMADO') {
    return (
      <Screen header={<StepHeader title="Editar registro" onBack={goBack} />}>
        <StateMessage
          variant="empty"
          icon={record ? 'lock-closed-outline' : 'search'}
          title={record ? 'Registro confirmado' : 'Registro não encontrado'}
          message={
            record
              ? 'Este registro já foi confirmado por um profissional de saúde e não pode mais ser alterado.'
              : `Este registro não está mais ${texts.inCard}.`
          }
          action={{ label: 'Voltar', icon: 'arrow-back', onPress: goBack }}
        />
      </Screen>
    );
  }

  const cardVaccine = card.vaccines.find((item) => item.records.includes(record));
  return (
    <VaccineRecordFlow
      card={card}
      recordId={record.id}
      initialValues={{
        vaccineId: cardVaccine?.vaccine.id,
        doseId: record.dose.id,
        applicationDate: record.applicationDate ?? undefined,
        lote: record.lotNumber ?? undefined,
      }}
      onExit={goBack}
    />
  );
}
