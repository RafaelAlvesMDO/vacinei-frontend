import { useContext } from 'react';
import { VaccineAlertsContext, type VaccineAlertsContextValue } from '@/contexts/VaccineAlertsContext';

export function useVaccineAlerts(): VaccineAlertsContextValue {
  const context = useContext(VaccineAlertsContext);
  if (!context) throw new Error('useVaccineAlerts deve ser usado dentro do VaccineAlertsProvider.');
  return context;
}

// No Perfil compartilhado: a ala Profissional não tem os alertas da caderneta
export function useOptionalVaccineAlerts(): VaccineAlertsContextValue | null {
  return useContext(VaccineAlertsContext);
}
