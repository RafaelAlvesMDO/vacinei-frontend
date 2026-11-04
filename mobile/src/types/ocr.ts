// POST /vaccination-records/ocr (RF004, D34): sugestões de doses lidas da foto da caderneta. Nada é gravado

export type OcrModelId = 'caderneta-crianca-ms' | 'caderneta-maceio-jovens-adultos';

export type OcrFallbackReason = 'MODELO_NAO_RECONHECIDO' | 'NENHUMA_DOSE_ENCONTRADA';

export type OcrAlignmentQuality = 'BOA' | 'RAZOAVEL' | 'BAIXA';

// Recortes vêm como data URI (PNG em escala de cinza), prontos para o <Image>
export interface OcrField {
  // `null` quando a leitura teve baixa confiança ou o valor é inválido: o cidadão preenche olhando o recorte
  value: string | null;
  confidence: number;
  crop: string | null;
}

export interface OcrDose {
  cellId: string;
  // FIXED: vacina e dose impressas no modelo; FREE: bloco em que a vacina é escrita à mão
  kind: 'FIXED' | 'FREE';
  printedLabel: string;
  vaccine: {
    id: string | null;
    name: string | null;
    source: 'TEMPLATE' | 'OCR';
    confidence: number;
    crop: string | null;
  };
  dose: { id: string; doseNumber: number; name: string; printedLabel: string | null } | null;
  // `value` em YYYY-MM-DD
  applicationDate: OcrField;
  // `value` em maiúsculas (1 a 20 letras e números)
  lote: OcrField;
  cellCrop: string | null;
  // Menor confiança entre os campos sugeridos; enviada ao salvar
  ocrConfidence: number;
}

export interface OcrResult {
  model: { id: OcrModelId | string; name: string } | null;
  manualFallback: boolean;
  fallbackReason: OcrFallbackReason | null;
  alignment: { page: string; quality: OcrAlignmentQuality }[];
  cellsChecked: number;
  doses: OcrDose[];
}
