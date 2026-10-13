import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { PASSWORD_REQUIREMENTS } from '../../utils/password';

interface PasswordChecklistProps {
  password: string;
}

// Requisitos da senha (RF001) atualizados conforme a digitação
export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({ password }) => (
  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 px-1" aria-label="Requisitos da senha">
    {PASSWORD_REQUIREMENTS.map(({ label, test }) => {
      const isMet = test(password);
      return (
        <li
          key={label}
          className={`flex items-center gap-1.5 text-xs transition-colors ${isMet ? 'text-success' : 'text-muted'}`}
        >
          {isMet ? <CheckCircle2 className="size-3.5 shrink-0" /> : <Circle className="size-3.5 shrink-0" />}
          <span>{label}</span>
        </li>
      );
    })}
  </ul>
);

export default PasswordChecklist;
