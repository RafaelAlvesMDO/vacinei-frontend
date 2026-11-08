import { useContext } from 'react';
import { VaccineAlertsContext, type VaccineAlertsContextValue } from '@/contexts/VaccineAlertsContext';

// No Perfil compartilhado: só a ala Cidadão tem as notificações da caderneta (null na ala Profissional)
export function useOptionalVaccineAlerts(): VaccineAlertsContextValue | null {
  return useContext(VaccineAlertsContext);
}
