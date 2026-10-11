import React from 'react';
import { AlertTriangle, LogOut, ShieldCheck, Syringe, XCircle } from 'lucide-react';
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
    className: 'bg-amber-50 border-amber-200 text-amber-800',
    title: 'Registro profissional em análise',
    text: 'Seu registro ainda não foi verificado pela administração. Até a verificação, o painel e a confirmação de doses ficam indisponíveis.',
  },
  RECUSADO: {
    icon: XCircle,
    className: 'bg-rose-50 border-rose-200 text-rose-800',
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center size-10 rounded-xl bg-sky-600 text-white shadow-sm">
              <Syringe className="size-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">VACINEI!?</span>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-2 text-sky-700 text-xs font-semibold uppercase tracking-wide">
            <ShieldCheck className="size-4" />
            <span>{ROLE_LABELS[user.role]}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Olá, {user.name}!</h1>
          <p className="text-sm text-slate-500 mt-2">
            Você está conectado ao gerenciador web do VACINEI!?. Os indicadores do painel serão exibidos aqui.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
