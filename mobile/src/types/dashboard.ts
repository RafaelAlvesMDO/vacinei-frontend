import type { RecordStatus } from './vaccination';

// Lista paginada (D22): `total` conta todos os resultados do filtro
export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// GET /dashboard/summary
export interface DashboardSummary {
  totalCadernetas: number;
  totalVacinasRegistradas: number;
  // Vacinas com dose vencida sem nenhum registro (D32)
  totalDosesAtrasadas: number;
  // Doses informadas pelo cidadão e ainda não confirmadas
  totalDosesAguardandoConferencia: number;
}

// GET /dashboard/recent-doses. Status diferente de CONFIRMADO = registro do cidadão aguardando confirmação
export interface RecentDose {
  id: string;
  citizen: { id: string; name: string };
  vaccine: { id: string; name: string };
  dose: { id: string; doseNumber: number; doseName: string };
  applicationDate: string;
  status: RecordStatus;
}

// Grupos da busca ativa (D32): dose vencida sem registro ou informada pelo cidadão sem confirmação
export type OverdueGroup = 'ATRASADA' | 'AGUARDANDO_CONFERENCIA';

export interface OverduePendingDose {
  id: string;
  doseName: string;
  applicationDate: string | null;
}

// No grupo ATRASADA, `nextDose`, `nextDoseDate` e `daysOverdue` descrevem a dose atrasada; no
// AGUARDANDO_CONFERENCIA vêm null e as doses ficam em `pendingDoses`
export interface OverdueVaccine {
  vaccineId: string;
  vaccineName: string;
  nextDose: { id: string; doseName: string } | null;
  nextDoseDate: string | null;
  daysOverdue: number | null;
  pendingDoses: OverduePendingDose[];
}

// O CPF já vem mascarado. `maxDaysOverdue` é null no grupo AGUARDANDO_CONFERENCIA
export interface OverduePerson {
  id: string;
  name: string;
  cpf: string | null;
  maxDaysOverdue: number | null;
  vaccines: OverdueVaccine[];
}

// GET /dashboard/overdue: `counts` (pessoas) e `doseCounts` trazem os dois grupos com a busca aplicada
export interface OverdueList extends PaginatedList<OverduePerson> {
  counts: Record<OverdueGroup, number>;
  doseCounts: Record<OverdueGroup, number>;
}

export interface OverdueParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OverdueGroup;
}
