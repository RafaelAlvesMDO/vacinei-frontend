import React from 'react';
import { AlertTriangle, LogOut, ShieldCheck, XCircle } from 'lucide-react';
import iconeVacinei from '../../assets/icone-vacinei.svg';
import { useAuth } from '../../hooks/useAuth';
import type { ProfessionalVerificationStatus, UserRole } from '../../types/auth';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  PROFISSIONAL_SAUDE: 'Profissional de Saúde',
  CIDADAO: 'Cidadão',
};

const VERIFICATION_NOTICES: Record<
  Exclude<ProfessionalVerificationStatus, 'VERIFICADO'>,
  { icon: React.ElementType; className: string; title: string; text: string }
> = {
  PENDENTE: {
    icon: AlertTriangle,
    className: 'bg-warning-soft border-warning/25 text-warning',
    title: 'Registro profissional em análise',
    text: 'Seu registro ainda não foi verificado pela administração. Até a verificação, o painel e a confirmação de doses ficam indisponíveis.',
  },
  RECUSADO: {
    icon: XCircle,
    className: 'bg-danger-soft border-danger/20 text-danger',
    title: 'Registro profissional recusado',
    text: 'A administração recusou a verificação do seu registro. Entre em contato com a administração para regularizar o acesso.',
  },
};

// Tela provisória: será substituída pelo dashboard do profissional (RF009) na etapa 3
export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const registryStatus = user.professionalRegistry?.status;
  const notice = registryStatus && registryStatus !== 'VERIFICADO' ? VERIFICATION_NOTICES[registryStatus] : null;
  const NoticeIcon = notice?.icon;

  return (
    <div className="min-h-screen bg-background font-sans text-primary-dark antialiased">
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={iconeVacinei} alt="Logo Vacinei!?" className="size-10 rounded-xl" />
            <span className="text-lg font-bold tracking-tight text-primary-dark">Vacinei!?</span>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted hover:bg-surface hover:text-primary-dark transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <LogOut className="size-4" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {notice && NoticeIcon && (
          <div role="alert" className={`mb-6 p-4 rounded-xl border text-sm flex items-start gap-3 ${notice.className}`}>
            <NoticeIcon className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{notice.title}</p>
              <p className="mt-1 leading-snug">{notice.text}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wide">
            <ShieldCheck className="size-4" />
            <span>{ROLE_LABELS[user.role]}</span>
          </div>
          <h1 className="text-2xl font-bold text-primary-dark mt-2">Olá, {user.name}!</h1>
          <p className="text-sm text-muted mt-2">
            Você está conectado ao gerenciador web do Vacinei!?. Os indicadores do painel serão exibidos aqui.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
