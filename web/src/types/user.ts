import type { UserRole } from './auth';
import type { ProfessionalCategory } from './professional';

// Registro profissional como vem no GET /users (linha completa do banco, sem `verificationStatus`)
export interface UserProfessionalRegistry {
  category: ProfessionalCategory;
  council: string;
  registryNumber: string;
  uf: string;
  isVerified: boolean;
  rejectedAt: string | null;
}

// Item do GET /users (só ADMIN). LGPD: apenas dados cadastrais, com o CPF mascarado ("***.123.456-**")
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  professionalRegistry: UserProfessionalRegistry | null;
}

export interface UserListPage {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  users: ManagedUser[];
}

// Resposta do PUT /users/:id
export interface UpdatedUser {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  birthDate: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  updatedAt: string;
}
