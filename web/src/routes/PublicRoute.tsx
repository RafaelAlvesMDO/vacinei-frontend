import React from 'react';
import { Navigate, Outlet, useLocation, type Location } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';

interface RedirectState {
  from?: Location;
}

/**
 * Rotas públicas (ex.: login): usuários autenticados voltam para a página de origem ou para o dashboard
 */
export const PublicRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner fullScreen label="Verificando sessão..." />;
  }

  if (user) {
    const from = (location.state as RedirectState | null)?.from;
    return <Navigate to={from?.pathname ?? '/dashboard'} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
