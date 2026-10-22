import type { ProfessionalVerificationStatus } from './auth';
import type { PaginatedList, PaginationParams } from './pagination';

// Categorias aceitas pelo backend (D13); o conselho é derivado delas (D12)
export type ProfessionalCategory =
  | 'MEDICO'
  | 'ENFERMEIRO'
  | 'TECNICO_ENFERMAGEM'
  | 'AUXILIAR_ENFERMAGEM'
  | 'FARMACEUTICO';

// Body do POST /users para o cadastro público de profissional (RF001)
export interface RegisterProfessionalPayload {
  name: string;
  email: string;
  password: string;
  // Só números: DDD + 9 dígitos
  phone: string;
  // Só números (11 dígitos)
  cpf: string;
  // YYYY-MM-DD, não pode ser futura
  birthDate: string;
  // Consentimento à Política de Privacidade, obrigatório (D26)
  acceptedPrivacyPolicy: true;
  role: 'PROFISSIONAL_SAUDE';
  professionalRegistry: {
    category: ProfessionalCategory;
    registryNumber: string;
    uf: string;
  };
}

export interface ProfessionalRegistryInfo {
  council: string;
  registryNumber: string;
  uf: string;
}

interface UserReference {
  id: string;
  name: string;
}

// Objeto Professional das rotas /professionals (exclusivas de ADMIN)
export interface Professional {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  category: string;
  registry: ProfessionalRegistryInfo;
  isVerified: boolean;
  verificationStatus: ProfessionalVerificationStatus;
  verifiedAt: string | null;
  verifiedBy: UserReference | null;
  rejectedAt: string | null;
  rejectedBy: UserReference | null;
  rejectionReason: string | null;
}

// GET /professionals: `counts` respeita `search`, mas não `status`
export interface ProfessionalListPage extends PaginatedList<Professional> {
  counts: Record<ProfessionalVerificationStatus, number>;
}

export interface ListProfessionalsParams extends PaginationParams {
  // Sem ele, todos
  status?: ProfessionalVerificationStatus;
  // Nome, sem diferenciar maiúsculas
  search?: string;
}
