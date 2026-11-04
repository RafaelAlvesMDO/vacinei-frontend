import type { ParsedApiError } from '@/types/auth';
import type { OcrDose, OcrFallbackReason, OcrResult } from '@/types/ocr';
import type { CatalogVaccine, ManualRecordPayload, VaccinationCard } from '@/types/vaccination';
import {
  getTakenDoseIds,
  toFormValues,
  toRecordPayload,
  validateRecordForm,
  type RecordFormErrors,
  type RecordFormValues,
  type RecordInitialValues,
} from './vaccineRecord';

// Modelos de caderneta que a leitura reconhece (D34)
export const SUPPORTED_MODELS = [
  'Caderneta da Criança (Ministério da Saúde)',
  'Caderneta de Vacinação de Jovens e Adultos (Prefeitura de Maceió)',
] as const;

// Uma dose sugerida pela leitura, como o cidadão a confere na revisão
export interface ScanItem {
  key: string;
  suggestion: OcrDose;
  // Marcada para salvar
  selected: boolean;
  values: RecordFormValues;
}

export interface ScanMessage {
  title: string;
  message: string;
}

/**
 * Valores iniciais de uma sugestão: os campos com baixa confiança vêm `null` da API e ficam vazios (RF004)
 */
export function toInitialValues(dose: OcrDose): RecordInitialValues {
  return {
    vaccineId: dose.vaccine.id ?? undefined,
    doseId: dose.dose?.id ?? undefined,
    applicationDate: dose.applicationDate.value ?? undefined,
    lote: dose.lote.value ?? undefined,
  };
}

/**
 * Dose desta sugestão que já está na caderneta (a API responderia 409)
 */
export function isInCard(values: RecordFormValues, card: VaccinationCard): boolean {
  if (!values.vaccineId || !values.doseId) return false;
  const cardVaccine = card.vaccines.find((item) => item.vaccine.id === values.vaccineId);
  return getTakenDoseIds(cardVaccine, null).has(values.doseId);
}

/**
 * Itens da revisão na ordem da caderneta. Doses que já estão na caderneta começam desmarcadas
 */
export function toScanItems(result: OcrResult, card: VaccinationCard): ScanItem[] {
  return result.doses.map((suggestion, index) => {
    const values = toFormValues(toInitialValues(suggestion));
    return {
      key: `${suggestion.cellId}-${index}`,
      suggestion,
      selected: !isInCard(values, card),
      values,
    };
  });
}

/**
 * Valida só os itens marcados, com as regras do cadastro manual (D30) e sem repetir a mesma dose em dois itens.
 * Devolve os erros por item (chave do item); item sem erro não aparece
 */
export function validateScanItems(
  items: ScanItem[],
  catalog: CatalogVaccine[],
  card: VaccinationCard,
): Record<string, RecordFormErrors> {
  const result: Record<string, RecordFormErrors> = {};
  const chosen = new Set<string>();

  for (const item of items) {
    if (!item.selected) continue;
    const { values } = item;
    const vaccine = catalog.find((candidate) => candidate.id === values.vaccineId);
    const cardVaccine = card.vaccines.find((candidate) => candidate.vaccine.id === values.vaccineId);
    const errors = validateRecordForm(values, {
      vaccine,
      taken: getTakenDoseIds(cardVaccine, null),
      birthDate: card.citizen.birthDate,
    });

    if (!errors.doseId && values.doseId) {
      if (chosen.has(values.doseId)) errors.doseId = 'Esta dose já foi escolhida em outro item da lista.';
      else chosen.add(values.doseId);
    }
    if (Object.keys(errors).length > 0) result[item.key] = errors;
  }
  return result;
}

/**
 * Corpo do cadastro manual para uma dose conferida (D34): origem OCR_ICR e a confiança da leitura
 */
export function toOcrPayload(item: ScanItem): ManualRecordPayload {
  const confidence = Math.min(1, Math.max(0, item.suggestion.ocrConfidence));
  return { ...toRecordPayload(item.values), origin: 'OCR_ICR', ocrConfidence: confidence };
}

/**
 * Nome da vacina e da dose do item: o escolhido no catálogo ou, sem ele, o impresso na caderneta
 */
export function describeItem(item: ScanItem, catalog: CatalogVaccine[] | null): { vaccine: string; dose: string } {
  const vaccine = catalog?.find((candidate) => candidate.id === item.values.vaccineId);
  const dose = vaccine?.doses.find((candidate) => candidate.id === item.values.doseId);
  const { suggestion } = item;
  return {
    vaccine: vaccine?.name ?? suggestion.vaccine.name ?? 'Vacina não identificada',
    dose: dose?.doseName ?? (suggestion.dose?.printedLabel ? `${suggestion.dose.printedLabel} (escolha a dose)` : 'Dose não identificada'),
  };
}

export function hasLowAlignment(result: OcrResult): boolean {
  return result.alignment.some((page) => page.quality === 'BAIXA');
}

const MODELS_TEXT = `O app lê a ${SUPPORTED_MODELS[0]} e a ${SUPPORTED_MODELS[1]}.`;

const FALLBACK_MESSAGES: Record<OcrFallbackReason, ScanMessage> = {
  MODELO_NAO_RECONHECIDO: {
    title: 'Não reconhecemos esta caderneta',
    message: `${MODELS_TEXT} Se for uma delas, tente outra foto com a página inteira, plana, bem iluminada e sem sombra.`,
  },
  NENHUMA_DOSE_ENCONTRADA: {
    title: 'Nenhuma dose encontrada',
    message:
      'Reconhecemos a caderneta, mas não encontramos doses preenchidas na foto. Confira se a página com as vacinas aparece inteira ou cadastre as doses manualmente.',
  },
};

/**
 * Mensagem de quando a leitura não trouxe nada para revisar (`manualFallback: true`, RNF12)
 */
export function getFallbackMessage(reason: OcrFallbackReason | null): ScanMessage {
  return reason ? FALLBACK_MESSAGES[reason] : FALLBACK_MESSAGES.MODELO_NAO_RECONHECIDO;
}

/**
 * Mensagem de erro da leitura pelo `code` da API (RNF12). Em todos os casos o app oferece outra foto e o cadastro manual
 */
export function getOcrErrorMessage(error: ParsedApiError): ScanMessage {
  switch (error.code) {
    case 'OCR_INDISPONIVEL':
    case 'OCR_ERRO':
      return {
        title: 'Leitura indisponível agora',
        message: 'O serviço que lê a caderneta não respondeu. Tente de novo em alguns minutos ou cadastre as doses manualmente.',
      };
    case 'OCR_TIMEOUT':
    case 'TIMEOUT':
      return {
        title: 'A leitura demorou demais',
        message: 'Não conseguimos ler a foto a tempo. Verifique sua conexão e tente de novo, ou cadastre as doses manualmente.',
      };
    case 'IMAGEM_GRANDE':
      return {
        title: 'Foto grande demais',
        message: 'A foto passou do tamanho aceito. Tente tirar outra foto ou escolher outra imagem.',
      };
    case 'FORMATO_INVALIDO':
    case 'IMAGEM_INVALIDA':
    case 'IMAGEM_AUSENTE':
    case 'UPLOAD_INVALIDO':
      return {
        title: 'Não foi possível abrir a foto',
        message: 'A imagem enviada não pôde ser lida. Tire outra foto ou escolha uma imagem JPEG ou PNG.',
      };
    default:
      return { title: 'Não foi possível ler a caderneta', message: error.message };
  }
}
