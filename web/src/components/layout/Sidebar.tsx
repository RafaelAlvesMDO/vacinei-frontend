import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, LayoutDashboard, LogOut, Syringe, UserCheck, Users, X } from 'lucide-react';
import logoVacinei from '../../assets/logo-vacinei.svg';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { UserRole } from '../../types/auth';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['PROFISSIONAL_SAUDE', 'ADMIN'] },
  { to: '/confirmar-vacina', label: 'Confirmar vacina', icon: Syringe, roles: ['PROFISSIONAL_SAUDE'] },
  { to: '/profissionais', label: 'Profissionais', icon: UserCheck, roles: ['ADMIN'] },
  { to: '/ubs', label: 'UBS', icon: Building2, roles: ['ADMIN'] },
  { to: '/vacinas', label: 'Vacinas', icon: Syringe, roles: ['ADMIN'] },
  { to: '/usuarios', label: 'Usuários', icon: Users, roles: ['ADMIN'] },
];

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose, onSignOut }) => {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const asideRef = useRef<HTMLElement>(null);
  // No desktop (lg) o menu fica sempre visível; abaixo disso, vira uma gaveta
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isDrawerOpen = isOpen && !isDesktop;

  // Gaveta aberta: foco preso, Esc fecha e o foco volta ao botão "Abrir menu"
  useFocusTrap(asideRef, isDrawerOpen, { onEscape: onClose });

  return (
    <>
      {/* Fundo escurecido do menu no mobile */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-primary-dark/40 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        ref={asideRef}
        id="app-sidebar"
        aria-label="Menu lateral"
        // Gaveta fechada (fora da tela) não pode receber foco pelo Tab
        inert={!isDesktop && !isOpen}
        {...(isDrawerOpen ? { role: 'dialog', 'aria-modal': true } : {})}
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative flex flex-col items-center gap-2 px-6 pt-8 pb-6 border-b border-border">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary-dark lg:hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <X className="size-5" />
          </button>
          <img src={logoVacinei} alt="Vacinei!?" className="h-16 w-auto" />
          <span className="text-sm font-semibold text-muted">Gerenciador Web</span>
        </div>

        <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3 py-6">
          <ul className="flex flex-col gap-1">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      isActive ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface hover:text-primary-dark'
                    }`
                  }
                >
                  <Icon className="size-5" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-3 pb-6">
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/30"
          >
            <LogOut className="size-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
