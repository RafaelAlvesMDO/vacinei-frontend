// Status de uma vacina na caderneta (calculado pela API)
export type VaccineScheduleStatus = 'EM_DIA' | 'ATRASADA' | 'COMPLETA';

// Status de um registro de aplicação: CONFIRMADO = conferido por profissional (RF010)
export type RecordStatus = VaccineScheduleStatus | 'CONFIRMADO';

export type RecordOrigin = 'MANUAL' | 'OCR_ICR' | 'SISTEMA_PRESENCIAL';

export interface DoseSummary {
  id: string;
  doseNumber: number;
  doseName: string;
}

export interface CardRecord {
  id: string;
  status: RecordStatus;
  origin: RecordOrigin;
  applicationDate: string | null;
  lotNumber: string | null;
  dose: DoseSummary;
  ubs: { id: string; name: string } | null;
  appliedBy: { id: string; name: string } | null;
}

// Situação para os alertas (D32): só a dose confirmada encerra a pendência. AGUARDANDO_CONFERENCIA = doses
// informadas pelo cidadão e não confirmadas, sem dose vencida sem registro
export type AlertStatus = 'ATRASADA' | 'AGUARDANDO_CONFERENCIA' | 'EM_DIA' | 'COMPLETA';

export interface PendingDose extends DoseSummary {
  applicationDate: string | null;
}

export interface CardVaccine {
  vaccine: { id: string; name: string; targetDisease: string; dosesCount: number };
  // Esquema: todo registro conta como aplicado. É a base da próxima dose e da data prevista
  status: VaccineScheduleStatus;
  appliedDoses: number;
  totalDoses: number;
  lastDose: (DoseSummary & { applicationDate: string | null }) | null;
  // Dose seguinte ao último registro (nunca tem registro)
  nextDose: DoseSummary | null;
  nextDoseDate: string | null;
  alert: { status: AlertStatus; pendingDoses: PendingDose[] };
  records: CardRecord[];
}

// GET /citizens/:id/vaccination-records
export interface VaccinationCard {
  citizen: { id: string; name: string; birthDate: string | null };
  summary: { totalVaccines: number; emDia: number; atrasadas: number; completas: number };
  vaccines: CardVaccine[];
}

// GET /vaccines: vacina ativa do catálogo, com as doses em ordem
export interface CatalogDose extends DoseSummary {
  recommendedAgeMonths: number | null;
  intervalDaysFromPrevious: number | null;
}

export interface CatalogVaccine {
  id: string;
  name: string;
  targetDisease: string;
  dosesCount: number;
  isActive: boolean;
  doses: CatalogDose[];
}

// POST e PUT /vaccination-records (cadastro manual pelo titular, D30). Sem o lote, ele fica nulo
export interface ManualRecordPayload {
  vaccineId: string;
  doseId: string;
  applicationDate: string;
  lote?: string;
}

export interface SavedRecord {
  id: string;
  status: RecordStatus;
  origin: RecordOrigin;
  applicationDate: string;
  lotNumber: string | null;
  dose: DoseSummary & { vaccine: { id: string; name: string } };
}
