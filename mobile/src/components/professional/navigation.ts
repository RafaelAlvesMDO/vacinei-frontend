import { router } from 'expo-router';

// Caderneta de um cidadão na ala Profissional
export function openCitizenCard(citizenId: string) {
  router.push({ pathname: '/profissional/cidadao/[citizenId]', params: { citizenId } });
}

/**
 * Confirmação de dose (RF010): com `vaccineId`, a vacina vem sugerida; com `recordId`, confirma o registro
 * do cidadão (vacina e dose fixas)
 */
export function openConfirmDose(params: { citizenId: string; vaccineId?: string; recordId?: string }) {
  router.push({ pathname: '/profissional/confirmar-dose', params });
}
