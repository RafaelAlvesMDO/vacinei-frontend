import { useContext } from 'react';
import { VaccinationCardContext, type VaccinationCardContextValue } from '@/contexts/VaccinationCardContext';

export function useVaccinationCard(): VaccinationCardContextValue {
  const context = useContext(VaccinationCardContext);
  if (!context) throw new Error('useVaccinationCard deve ser usado dentro do VaccinationCardProvider.');
  return context;
}
