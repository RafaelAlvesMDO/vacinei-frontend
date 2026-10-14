import React, { Suspense, useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { IdleWarningModal } from '../components/feedback/IdleWarningModal';
import { Footer } from '../components/layout/Footer';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { setLogoutReason } from '../services/tokenStorage';

/**
 * Layout das rotas protegidas: sidebar fixa, barra superior, conteúdo da página e rodapé.
 * Também encerra a sessão por inatividade (RNF11)
 */
export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // RNF11: sem uso pelo tempo configurado, a sessão é encerrada e o login explica o motivo
  const handleIdleTimeout = useCallback(() => {
    setLogoutReason('idle');
    signOut();
  }, [signOut]);
  const { status: idleStatus, stayConnected } = useIdleTimeout({ enabled: user !== null, onTimeout: handleIdleTimeout });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Atalho de teclado para pular o menu (WCAG 2.4.1) */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
      >
        Pular para o conteúdo
      </a>

      <Sidebar
        role={user.role}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSignOut={signOut}
      />

      <div className="lg:pl-64 flex min-h-screen flex-col">
        <Topbar user={user} onOpenMenu={() => setIsMenuOpen(true)} onSignOut={signOut} />

        <main id="conteudo" tabIndex={-1} className="flex-1 px-4 py-6 sm:px-6 lg:px-8 focus:outline-none">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>

        <Footer />
      </div>

      <IdleWarningModal
        isOpen={idleStatus.phase === 'warning'}
        remainingMs={idleStatus.remainingMs}
        onStayConnected={stayConnected}
        onSignOut={signOut}
      />
    </div>
  );
};

export default AppLayout;
