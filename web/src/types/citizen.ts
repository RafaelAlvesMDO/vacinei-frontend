// GET /citizens?search=: CPF já vem mascarado pela API
export interface CitizenSearchResult {
  id: string;
  name: string;
  birthDate: string | null;
  cpf: string | null;
}
