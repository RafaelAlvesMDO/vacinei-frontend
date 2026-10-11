import type { ProfessionalVerificationStatus } from './auth';

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
