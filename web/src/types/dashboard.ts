import type { PaginatedList, PaginationParams } from './pagination';

// GET /dashboard/summary
export interface DashboardSummary {
  totalCadernetas: number;
  totalVacinasRegistradas: number;
  totalDosesAtrasadas: number;
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

// GET /dashboard/overdue (busca ativa, D21): vacina com a próxima dose atrasada
export interface OverdueVaccine {
  vaccineId: string;
  vaccineName: string;
  nextDose: { id: string; doseName: string };
  nextDoseDate: string;
  daysOverdue: number;
}

// Pessoa com ao menos uma vacina ATRASADA. O CPF já vem mascarado e não há `role`
export interface OverduePerson {
  id: string;
  name: string;
  cpf: string | null;
  maxDaysOverdue: number;
  overdueVaccines: OverdueVaccine[];
}

// Paginado (D22). Os totais consideram todos os resultados do filtro, não só a página (`totalPessoas` = `total`)
export interface OverdueList extends PaginatedList<OverduePerson> {
  totalPessoas: number;
  totalDosesAtrasadas: number;
}

export interface OverdueParams extends PaginationParams {
  search?: string;
}
