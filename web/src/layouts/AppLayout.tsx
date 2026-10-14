import React, { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';

/**
 * Layout das rotas protegidas: sidebar fixa, barra superior, conteúdo da página e rodapé
 */
export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        role={user.role}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSignOut={signOut}
      />

      <div className="lg:pl-64 flex min-h-screen flex-col">
        <Topbar user={user} onOpenMenu={() => setIsMenuOpen(true)} onSignOut={signOut} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;
