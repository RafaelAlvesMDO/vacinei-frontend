export type Sex = 'MASCULINO' | 'FEMININO';

export type Relationship = 'FILHO' | 'PAI_MAE' | 'CONJUGE' | 'CURATELADO' | 'OUTRO';

// GET /dependents: dependente do usuário logado (D33), um cidadão sem login. O CPF vem completo,
// porque o responsável é o titular desses dados (D14)
export interface Dependent {
  id: string;
  name: string;
  birthDate: string;
  cpf: string | null;
  sex: Sex;
  relationship: Relationship | null;
  createdAt: string;
  updatedAt: string;
}

// POST e PUT /dependents. No PUT, `cpf` e `relationship` omitidos ficam nulos
export interface DependentPayload {
  name: string;
  birthDate: string;
  sex: Sex;
  cpf: string | null;
  relationship: Relationship;
}
