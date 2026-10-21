export type ProfessionalCategory =
  | 'MEDICO'
  | 'ENFERMEIRO'
  | 'TECNICO_ENFERMAGEM'
  | 'AUXILIAR_ENFERMAGEM'
  | 'FARMACEUTICO';

export interface ProfessionalRegistryInfo {
  council: string;
  registryNumber: string;
  uf: string;
}
