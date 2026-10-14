import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { FeedbackBanner, type Feedback } from '../../components/feedback/FeedbackBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../components/ui/CardState';
import {
  DataTable,
  DataTableActions,
  DataTableRow,
  TOGGLE_ACTION_CLASS,
  type DataTableColumn,
} from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { useAsync } from '../../hooks/useAsync';
import { useClampPage, useFilterParams, usePageParam, useSearchParamInput } from '../../hooks/useUrlPagination';
import { listProfessionals } from '../../services/professionals';
import type { ProfessionalVerificationStatus } from '../../types/auth';
import type { Professional } from '../../types/professional';
import { formatRegistry } from '../../utils/councils';
import { formatDate, formatNumber } from '../../utils/format';
import { RejectProfessionalModal } from './components/RejectProfessionalModal';
import { VerifyProfessionalDialog } from './components/VerifyProfessionalDialog';

const FEEDBACK_DURATION_MS = 8000;
const SEARCH_MAX_LENGTH = 100;
const PAGE_SIZE = 20;

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

const COLUMNS: DataTableColumn[] = [
  { header: 'Profissional', width: 'minmax(0,2fr)' },
  { header: 'Registro', width: 'minmax(0,1fr)' },
  { header: 'Status', width: '6.5rem' },
  { header: 'Cadastro', width: '6.5rem' },
  { header: 'Ações', width: '15rem', align: 'right' },
];

type ModalState = { type: 'verify' | 'reject'; professional: Professional } | null;

// Rota /profissionais (só ADMIN): verificação manual dos registros profissionais (RS001)
export const Professionals: React.FC = () => {
  const { searchParams, setFilters } = useFilterParams();
  const filter = FILTERS.find((option) => option.value === searchParams.get('status')) ?? FILTERS[0];
  const { input: searchInput, setInput: setSearchInput, search, isTyping } = useSearchParamInput();
  const { page, setPage } = usePageParam();

  // Busca, status e paginação rodam na API (D22)
  const fetchProfessionals = useCallback(
    () => listProfessionals({ status: filter.status, search, page, limit: PAGE_SIZE }),
    [filter.status, search, page]
  );
  const professionals = useAsync(fetchProfessionals, 'Não foi possível carregar os profissionais.');
  useClampPage(page, professionals.data?.totalPages, professionals.isLoading, setPage);

  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const visibleProfessionals = professionals.data?.items ?? [];
  // Contadores da API: respeitam a busca, mas não o status
  const counts = professionals.data?.counts;

  const changeFilter = (value: StatusFilter) => {
    setFilters({ status: value === 'pendentes' ? null : value });
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
    <DataTableActions>
      {professional.verificationStatus !== 'VERIFICADO' && (
        <button
          type="button"
          onClick={() => setModal({ type: 'verify', professional })}
          className={`inline-flex h-9 ${TOGGLE_ACTION_CLASS} items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30`}
        >
          <ShieldCheck className="size-4" />
          Verificar
        </button>
      )}
      {professional.verificationStatus !== 'RECUSADO' && (
        <button
          type="button"
          onClick={() => setModal({ type: 'reject', professional })}
          className={`inline-flex h-9 ${TOGGLE_ACTION_CLASS} items-center gap-1.5 rounded-xl border border-danger/30 px-3 text-sm font-semibold text-danger hover:bg-danger-soft active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/30`}
        >
          <UserX className="size-4" />
          {professional.verificationStatus === 'VERIFICADO' ? 'Revogar' : 'Recusar'}
        </button>
      )}
    </DataTableActions>
  );

  const renderList = () => {
    // Ao trocar de filtro ou de página, os dados anteriores continuam até a nova resposta chegar
    if (professionals.isLoading && !professionals.data) {
      return <CardLoading label="Carregando profissionais..." />;
    }

    if (!professionals.data) {
      return <CardError message={professionals.error?.message ?? ''} onRetry={professionals.reload} />;
    }

    if (visibleProfessionals.length === 0) {
      return (
        <CardEmpty
          icon={UserCheck}
          message={
            search
              ? `Nenhum profissional encontrado para “${search}” em ${filter.label}.`
              : filter.emptyMessage
          }
        />
      );
    }

    return (
      <DataTable
        columns={COLUMNS}
        footer={
          <Pagination
            page={page}
            totalPages={professionals.data.totalPages}
            total={professionals.data.total}
            onPageChange={setPage}
            itemLabel={{ singular: 'profissional', plural: 'profissionais' }}
            ariaLabel="Paginação dos profissionais"
            className="border-t border-border px-5 pt-4 sm:px-6"
          />
        }
      >
        {visibleProfessionals.map((professional) => {
          const badge = STATUS_BADGES[professional.verificationStatus];
          return (
            <DataTableRow key={professional.id}>
              <div>
                <p className="text-sm font-semibold text-primary-dark truncate">{professional.name}</p>
                <p className="text-sm text-muted truncate">{professional.email}</p>
                {professional.verificationStatus === 'RECUSADO' && professional.rejectionReason && (
                  <p className="mt-1 text-xs text-danger break-words">Motivo: {professional.rejectionReason}</p>
                )}
              </div>
              <p className="text-sm text-primary-dark break-words">
                <span className="text-xs text-muted xl:hidden">Registro: </span>
                {formatRegistry(professional.registry)}
              </p>
              <div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <p className="text-sm text-primary-dark whitespace-nowrap">
                <span className="text-xs text-muted xl:hidden">Cadastro: </span>
                {formatDate(professional.createdAt)}
              </p>
              {renderActions(professional)}
            </DataTableRow>
          );
        })}
      </DataTable>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profissionais"
        subtitle="Verificação manual dos registros profissionais"
        actions={
          <div className="relative">
            <label htmlFor="professional-search" className="sr-only">
              Buscar profissional pelo nome
            </label>
            <input
              id="professional-search"
              type="search"
              autoComplete="off"
              maxLength={SEARCH_MAX_LENGTH}
              placeholder="Buscar pelo nome"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full h-12 rounded-xl border border-input bg-white pl-4 pr-11 text-sm text-primary-dark placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          </div>
        }
      />

      {feedback && <FeedbackBanner feedback={feedback} onClose={() => setFeedback(null)} />}

      <Card
        title="Registros profissionais"
        description={
          professionals.data
            ? `${formatNumber(professionals.data.total)} ${professionals.data.total === 1 ? 'profissional' : 'profissionais'}`
            : undefined
        }
        action={
          (professionals.isLoading || isTyping) && professionals.data ? (
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
                {counts && (
                  <span className="ml-1.5 font-normal">({formatNumber(counts[option.status])})</span>
                )}
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
