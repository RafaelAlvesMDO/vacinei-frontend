import { api } from './api';
import type { ApiSuccessResponse } from '../types/auth';
import type { ManagedUser, OwnUser, UpdatedUser, UserListPage } from '../types/user';

// Máximo aceito pela API por página
const PAGE_LIMIT = 100;

async function fetchUsersPage(page: number): Promise<UserListPage> {
  const response = await api.get<ApiSuccessResponse<UserListPage>>('/users', {
    params: { page, limit: PAGE_LIMIT },
  });
  return response.data.data;
}

/**
 * Lista completa de usuários (apenas ADMIN), do cadastro mais recente ao mais antigo.
 * A API pagina e não filtra por `isActive`, então todas as páginas são buscadas e os filtros rodam no cliente
 */
export async function listAllUsers(): Promise<ManagedUser[]> {
  const first = await fetchUsersPage(1);
  const remainingPages = Array.from({ length: Math.max(first.totalPages - 1, 0) }, (_, index) => index + 2);
  const rest = await Promise.all(remainingPages.map(fetchUsersPage));
  return [first, ...rest].flatMap((page) => page.users);
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
