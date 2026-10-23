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
