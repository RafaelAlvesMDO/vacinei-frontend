import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Loader2, Pencil, Plus, Power, PowerOff, Search } from 'lucide-react';
import { FeedbackBanner, type Feedback } from '../../components/feedback/FeedbackBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../components/ui/CardState';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { listAllUbs } from '../../services/ubs';
import type { Ubs } from '../../types/ubs';
import { formatPhone } from '../../utils/format';
import { UbsFormModal } from './components/UbsFormModal';
import { UbsStatusDialog } from './components/UbsStatusDialog';
import { formatUbsAddress, normalizeSearch } from './utils';

const FEEDBACK_DURATION_MS = 8000;
const SEARCH_MAX_LENGTH = 100;

type StatusFilter = 'ativas' | 'inativas' | 'todas';

interface FilterOption {
  value: StatusFilter;
  label: string;
  matches: (ubs: Ubs) => boolean;
  emptyMessage: string;
}

const FILTERS: FilterOption[] = [
  { value: 'ativas', label: 'Ativas', matches: (ubs) => ubs.isActive, emptyMessage: 'Nenhuma UBS ativa.' },
  { value: 'inativas', label: 'Inativas', matches: (ubs) => !ubs.isActive, emptyMessage: 'Nenhuma UBS desativada.' },
  { value: 'todas', label: 'Todas', matches: () => true, emptyMessage: 'Nenhuma UBS cadastrada.' },
];

const GRID_COLUMNS =
  'lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_9rem_5.5rem_minmax(12rem,auto)]';

type ModalState = { type: 'form'; ubs?: Ubs } | { type: 'status'; ubs: Ubs } | null;

// Rota /ubs (só ADMIN): cadastro, edição e ativação das UBS (RF008 nota 8). A UBS nunca é excluída (D10)
export const UbsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = FILTERS.find((option) => option.value === searchParams.get('status')) ?? FILTERS[0];

  // São poucas UBS: a lista completa vem de uma vez e a busca e o filtro rodam no cliente
  const ubsList = useAsync(listAllUbs, 'Não foi possível carregar as UBS.');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(normalizeSearch(search), 250);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => {
      setFeedback(null);
      setHighlightedId(null);
    }, FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const counts = useMemo(() => {
    const all = ubsList.data ?? [];
    const active = all.filter((ubs) => ubs.isActive).length;
    return { ativas: active, inativas: all.length - active, todas: all.length };
  }, [ubsList.data]);

  const visibleUbs = useMemo(
    () =>
      (ubsList.data ?? []).filter(
        (ubs) =>
          filter.matches(ubs) &&
          (!debouncedSearch ||
            normalizeSearch(ubs.name).includes(debouncedSearch) ||
            normalizeSearch(ubs.neighborhood ?? '').includes(debouncedSearch))
      ),
    [ubsList.data, filter, debouncedSearch]
  );

  const changeFilter = (value: StatusFilter) => {
    setSearchParams(value === 'ativas' ? {} : { status: value }, { replace: true });
  };

  const closeModal = useCallback(() => setModal(null), []);

  const showSuccess = (ubs: Ubs, title: string, detail: string) => {
    setModal(null);
    setFeedback({ variant: 'success', title, detail });
    setHighlightedId(ubs.id);
    ubsList.reload();
  };

  const handleSaved = (ubs: Ubs, mode: 'created' | 'updated') => {
    if (mode === 'created') {
      // A nova UBS nasce ativa: volta para o filtro em que ela aparece
      if (filter.value === 'inativas') changeFilter('ativas');
      showSuccess(ubs, 'UBS cadastrada', `${ubs.name} já aparece no aplicativo para os cidadãos.`);
    } else {
      showSuccess(ubs, 'UBS atualizada', `Os dados de ${ubs.name} foram salvos.`);
    }
  };

  const handleStatusChanged = (ubs: Ubs) => {
    if (ubs.isActive) {
      showSuccess(ubs, 'UBS reativada', `${ubs.name} voltou a aparecer no aplicativo.`);
    } else {
      showSuccess(
        ubs,
        'UBS desativada',
        `${ubs.name} não aparece mais no aplicativo. O histórico de vacinações foi mantido.`
      );
    }
  };

  const handleOutdated = (message: string) => {
    setModal(null);
    setHighlightedId(null);
    setFeedback({ variant: 'warning', title: 'A lista estava desatualizada', detail: message });
    ubsList.reload();
  };

  const renderActions = (ubs: Ubs) => (
    <div className="flex flex-wrap gap-2 lg:justify-end">
      <button
        type="button"
        onClick={() => setModal({ type: 'form', ubs })}
        aria-label={`Editar ${ubs.name}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-primary-dark hover:bg-surface active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <Pencil className="size-4" />
        Editar
      </button>
      {ubs.isActive ? (
        <button
          type="button"
          onClick={() => setModal({ type: 'status', ubs })}
          aria-label={`Desativar ${ubs.name}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-danger/30 px-3 text-sm font-semibold text-danger hover:bg-danger-soft active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/30"
        >
          <PowerOff className="size-4" />
          Desativar
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setModal({ type: 'status', ubs })}
          aria-label={`Reativar ${ubs.name}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <Power className="size-4" />
          Reativar
        </button>
      )}
    </div>
  );

  const renderList = () => {
    // Na recarga após uma ação, a lista anterior continua na tela
    if (ubsList.isLoading && !ubsList.data) {
      return <CardLoading label="Carregando UBS..." />;
    }

    if (!ubsList.data) {
      return <CardError message={ubsList.error?.message ?? ''} onRetry={ubsList.reload} />;
    }

    if (visibleUbs.length === 0) {
      return (
        <CardEmpty
          icon={Building2}
          message={debouncedSearch ? `Nenhuma UBS encontrada para “${search.trim()}”.` : filter.emptyMessage}
        />
      );
    }

    return (
      <div className="-mx-5 sm:-mx-6">
        <div
          className={`hidden lg:grid ${GRID_COLUMNS} gap-4 border-b border-border px-6 pb-3 text-xs font-semibold uppercase tracking-wide text-muted`}
        >
          <span>UBS</span>
          <span>Bairro</span>
          <span>Horário</span>
          <span>Telefone</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>
        <ul className="divide-y divide-border">
          {visibleUbs.map((ubs) => (
            <li
              key={ubs.id}
              className={`grid gap-2 px-5 py-4 sm:px-6 ${GRID_COLUMNS} lg:items-center lg:gap-4 transition-colors ${
                ubs.id === highlightedId ? 'bg-success-soft/60' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary-dark">
                  <span className="break-words">{ubs.name}</span>
                  {ubs.id === highlightedId && <Badge variant="accent">Atualizada agora</Badge>}
                </p>
                <p className="text-sm text-muted break-words">{formatUbsAddress(ubs)}</p>
              </div>
              <p className="text-sm text-primary-dark">
                <span className="text-xs text-muted lg:hidden">Bairro: </span>
                {ubs.neighborhood || '—'}
              </p>
              <p className="text-sm text-primary-dark">
                <span className="text-xs text-muted lg:hidden">Horário: </span>
                {ubs.openingHours || '—'}
              </p>
              <p className="text-sm text-primary-dark whitespace-nowrap">
                <span className="text-xs text-muted lg:hidden">Telefone: </span>
                {ubs.phone ? formatPhone(ubs.phone) : '—'}
              </p>
              <div>
                <Badge variant={ubs.isActive ? 'success' : 'neutral'}>{ubs.isActive ? 'Ativa' : 'Inativa'}</Badge>
              </div>
              <div className="pt-1 lg:pt-0">{renderActions(ubs)}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Unidades Básicas de Saúde"
        subtitle="Cadastro e disponibilidade das UBS exibidas no aplicativo"
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="ubs-search" className="sr-only">
                Buscar UBS por nome ou bairro
              </label>
              <input
                id="ubs-search"
                type="search"
                autoComplete="off"
                maxLength={SEARCH_MAX_LENGTH}
                placeholder="Buscar por nome ou bairro"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full h-12 rounded-xl border border-border bg-white pl-4 pr-11 text-sm text-primary-dark placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
            </div>
            <button
              type="button"
              onClick={() => setModal({ type: 'form' })}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <Plus className="size-4" />
              Nova UBS
            </button>
          </div>
        }
      />

      {feedback && (
        <FeedbackBanner
          feedback={feedback}
          onClose={() => {
            setFeedback(null);
            setHighlightedId(null);
          }}
        />
      )}

      <Card
        title="UBS cadastradas"
        description={
          ubsList.data ? `${visibleUbs.length} ${visibleUbs.length === 1 ? 'unidade' : 'unidades'}` : undefined
        }
        action={
          ubsList.isLoading && ubsList.data ? (
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
                {ubsList.data && <span className="ml-1.5 font-normal opacity-80">({counts[option.value]})</span>}
              </button>
            );
          })}
        </div>

        {renderList()}
      </Card>

      {modal?.type === 'form' && (
        <UbsFormModal ubs={modal.ubs} onClose={closeModal} onSuccess={handleSaved} onOutdated={handleOutdated} />
      )}
      {modal?.type === 'status' && (
        <UbsStatusDialog
          ubs={modal.ubs}
          onClose={closeModal}
          onSuccess={handleStatusChanged}
          onOutdated={handleOutdated}
        />
      )}
    </div>
  );
};

export default UbsList;
