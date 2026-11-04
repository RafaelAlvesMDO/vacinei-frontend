import { router } from 'expo-router';
import { useState } from 'react';
import { OwnerPicker } from '@/components/ocr/OwnerPicker';
import { ScanFlow } from '@/components/ocr/ScanFlow';
import { Screen, StateMessage, StepHeader } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { VaccinationCardProvider, type CardOwner } from '@/contexts/VaccinationCardContext';
import { useAuth } from '@/hooks/useAuth';
import { useDependents } from '@/hooks/useDependents';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { getCardTexts } from '@/utils/vaccination';

function goBack(fallback: Parameters<typeof router.replace>[0]) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/**
 * Digitalizar a caderneta física (RF004, D34). Pela aba central, quem tem dependentes escolhe primeiro de quem é
 * a caderneta (D33); pela caderneta de um dependente, ele já é o dono. A leitura é a mesma: quem define o dono
 * das doses é a rota de salvamento
 */
export function ScanScreen() {
  const { owner } = useVaccinationCard();
  return owner.kind === 'dependent' ? <OwnerScan /> : <ScanFromTab />;
}

// Aberto pela aba "Digitalizar": pergunta o dono quando há dependentes
function ScanFromTab() {
  const { user } = useAuth();
  const { paths } = useVaccinationCard();
  const { dependents, isLoading } = useDependents();
  const [chosen, setChosen] = useState<CardOwner | null>(null);
  const exit = () => goBack(paths.card);

  // Sem a lista (ex.: falha ao carregar), segue com a própria caderneta; a do dependente tem o próprio botão
  if (!dependents && isLoading) {
    return (
      <Screen header={<StepHeader title="Digitalizar caderneta" onBack={exit} />}>
        <StateMessage variant="loading" title="Carregando..." />
      </Screen>
    );
  }

  const hasDependents = !!dependents && dependents.length > 0;
  if (hasDependents && !chosen) {
    return (
      <OwnerPicker
        userName={user?.name}
        dependents={dependents.map((item) => item.dependent)}
        onChooseSelf={() => setChosen({ kind: 'self' })}
        onChooseDependent={(dependent) => setChosen({ kind: 'dependent', id: dependent.id })}
        onBack={exit}
      />
    );
  }

  const backToPicker = hasDependents ? () => setChosen(null) : undefined;
  if (chosen?.kind === 'dependent') {
    // A caderneta do dependente escolhido, com as rotas dele (cadastro manual e "Ver caderneta")
    return (
      <VaccinationCardProvider owner={chosen}>
        <OwnerScan onGuideBack={backToPicker} onExit={exit} />
      </VaccinationCardProvider>
    );
  }
  return <OwnerScan onGuideBack={backToPicker} onExit={exit} />;
}

interface OwnerScanProps {
  // Voltar da orientação (etapa 1): à pergunta do dono, quando ela existiu
  onGuideBack?: () => void;
  onExit?: () => void;
}

// Fluxo com a caderneta do dono do provider mais próximo
function OwnerScan({ onGuideBack, onExit }: OwnerScanProps) {
  const { owner, paths, card, error, reload } = useVaccinationCard();
  const texts = getCardTexts(owner.kind === 'self', card?.citizen.name);
  const exit = onExit ?? (() => goBack(paths.card));

  if (!card) {
    return (
      <Screen header={<StepHeader title="Digitalizar caderneta" onBack={onGuideBack ?? exit} />}>
        <CardLoadState error={error} onRetry={() => reload()} loadingTitle={texts.loadingTitle} />
      </Screen>
    );
  }

  return <ScanFlow card={card} onExit={exit} onGuideBack={onGuideBack} />;
}
