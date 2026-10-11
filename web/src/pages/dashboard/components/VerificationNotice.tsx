import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import type { ProfessionalVerificationStatus } from '../../../types/auth';

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

interface VerificationNoticeProps {
  status: Exclude<ProfessionalVerificationStatus, 'VERIFICADO'>;
}

export const VerificationNotice: React.FC<VerificationNoticeProps> = ({ status }) => {
  const notice = VERIFICATION_NOTICES[status];
  const Icon = notice.icon;

  return (
    <div role="alert" className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${notice.className}`}>
      <Icon className="size-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">{notice.title}</p>
        <p className="mt-1 leading-snug">{notice.text}</p>
      </div>
    </div>
  );
};

export default VerificationNotice;
