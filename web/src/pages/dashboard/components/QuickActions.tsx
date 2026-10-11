import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Syringe, UserCheck } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { UserRole } from '../../../types/auth';

interface QuickAction {
  to: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const ACTIONS_BY_ROLE: Partial<Record<UserRole, QuickAction[]>> = {
  PROFISSIONAL_SAUDE: [
    {
      to: '/confirmar-vacina',
      label: 'Confirmar vacina',
      description: 'Registrar a aplicação presencial de uma dose.',
      icon: Syringe,
    },
  ],
  ADMIN: [
    {
      to: '/profissionais',
      label: 'Profissionais pendentes',
      description: 'Verificar ou recusar registros profissionais.',
      icon: UserCheck,
    },
  ],
};

interface QuickActionsProps {
  role: UserRole;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ role }) => {
  const actions = ACTIONS_BY_ROLE[role] ?? [];

  return (
    <Card title="Atalhos rápidos">
      <ul className="flex flex-col gap-3">
        {actions.map(({ to, label, description, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex items-center gap-4 rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-primary group-hover:bg-white">
                <Icon className="size-6" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-primary-dark">{label}</span>
                <span className="block text-sm text-muted">{description}</span>
              </span>
              <ChevronRight className="size-5 text-muted group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default QuickActions;
