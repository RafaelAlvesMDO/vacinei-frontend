import { api } from './api';
import type { ApiSuccessResponse } from '../types/auth';
import type { ListUsersParams, OwnUser, UpdatedUser, UserListPage } from '../types/user';

/**
 * Página de usuários (apenas ADMIN), do cadastro mais recente ao mais antigo. Busca e filtros rodam na API (D22)
 */
export async function listUsers({ page, limit, role, isActive, search }: ListUsersParams = {}): Promise<UserListPage> {
  const response = await api.get<ApiSuccessResponse<UserListPage>>('/users', {
    params: { page, limit, role, isActive, search: search || undefined },
  });
  return response.data.data;
}

/**
 * Dados do próprio usuário (GET /users/me). Diferente do GET /auth/me, traz categoria, conselho, número e UF do registro
 */
export async function getOwnUser(): Promise<OwnUser> {
  const response = await api.get<ApiSuccessResponse<OwnUser>>('/users/me');
  return response.data.data;
}

/**
 * Ativa ou desativa a conta (PUT /users/:id). Desativar revoga as sessões do usuário
 */
export async function setUserStatus(id: string, isActive: boolean): Promise<UpdatedUser> {
  const response = await api.put<ApiSuccessResponse<UpdatedUser>>(`/users/${id}`, { isActive });
  return response.data.data;
}
