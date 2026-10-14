// Status de uma vacina na caderneta (calculado pela API)
export type VaccineScheduleStatus = 'EM_DIA' | 'ATRASADA' | 'COMPLETA';

// Status de um registro de aplicação: CONFIRMADO = conferido por profissional (RF010)
export type RecordStatus = VaccineScheduleStatus | 'CONFIRMADO';

export type RecordOrigin = 'MANUAL' | 'OCR_ICR' | 'SISTEMA_PRESENCIAL';

export type TargetAudience = 'CRIANCA' | 'ADOLESCENTE' | 'ADULTO' | 'IDOSO' | 'GESTANTE' | 'ESPECIAL';

export interface DoseSummary {
  id: string;
  doseNumber: number;
  doseName: string;
}

// GET /vaccines: dose do esquema vacinal
export interface Dose extends DoseSummary {
  recommendedAgeMonths: number | null;
  intervalDaysFromPrevious: number | null;
  description: string | null;
}

// GET /vaccines: doses já vêm ordenadas
export interface Vaccine {
  id: string;
  name: string;
  description: string | null;
  targetAudience: TargetAudience;
  targetDisease: string;
  dosesCount: number;
  isActive: boolean;
  doses: Dose[];
}

// POST /vaccines: dose enviada no cadastro (doseNumber é único dentro da vacina)
export interface DosePayload {
  doseNumber: number;
  doseName: string;
  recommendedAgeMonths?: number | null;
  intervalDaysFromPrevious?: number | null;
  description?: string | null;
}

// POST /vaccines. O PUT aceita os mesmos campos, opcionais e sem `doses`, mais o `isActive`
export interface VaccinePayload {
  name: string;
  description?: string;
  targetAudience: TargetAudience;
  targetDisease: string;
  dosesCount: number;
  doses?: DosePayload[];
}

export type VaccineUpdatePayload = Partial<Omit<VaccinePayload, 'doses'>> & { isActive?: boolean };

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

export interface CardVaccine {
  vaccine: { id: string; name: string; targetDisease: string; dosesCount: number };
  status: VaccineScheduleStatus;
  appliedDoses: number;
  totalDoses: number;
  lastDose: (DoseSummary & { applicationDate: string | null }) | null;
  nextDose: DoseSummary | null;
  nextDoseDate: string | null;
  records: CardRecord[];
}

// GET /citizens/:id/vaccination-records
export interface VaccinationCard {
  citizen: { id: string; name: string; birthDate: string | null };
  summary: { totalVaccines: number; emDia: number; atrasadas: number; completas: number };
  vaccines: CardVaccine[];
}

// POST /vaccination-records/confirm
export interface ConfirmDosePayload {
  citizenId: string;
  vaccineId: string;
  doseId: string;
  lote: string;
}

export type ConfirmAction = 'CREATED' | 'CONFIRMED_EXISTING';

export interface ConfirmDoseResult {
  action: ConfirmAction;
  record: {
    id: string;
    status: RecordStatus;
    applicationDate: string | null;
    confirmedAt: string | null;
    lotNumber: string | null;
    dose: DoseSummary & { vaccine: { id: string; name: string } };
    appliedBy: { id: string; name: string } | null;
  };
}
