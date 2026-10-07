export type UserRole = 'PROFISSIONAL_SAUDE' | 'ADMIN' | 'CIDADAO';

export interface ProfessionalRegistry {
  id: string;
  councilType: string;
  councilNumber: string;
  councilState: string;
  occupation: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
  avatarUrl?: string | null;
  professionalRegistry?: ProfessionalRegistry | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiSuccessResponse<T> {
  status: 'success';
  data: T;
}
