import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, UserRound } from 'lucide-react';
import type { User } from '../../types/auth';
import { ROLE_LABELS } from '../../utils/roles';

interface TopbarProps {
  user: User;
  onOpenMenu: () => void;
  onSignOut: () => void;
}

const MENU_ITEM_CLASSES =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30';

export const Topbar: React.FC<TopbarProps> = ({ user, onOpenMenu, onSignOut }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Padrão de menu da WAI-ARIA: abre com o foco no primeiro item, setas/Home/End navegam,
  // Esc e Tab fecham o menu
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const getItems = () =>
      Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    getItems()[0]?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsProfileMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      // Os itens somem ao fechar, então o foco volta ao botão para não se perder
      if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault();
        setIsProfileMenuOpen(false);
        buttonRef.current?.focus();
        return;
      }

      const items = getItems();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const nextIndex: Record<string, number> = {
        ArrowDown: (current + 1) % items.length,
        ArrowUp: (current - 1 + items.length) % items.length,
        Home: 0,
        End: items.length - 1,
      };
      if (!(event.key in nextIndex) || items.length === 0) return;
      event.preventDefault();
      items[nextIndex[event.key]].focus();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-border">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menu"
            aria-controls="app-sidebar"
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

          <div ref={menuRef} className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              aria-label={`Menu da conta de ${user.name}`}
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              aria-controls="profile-menu"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary hover:bg-primary/15 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <UserRound className="size-5" />
            </button>

            {isProfileMenuOpen && (
              <div
                id="profile-menu"
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-white p-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="px-3 py-2 sm:hidden border-b border-border mb-1">
                  <p className="text-sm font-semibold text-primary-dark truncate">{user.name}</p>
                  <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>
                </div>
                <Link
                  to="/perfil"
                  role="menuitem"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className={`${MENU_ITEM_CLASSES} text-primary-dark hover:bg-surface`}
                >
                  <UserRound className="size-4" />
                  Meu perfil
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={onSignOut}
                  className={`${MENU_ITEM_CLASSES} text-danger hover:bg-danger-soft`}
                >
                  <LogOut className="size-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
