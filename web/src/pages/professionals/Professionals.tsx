import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, UserCheck, UserX, X } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../components/ui/CardState';
import { useAsync } from '../../hooks/useAsync';
import { listProfessionals } from '../../services/professionals';
import type { ProfessionalVerificationStatus } from '../../types/auth';
import type { Professional } from '../../types/professional';
import { formatRegistry } from '../../utils/councils';
import { formatDate } from '../../utils/format';
import { RejectProfessionalModal } from './components/RejectProfessionalModal';
import { VerifyProfessionalDialog } from './components/VerifyProfessionalDialog';

const FEEDBACK_DURATION_MS = 8000;

type StatusFilter = 'pendentes' | 'verificados' | 'recusados';

interface FilterOption {
  value: StatusFilter;
  label: string;
  status: ProfessionalVerificationStatus;
  emptyMessage: string;
}

const FILTERS: FilterOption[] = [
  {
    value: 'pendentes',
    label: 'Pendentes',
    status: 'PENDENTE',
    emptyMessage: 'Nenhum profissional aguardando verificação.',
  },
  { value: 'verificados', label: 'Verificados', status: 'VERIFICADO', emptyMessage: 'Nenhum profissional verificado.' },
  { value: 'recusados', label: 'Recusados', status: 'RECUSADO', emptyMessage: 'Nenhum profissional recusado.' },
];

const STATUS_BADGES: Record<ProfessionalVerificationStatus, { label: string; variant: BadgeVariant }> = {
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  VERIFICADO: { label: 'Verificado', variant: 'success' },
  RECUSADO: { label: 'Recusado', variant: 'danger' },
};

// A API filtra só por `verified`: false traz pendentes e recusados, separados no cliente
const fetchUnverified = () => listProfessionals({ verified: false });
const fetchVerified = () => listProfessionals({ verified: true });

interface Feedback {
  variant: 'success' | 'warning';
  title: string;
  detail: string;
}

type ModalState = { type: 'verify' | 'reject'; professional: Professional } | null;

// Rota /profissionais (só ADMIN): verificação manual dos registros profissionais (RS001)
export const Professionals: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = FILTERS.find((option) => option.value === searchParams.get('status')) ?? FILTERS[0];

  const professionals = useAsync(
    filter.status === 'VERIFICADO' ? fetchVerified : fetchUnverified,
    'Não foi possível carregar os profissionais.'
  );

  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const visibleProfessionals = useMemo(
    () => (professionals.data ?? []).filter((professional) => professional.verificationStatus === filter.status),
    [professionals.data, filter.status]
  );

  const changeFilter = (value: StatusFilter) => {
    setSearchParams(value === 'pendentes' ? {} : { status: value }, { replace: true });
  };

  const closeModal = useCallback(() => setModal(null), []);

  const handleVerified = (professional: Professional) => {
    setModal(null);
    setFeedback({
      variant: 'success',
      title: 'Profissional verificado',
      detail: `${professional.name} (${formatRegistry(professional.registry)}) já pode usar as funções de profissional.`,
    });
    professionals.reload();
  };

  const handleRejected = (professional: Professional) => {
    setModal(null);
    setFeedback({
      variant: 'success',
      title: 'Profissional recusado',
      detail: `${professional.name} (${formatRegistry(professional.registry)}) foi movido para Recusados.`,
    });
    professionals.reload();
  };

  const handleOutdated = (message: string) => {
    setModal(null);
    setFeedback({ variant: 'warning', title: 'A lista estava desatualizada', detail: message });
    professionals.reload();
  };

  const renderActions = (professional: Professional) => (
    <div className="flex flex-wrap gap-2 md:justify-end">
      {professional.verificationStatus !== 'VERIFICADO' && (
        <button
          type="button"
          onClick={() => setModal({ type: 'verify', professional })}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <ShieldCheck className="size-4" />
          Verificar
        </button>
      )}
      {professional.verificationStatus !== 'RECUSADO' && (
        <button
          type="button"
          onClick={() => setModal({ type: 'reject', professional })}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-danger/30 px-3 text-sm font-semibold text-danger hover:bg-danger-soft active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/30"
        >
          <UserX className="size-4" />
          {professional.verificationStatus === 'VERIFICADO' ? 'Revogar' : 'Recusar'}
        </button>
      )}
    </div>
  );

  const renderList = () => {
    // Ao trocar de filtro, os dados anteriores continuam até a nova resposta chegar
    if (professionals.isLoading && visibleProfessionals.length === 0) {
      return <CardLoading label="Carregando profissionais..." />;
    }

    if (!professionals.data) {
      return <CardError message={professionals.error?.message ?? ''} onRetry={professionals.reload} />;
    }

    if (visibleProfessionals.length === 0) {
      return <CardEmpty icon={UserCheck} message={filter.emptyMessage} />;
    }

    return (
      <div className="-mx-5 sm:-mx-6">
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_7rem_6.5rem_minmax(11rem,auto)] gap-4 border-b border-border px-6 pb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Profissional</span>
          <span>Registro</span>
          <span>Status</span>
          <span>Cadastro</span>
          <span className="text-right">Ações</span>
        </div>
        <ul className="divide-y divide-border">
          {visibleProfessionals.map((professional) => {
            const badge = STATUS_BADGES[professional.verificationStatus];
            return (
              <li
                key={professional.id}
                className="grid gap-3 px-5 py-4 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_7rem_6.5rem_minmax(11rem,auto)] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary-dark truncate">{professional.name}</p>
                  <p className="text-sm text-muted truncate">{professional.email}</p>
                  {professional.verificationStatus === 'RECUSADO' && professional.rejectionReason && (
                    <p className="mt-1 text-xs text-danger break-words">Motivo: {professional.rejectionReason}</p>
                  )}
                </div>
                <p className="text-sm text-primary-dark">
                  <span className="text-xs text-muted md:hidden">Registro: </span>
                  {formatRegistry(professional.registry)}
                </p>
                <div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <p className="text-sm text-primary-dark">
                  <span className="text-xs text-muted md:hidden">Cadastro: </span>
                  {formatDate(professional.createdAt)}
                </p>
                {renderActions(professional)}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const FeedbackIcon = feedback?.variant === 'warning' ? AlertTriangle : CheckCircle2;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profissionais" subtitle="Verificação manual dos registros profissionais" />

      {feedback && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-2xl border p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            feedback.variant === 'warning'
              ? 'border-warning/25 bg-warning-soft text-warning'
              : 'border-success/30 bg-success-soft text-success'
          }`}
        >
          <FeedbackIcon className="size-6 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{feedback.title}</p>
            <p className="text-sm">{feedback.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Fechar aviso"
            className="rounded-full p-1 hover:bg-white/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <Card
        title="Registros profissionais"
        description={
          professionals.data && !professionals.isLoading
            ? `${visibleProfessionals.length} ${visibleProfessionals.length === 1 ? 'profissional' : 'profissionais'}`
            : undefined
        }
        action={
          professionals.isLoading && visibleProfessionals.length > 0 ? (
            <span role="status" className="flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="size-4 animate-spin text-primary" />
              Atualizando...
            </span>
          ) : undefined
        }
      >
        <div role="group" aria-label="Filtrar por status" className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((option) => {
            const isActive = option.value === filter.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => changeFilter(option.value)}
                className={`h-9 rounded-full border px-4 text-sm font-semibold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isActive
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white text-primary-dark hover:bg-surface'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {renderList()}
      </Card>

      {modal?.type === 'verify' && (
        <VerifyProfessionalDialog
          professional={modal.professional}
          onClose={closeModal}
          onSuccess={handleVerified}
          onOutdated={handleOutdated}
        />
      )}
      {modal?.type === 'reject' && (
        <RejectProfessionalModal
          professional={modal.professional}
          onClose={closeModal}
          onSuccess={handleRejected}
          onOutdated={handleOutdated}
        />
      )}
    </div>
  );
};

export default Professionals;
