import type { ProfessionalCategory, ProfessionalRegistryInfo } from '@/types/professional';

/**
 * { council: "COREN", registryNumber: "654321", uf: "AL" } → "COREN 654321/AL"
 */
export function formatRegistry({ council, registryNumber, uf }: ProfessionalRegistryInfo): string {
  return `${council} ${registryNumber}/${uf}`;
}

export interface ProfessionalCategoryOption {
  value: ProfessionalCategory;
  label: string;
  // Só informativo: o backend deriva o conselho da categoria (D12)
  council: string;
}

// Categorias aceitas no cadastro (D13)
export const PROFESSIONAL_CATEGORIES: ProfessionalCategoryOption[] = [
  { value: 'MEDICO', label: 'Médico(a)', council: 'CRM' },
  { value: 'ENFERMEIRO', label: 'Enfermeiro(a)', council: 'COREN' },
  { value: 'TECNICO_ENFERMAGEM', label: 'Técnico(a) de Enfermagem', council: 'COREN' },
  { value: 'AUXILIAR_ENFERMAGEM', label: 'Auxiliar de Enfermagem', council: 'COREN' },
  { value: 'FARMACEUTICO', label: 'Farmacêutico(a)', council: 'CRF' },
];

export const BRAZILIAN_UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const;
