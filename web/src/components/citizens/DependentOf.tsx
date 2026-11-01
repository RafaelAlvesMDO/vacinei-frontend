import React from 'react';
import { Users } from 'lucide-react';
import type { CitizenResponsible } from '../../types/citizen';

interface DependentOfProps {
  responsible: CitizenResponsible | null;
  className?: string;
}

// Indica que o cidadão é dependente (D33) e quem é o responsável. Sem responsável, não renderiza nada
export const DependentOf: React.FC<DependentOfProps> = ({ responsible, className = '' }) => {
  if (!responsible) return null;

  return (
    <span className={`flex min-w-0 items-start gap-1 text-xs text-muted ${className}`}>
      <Users className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">
        Dependente de <span className="font-semibold text-primary-dark">{responsible.name}</span>
      </span>
    </span>
  );
};

export default DependentOf;
