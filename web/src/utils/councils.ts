import type { ProfessionalRegistryInfo } from '../types/professional';

/**
 * { council: "COREN", registryNumber: "654321", uf: "AL" } → "COREN 654321/AL"
 */
export function formatRegistry({ council, registryNumber, uf }: ProfessionalRegistryInfo): string {
  return `${council} ${registryNumber}/${uf}`;
}

export interface CouncilInfo {
  // Conselho federal responsável pela consulta pública dos registros
  name: string;
  url: string;
}

// Apenas a página inicial oficial de cada conselho federal
const COUNCILS: Record<string, CouncilInfo> = {
  CRM: { name: 'Conselho Federal de Medicina (CFM)', url: 'https://portal.cfm.org.br' },
  COREN: { name: 'Conselho Federal de Enfermagem (Cofen)', url: 'https://www.cofen.gov.br' },
  CRF: { name: 'Conselho Federal de Farmácia (CFF)', url: 'https://www.cff.org.br' },
  CRO: { name: 'Conselho Federal de Odontologia (CFO)', url: 'https://website.cfo.org.br' },
};

export function getCouncilInfo(council: string): CouncilInfo | null {
  return COUNCILS[council.trim().toUpperCase()] ?? null;
}
