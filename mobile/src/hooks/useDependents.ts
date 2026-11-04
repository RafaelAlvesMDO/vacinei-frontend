import { useContext } from 'react';
import { DependentsContext, type DependentsContextValue } from '@/contexts/DependentsContext';

export function useDependents(): DependentsContextValue {
  const context = useContext(DependentsContext);
  if (!context) throw new Error('useDependents deve ser usado dentro do DependentsProvider.');
  return context;
}
