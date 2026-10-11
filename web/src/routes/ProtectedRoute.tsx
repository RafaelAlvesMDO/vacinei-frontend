import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

/**
 * Bloqueia rotas para usuários não autenticados e, se informado, para perfis sem permissão
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner fullScreen label="Verificando sessão..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
