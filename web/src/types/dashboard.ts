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

// Os totais consideram todos os resultados do filtro, não só os `items` retornados
export interface OverdueList {
  totalPessoas: number;
  totalDosesAtrasadas: number;
  items: OverduePerson[];
}

export interface OverdueParams {
  limit?: number;
  search?: string;
}
