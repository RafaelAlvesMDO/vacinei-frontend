import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Linking } from 'react-native';
import { ConfirmDialog, Screen, StateMessage, StepHeader } from '@/components/ui';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { useVaccineCatalog } from '@/hooks/useVaccineCatalog';
import { parseApiError } from '@/services/auth';
import { discardPhoto, preparePhoto, type CardPhoto } from '@/services/cardPhoto';
import { createDependentRecord } from '@/services/dependents';
import { createRecord, readCardPhoto } from '@/services/vaccinationRecords';
import type { OcrResult } from '@/types/ocr';
import type { VaccinationCard } from '@/types/vaccination';
import { getCardTexts } from '@/utils/vaccination';
import {
  describeItem,
  getFallbackMessage,
  getOcrErrorMessage,
  toOcrPayload,
  toScanItems,
  validateScanItems,
  type ScanItem,
  type ScanMessage,
} from '@/utils/ocr';
import type { RecordFormValues } from '@/utils/vaccineRecord';
import { ItemEditor } from './ItemEditor';
import { PhotoPreview } from './PhotoPreview';
import { ReadingStep } from './ReadingStep';
import { ReviewStep } from './ReviewStep';
import { SaveResults, type SaveOutcome } from './SaveResults';
import { ScanFailure } from './ScanFailure';
import { ScanGuide, type CameraDenied } from './ScanGuide';

type Source = 'camera' | 'gallery';

type Step =
  | { name: 'guide' }
  | { name: 'preview'; source: Source }
  | { name: 'reading'; source: Source }
  | { name: 'failed'; failure: ScanMessage }
  | { name: 'review' }
  | { name: 'edit'; key: string }
  | { name: 'results' };

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 1,
  exif: false,
  allowsEditing: false,
};

interface Props {
  card: VaccinationCard;
  onExit: () => void;
}

/**
 * Digitalizar a caderneta (RF004, RNF05, RNF12, D34): orientação → foto → leitura → conferência → salvamento.
 * Cada dose conferida vira um registro pelas rotas do cadastro manual do dono da caderneta (titular ou
 * dependente), com origem OCR_ICR e aguardando conferência (D30). A foto não fica no aparelho depois do envio
 */
export function ScanFlow({ card, onExit }: Props) {
  const { owner, paths, reload: reloadCard } = useVaccinationCard();
  const isSelf = owner.kind === 'self';
  const texts = getCardTexts(isSelf, card.citizen.name);
  const subtitle = isSelf ? 'Sua caderneta' : `Caderneta de ${card.citizen.name}`;
  const { vaccines: catalog, error: catalogError, reload: reloadCatalog } = useVaccineCatalog();

  const [step, setStep] = useState<Step>({ name: 'guide' });
  const [busy, setBusy] = useState<Source | null>(null);
  const [cameraDenied, setCameraDenied] = useState<CameraDenied | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<CardPhoto | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [retrying, setRetrying] = useState(false);
  const [saving, setSaving] = useState<{ current: number; total: number } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<SaveOutcome[]>([]);
  const [confirmExit, setConfirmExit] = useState(false);

  // Foto atual, para apagá-la ao sair da tela (LGPD), e a leitura em andamento, para cancelar
  const photoRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      discardPhoto(photoRef.current);
    },
    [],
  );

  const replacePhoto = (next: CardPhoto | null) => {
    discardPhoto(photoRef.current);
    photoRef.current = next?.uri ?? null;
    setPhoto(next);
  };

  const errors = catalog ? validateScanItems(items, catalog, card) : {};

  const pick = async (source: Source) => {
    setPickError(null);
    setPreviewError(null);
    setBusy(source);
    try {
      if (source === 'camera') {
        // Pedido só agora, depois da explicação da etapa 1
        let permission = await ImagePicker.getCameraPermissionsAsync();
        if (!permission.granted && permission.canAskAgain) permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setCameraDenied({ canAskAgain: permission.canAskAgain });
          setStep({ name: 'guide' });
          return;
        }
        setCameraDenied(null);
      }
      // O seletor de fotos do sistema não exige permissão da galeria
      const picked =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      const asset = picked.canceled ? undefined : picked.assets[0];
      if (!asset) return;
      replacePhoto({ uri: asset.uri, width: asset.width, height: asset.height });
      setStep({ name: 'preview', source });
    } catch {
      setPickError(
        source === 'camera'
          ? 'Não foi possível abrir a câmera. Tente de novo ou escolha uma foto da galeria.'
          : 'Não foi possível abrir a galeria. Tente de novo.',
      );
      setStep({ name: 'guide' });
    } finally {
      setBusy(null);
    }
  };

  const fail = (failure: ScanMessage) => {
    replacePhoto(null);
    setStep({ name: 'failed', failure });
  };

  const read = async (source: Source) => {
    if (!photo) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setPreviewError(null);
    setPreparing(true);
    setStep({ name: 'reading', source });

    let prepared: CardPhoto | null = null;
    try {
      try {
        prepared = await preparePhoto(photo);
      } catch {
        if (controller.signal.aborted) return;
        setPreviewError('Tente de novo ou escolha outra foto.');
        setStep({ name: 'preview', source });
        return;
      }
      if (controller.signal.aborted) return;
      setPreparing(false);

      const data = await readCardPhoto(prepared.uri, controller.signal);
      if (controller.signal.aborted) return;
      if (data.manualFallback || data.doses.length === 0) {
        fail(getFallbackMessage(data.fallbackReason));
        return;
      }
      replacePhoto(null);
      setResult(data);
      setItems(toScanItems(data, card));
      setRetrying(false);
      setSaveError(null);
      setStep({ name: 'review' });
    } catch (reason) {
      if (controller.signal.aborted) return;
      fail(getOcrErrorMessage(parseApiError(reason, 'Não foi possível ler a caderneta. Tente de novo.')));
    } finally {
      // A cópia reduzida só existe para o envio
      discardPhoto(prepared?.uri);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  // Cancelar a leitura volta à foto, que continua no aparelho até sair do fluxo
  const cancelReading = (source: Source) => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStep({ name: 'preview', source });
  };

  const backToGuide = () => {
    replacePhoto(null);
    setStep({ name: 'guide' });
  };

  const openManual = () => {
    replacePhoto(null);
    router.replace(paths.record({}));
  };

  const goToCard = () => {
    if (router.canDismiss()) router.dismissAll();
    router.navigate(paths.card);
  };

  const updateItem = (key: string, patch: Partial<ScanItem>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  // Data e lote editados na lista; vacina e dose mudam só pelo editor completo
  const changeValues = (key: string, patch: Partial<RecordFormValues>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, values: { ...item.values, ...patch } } : item)));

  const save = async () => {
    if (!catalog) return;
    const toSave = items.filter((item) => item.selected && !errors[item.key]);
    // O botão só chama o salvamento sem pendências; a conferência repete a regra por segurança
    if (toSave.length === 0 || toSave.length !== items.filter((item) => item.selected).length) return;

    setSaveError(null);
    const done: SaveOutcome[] = [];
    for (const [index, item] of toSave.entries()) {
      setSaving({ current: index + 1, total: toSave.length });
      const { vaccine, dose } = describeItem(item, catalog);
      try {
        const payload = toOcrPayload(item);
        if (owner.kind === 'self') await createRecord(payload);
        else await createDependentRecord(owner.id, payload);
        done.push({ key: item.key, vaccine, dose, status: 'saved', message: null });
      } catch (reason) {
        const parsed = parseApiError(reason, 'Não foi possível salvar esta dose.');
        if (parsed.status === 409) {
          done.push({ key: item.key, vaccine, dose, status: 'duplicate', message: null });
        } else {
          const fieldMessages = Object.values(parsed.fieldErrors);
          const message = parsed.status === 400 && fieldMessages.length > 0 ? fieldMessages.join(' ') : parsed.message;
          done.push({ key: item.key, vaccine, dose, status: 'error', message });
        }
      }
    }
    setSaving(null);
    setOutcomes(done);
    setStep({ name: 'results' });
    reloadCard();
  };

  // Volta à revisão só com as doses que não foram salvas, com os dados que o cidadão já conferiu
  const retryFailed = () => {
    const failedKeys = new Set(outcomes.filter((outcome) => outcome.status === 'error').map((outcome) => outcome.key));
    setItems((current) => current.filter((item) => failedKeys.has(item.key)).map((item) => ({ ...item, selected: true })));
    setRetrying(true);
    setStep({ name: 'review' });
  };

  const requestExitFromReview = () => {
    if (saving) return;
    setConfirmExit(true);
  };

  // Voltar do Android em cada etapa, sem perder a leitura por engano
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      switch (step.name) {
        case 'preview':
          backToGuide();
          return true;
        case 'reading':
          cancelReading(step.source);
          return true;
        case 'review':
          requestExitFromReview();
          return true;
        case 'edit':
          setStep({ name: 'review' });
          return true;
        case 'results':
          goToCard();
          return true;
        default:
          return false;
      }
    });
    return () => subscription.remove();
  });

  const exitDialog = (
    <ConfirmDialog
      visible={confirmExit}
      title="Sair sem salvar?"
      message="As doses lidas que ainda não foram salvas serão descartadas. Para recuperá-las, será preciso fotografar a caderneta de novo."
      icon="exit-outline"
      confirmLabel="Sair"
      cancelLabel="Continuar conferindo"
      variant="danger"
      onConfirm={() => {
        setConfirmExit(false);
        onExit();
      }}
      onCancel={() => setConfirmExit(false)}
    />
  );

  switch (step.name) {
    case 'preview':
      return photo ? (
        <PhotoPreview
          photo={photo}
          subtitle={subtitle}
          error={previewError}
          onRetake={() => pick(step.source)}
          onUse={() => read(step.source)}
          onBack={backToGuide}
        />
      ) : null;

    case 'reading':
      return <ReadingStep subtitle={subtitle} preparing={preparing} onCancel={() => cancelReading(step.source)} />;

    case 'failed':
      return <ScanFailure subtitle={subtitle} failure={step.failure} onRetry={backToGuide} onManual={openManual} onBack={backToGuide} />;

    case 'edit': {
      const position = items.findIndex((item) => item.key === step.key) + 1;
      return (
        <ItemEditor
          items={items}
          itemKey={step.key}
          position={position}
          catalog={catalog}
          catalogError={catalogError}
          onReloadCatalog={reloadCatalog}
          card={card}
          onDone={(values) => {
            updateItem(step.key, { values, selected: true });
            setStep({ name: 'review' });
          }}
          onCancel={() => setStep({ name: 'review' })}
        />
      );
    }

    case 'review':
      if (!result) return null;
      if (!catalog) {
        return (
          <Screen header={<StepHeader title="Conferir doses" subtitle={subtitle} onBack={requestExitFromReview} step={{ current: 4, total: 4 }} />}>
            {catalogError ? (
              <StateMessage
                variant="error"
                title="Não foi possível carregar as vacinas"
                message={catalogError}
                action={{ label: 'Tentar novamente', icon: 'refresh', onPress: reloadCatalog }}
              />
            ) : (
              <StateMessage variant="loading" title="Carregando vacinas..." />
            )}
            {exitDialog}
          </Screen>
        );
      }
      return (
        <>
          <ReviewStep
            result={result}
            items={items}
            errors={errors}
            catalog={catalog}
            card={card}
            subtitle={subtitle}
            retrying={retrying}
            saving={saving}
            saveError={saveError}
            onToggle={(key, selected) => updateItem(key, { selected })}
            onChange={changeValues}
            onEdit={(key) => setStep({ name: 'edit', key })}
            onSave={save}
            onBack={requestExitFromReview}
          />
          {exitDialog}
        </>
      );

    case 'results':
      return <SaveResults outcomes={outcomes} viewCardLabel={texts.viewCard} onViewCard={goToCard} onRetryFailed={retryFailed} />;

    default:
      return (
        <ScanGuide
          subtitle={subtitle}
          busy={busy}
          cameraDenied={cameraDenied}
          pickError={pickError}
          onCamera={() => pick('camera')}
          onGallery={() => pick('gallery')}
          onManual={openManual}
          onOpenSettings={() => {
            Linking.openSettings().catch(() => undefined);
          }}
          onBack={onExit}
        />
      );
  }
}
