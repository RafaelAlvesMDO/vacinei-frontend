import React from 'react';
import { Menu, UserRound } from 'lucide-react';
import type { User } from '../../types/auth';
import { ROLE_LABELS } from '../../utils/roles';

interface TopbarProps {
  user: User;
  onOpenMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ user, onOpenMenu }) => (
  <header className="sticky top-0 z-20 bg-white border-b border-border">
    <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menu"
          className="rounded-lg p-2 text-primary-dark hover:bg-surface lg:hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <Menu className="size-5" />
        </button>
        <span className="text-lg font-bold tracking-tight text-primary-dark">Vacinei!?</span>
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden sm:flex flex-col items-end min-w-0">
          <span className="text-sm font-semibold text-primary-dark truncate max-w-48">{user.name}</span>
          <span className="text-xs text-muted">{ROLE_LABELS[user.role]}</span>
        </div>
        <span
          title={`${user.name} · ${ROLE_LABELS[user.role]}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary"
        >
          <UserRound className="size-5" />
        </span>
      </div>
    </div>
  </header>
);

export default Topbar;
