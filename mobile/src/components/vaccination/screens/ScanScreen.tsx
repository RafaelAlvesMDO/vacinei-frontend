import { router } from 'expo-router';
import { ScanFlow } from '@/components/ocr/ScanFlow';
import { Screen, StepHeader } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { getCardTexts } from '@/utils/vaccination';

/**
 * Digitalizar a caderneta física (RF004, D34). Serve ao titular e aos dependentes (D33): a leitura é a mesma,
 * e quem define o dono das doses é a rota de salvamento
 */
export function ScanScreen() {
  const { owner, paths, card, error, reload } = useVaccinationCard();
  const texts = getCardTexts(owner.kind === 'self', card?.citizen.name);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(paths.card));

  if (!card) {
    return (
      <Screen header={<StepHeader title="Digitalizar caderneta" onBack={goBack} />}>
        <CardLoadState error={error} onRetry={() => reload()} loadingTitle={texts.loadingTitle} />
      </Screen>
    );
  }

  return <ScanFlow card={card} onExit={goBack} />;
}
