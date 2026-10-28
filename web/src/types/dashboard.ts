import type { PaginatedList, PaginationParams } from './pagination';

// GET /dashboard/summary
export interface DashboardSummary {
  totalCadernetas: number;
  totalVacinasRegistradas: number;
  // Vacinas com dose vencida sem nenhum registro (D32)
  totalDosesAtrasadas: number;
  // Doses informadas pelo cidadão e ainda não confirmadas
  totalDosesAguardandoConferencia: number;
}

// GET /dashboard/monthly: um item por mês ("YYYY-MM"), últimos 12 meses
export interface MonthlyTotal {
  month: string;
  total: number;
}

// Valores do enum VaccineStatus do backend
export type VaccineStatus = 'EM_DIA' | 'ATRASADA' | 'COMPLETA' | 'CONFIRMADO';

// GET /dashboard/recent-doses
export interface RecentDose {
  id: string;
  citizen: { id: string; name: string };
  vaccine: { id: string; name: string };
  dose: { id: string; doseNumber: number; doseName: string };
  applicationDate: string;
  // Mantém string para exibir valores ainda não mapeados
  status: VaccineStatus | (string & {});
}

// Grupos da busca ativa (D32): dose vencida sem registro ou informada pelo cidadão sem confirmação
export type OverdueGroup = 'ATRASADA' | 'AGUARDANDO_CONFERENCIA';

// Dose informada pelo cidadão (MANUAL/OCR) e ainda não confirmada por um profissional
export interface PendingDose {
  id: string;
  doseName: string;
  applicationDate: string | null;
}

// GET /dashboard/overdue (busca ativa, D21). No grupo ATRASADA, `nextDose`, `nextDoseDate` e `daysOverdue`
// descrevem a dose atrasada; no AGUARDANDO_CONFERENCIA vêm null e as doses ficam em `pendingDoses`
export interface OverdueVaccine {
  vaccineId: string;
  vaccineName: string;
  nextDose: { id: string; doseName: string } | null;
  nextDoseDate: string | null;
  daysOverdue: number | null;
  pendingDoses: PendingDose[];
}

// O CPF já vem mascarado e não há `role`. `maxDaysOverdue` é null no grupo AGUARDANDO_CONFERENCIA
export interface OverduePerson {
  id: string;
  name: string;
  cpf: string | null;
  maxDaysOverdue: number | null;
  vaccines: OverdueVaccine[];
}

// Paginado (D22). `counts` (pessoas) e `doseCounts` trazem os dois grupos com a busca aplicada
export interface OverdueList extends PaginatedList<OverduePerson> {
  counts: Record<OverdueGroup, number>;
  doseCounts: Record<OverdueGroup, number>;
}

export interface OverdueParams extends PaginationParams {
  search?: string;
  status?: OverdueGroup;
}
