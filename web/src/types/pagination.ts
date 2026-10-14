// Formato único das listas paginadas no servidor (D22): GET /users, GET /professionals e GET /dashboard/overdue.
// `total` conta todos os resultados do filtro e `totalPages = ceil(total / limit)`
export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  // Padrão 20, máximo 100
  limit?: number;
}
