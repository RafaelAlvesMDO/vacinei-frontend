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
