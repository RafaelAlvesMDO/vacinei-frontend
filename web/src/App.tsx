import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from './components/ui/Spinner';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';

const Login = lazy(() => import('./pages/auth/Login'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const ConfirmVaccination = lazy(() => import('./pages/records/ConfirmVaccination'));
const Professionals = lazy(() => import('./pages/professionals/Professionals'));
const UbsList = lazy(() => import('./pages/ubs/UbsList'));

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Spinner fullScreen />}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['PROFISSIONAL_SAUDE', 'ADMIN']} />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Confirmação de vacina (RF010) */}
                <Route element={<ProtectedRoute allowedRoles={['PROFISSIONAL_SAUDE']} />}>
                  <Route path="/confirmar-vacina" element={<ConfirmVaccination />} />
                </Route>

                {/* Verificação de profissionais (RS001) */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/profissionais" element={<Professionals />} />
                </Route>

                {/* Gestão de UBS (RF008 nota 8) */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/ubs" element={<UbsList />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
