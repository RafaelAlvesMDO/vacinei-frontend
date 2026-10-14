import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Loader2, Pencil, Plus, Power, PowerOff, Search, Syringe } from 'lucide-react';
import { FeedbackBanner, type Feedback } from '../../components/feedback/FeedbackBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../components/ui/CardState';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { listAllVaccines } from '../../services/vaccines';
import type { Vaccine } from '../../types/vaccination';
import { normalizeSearch } from '../../utils/format';
import { DoseSchedule } from './components/DoseSchedule';
import { VaccineFormModal } from './components/VaccineFormModal';
import { VaccineStatusDialog } from './components/VaccineStatusDialog';
import { TARGET_AUDIENCE_LABELS, TARGET_AUDIENCE_OPTIONS, isTargetAudience } from './utils';

const FEEDBACK_DURATION_MS = 8000;
const SEARCH_MAX_LENGTH = 100;

type StatusFilter = 'ativas' | 'inativas' | 'todas';

interface FilterOption {
  value: StatusFilter;
  label: string;
  matches: (vaccine: Vaccine) => boolean;
  emptyMessage: string;
}

const FILTERS: FilterOption[] = [
  { value: 'ativas', label: 'Ativas', matches: (vaccine) => vaccine.isActive, emptyMessage: 'Nenhuma vacina ativa.' },
  {
    value: 'inativas',
    label: 'Inativas',
    matches: (vaccine) => !vaccine.isActive,
    emptyMessage: 'Nenhuma vacina desativada.',
  },
  { value: 'todas', label: 'Todas', matches: () => true, emptyMessage: 'Nenhuma vacina cadastrada.' },
];

const GRID_COLUMNS =
  'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_7.5rem_8.5rem_5.5rem_minmax(12rem,auto)]';

type ModalState = { type: 'form'; vaccine?: Vaccine } | { type: 'status'; vaccine: Vaccine } | null;

function formatDosesCount(count: number): string {
  return `${count} ${count === 1 ? 'dose' : 'doses'}`;
}

// Rota /vacinas (só ADMIN): catálogo de vacinas. Vacinas e doses nunca são excluídas, só desativadas (D10)
export const VaccineList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = FILTERS.find((option) => option.value === searchParams.get('status')) ?? FILTERS[0];
  const audienceParam = searchParams.get('publico');
  const audience = isTargetAudience(audienceParam) ? audienceParam : null;

  // O catálogo é pequeno: a lista completa vem de uma vez e a busca e os filtros rodam no cliente
  const vaccineList = useAsync(listAllVaccines, 'Não foi possível carregar as vacinas.');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(normalizeSearch(search), 250);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
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

  // Os contadores de status respeitam o filtro de público-alvo
  const audienceVaccines = useMemo(
    () => (vaccineList.data ?? []).filter((vaccine) => !audience || vaccine.targetAudience === audience),
    [vaccineList.data, audience]
  );

  const counts = useMemo(() => {
    const active = audienceVaccines.filter((vaccine) => vaccine.isActive).length;
    return { ativas: active, inativas: audienceVaccines.length - active, todas: audienceVaccines.length };
  }, [audienceVaccines]);

  const visibleVaccines = useMemo(
    () =>
      audienceVaccines.filter(
        (vaccine) =>
          filter.matches(vaccine) &&
          (!debouncedSearch ||
            normalizeSearch(vaccine.name).includes(debouncedSearch) ||
            normalizeSearch(vaccine.targetDisease).includes(debouncedSearch))
      ),
    [audienceVaccines, filter, debouncedSearch]
  );

  const updateParams = (status: StatusFilter, publico: string | null) => {
    const next: Record<string, string> = {};
    if (status !== 'ativas') next.status = status;
    if (publico) next.publico = publico;
    setSearchParams(next, { replace: true });
  };

  const changeFilter = (value: StatusFilter) => updateParams(value, audience);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closeModal = useCallback(() => setModal(null), []);

  const showSuccess = (vaccine: Vaccine, title: string, detail: string) => {
    setModal(null);
    setFeedback({ variant: 'success', title, detail });
    setHighlightedId(vaccine.id);
    vaccineList.reload();
  };

  const handleSaved = (vaccine: Vaccine, mode: 'created' | 'updated') => {
    if (mode === 'created') {
      // A nova vacina nasce ativa: volta para os filtros em que ela aparece
      const nextAudience = audience && audience !== vaccine.targetAudience ? null : audience;
      if (filter.value === 'inativas' || nextAudience !== audience) {
        updateParams(filter.value === 'inativas' ? 'ativas' : filter.value, nextAudience);
      }
      setExpandedIds((prev) => new Set(prev).add(vaccine.id));
      showSuccess(
        vaccine,
        'Vacina cadastrada',
        `${vaccine.name} entrou no catálogo com ${formatDosesCount(vaccine.doses.length)}.`
      );
    } else {
      showSuccess(vaccine, 'Vacina atualizada', `Os dados de ${vaccine.name} foram salvos.`);
    }
  };

  const handleStatusChanged = (vaccine: Vaccine) => {
    if (vaccine.isActive) {
      showSuccess(vaccine, 'Vacina reativada', `${vaccine.name} voltou ao catálogo e já pode ter doses confirmadas.`);
    } else {
      showSuccess(
        vaccine,
        'Vacina desativada',
        `${vaccine.name} saiu do catálogo. As doses já registradas continuam nas cadernetas.`
      );
    }
  };

  const handleOutdated = (message: string) => {
    setModal(null);
    setHighlightedId(null);
    setFeedback({ variant: 'warning', title: 'A lista estava desatualizada', detail: message });
    vaccineList.reload();
  };

  const renderActions = (vaccine: Vaccine) => (
    <div className="flex flex-wrap gap-2 lg:justify-end">
      <button
        type="button"
        onClick={() => setModal({ type: 'form', vaccine })}
        aria-label={`Editar ${vaccine.name}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-primary-dark hover:bg-surface active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <Pencil className="size-4" />
        Editar
      </button>
      {vaccine.isActive ? (
        <button
          type="button"
          onClick={() => setModal({ type: 'status', vaccine })}
          aria-label={`Desativar ${vaccine.name}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-danger/30 px-3 text-sm font-semibold text-danger hover:bg-danger-soft active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/30"
        >
          <PowerOff className="size-4" />
          Desativar
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setModal({ type: 'status', vaccine })}
          aria-label={`Reativar ${vaccine.name}`}
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
    if (vaccineList.isLoading && !vaccineList.data) {
      return <CardLoading label="Carregando vacinas..." />;
    }

    if (!vaccineList.data) {
      return <CardError message={vaccineList.error?.message ?? ''} onRetry={vaccineList.reload} />;
    }

    if (visibleVaccines.length === 0) {
      const audienceLabel = audience ? ` para o público ${TARGET_AUDIENCE_LABELS[audience]}` : '';
      return (
        <CardEmpty
          icon={Syringe}
          message={
            debouncedSearch
              ? `Nenhuma vacina encontrada para “${search.trim()}”${audienceLabel}.`
              : audience
                ? `${filter.emptyMessage.slice(0, -1)}${audienceLabel}.`
                : filter.emptyMessage
          }
        />
      );
    }

    return (
      <div className="-mx-5 sm:-mx-6">
        <div
          className={`hidden lg:grid ${GRID_COLUMNS} gap-4 border-b border-border px-6 pb-3 text-xs font-semibold uppercase tracking-wide text-muted`}
        >
          <span>Vacina</span>
          <span>Doença prevenida</span>
          <span>Público</span>
          <span>Doses</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>
        <ul className="divide-y divide-border">
          {visibleVaccines.map((vaccine) => {
            const isExpanded = expandedIds.has(vaccine.id);
            const scheduleId = `vaccine-doses-${vaccine.id}`;
            return (
              <li
                key={vaccine.id}
                className={`px-5 py-4 sm:px-6 transition-colors ${vaccine.id === highlightedId ? 'bg-success-soft/60' : ''}`}
              >
                <div className={`grid gap-2 ${GRID_COLUMNS} lg:items-center lg:gap-4`}>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary-dark">
                      <span className="break-words">{vaccine.name}</span>
                      {vaccine.id === highlightedId && <Badge variant="accent">Atualizada agora</Badge>}
                    </p>
                    {vaccine.description && (
                      <p className="text-xs text-muted break-words line-clamp-2">{vaccine.description}</p>
                    )}
                  </div>
                  <p className="text-sm text-primary-dark break-words">
                    <span className="text-xs text-muted lg:hidden">Previne: </span>
                    {vaccine.targetDisease}
                  </p>
                  <p className="text-sm text-primary-dark">
                    <span className="text-xs text-muted lg:hidden">Público: </span>
                    {TARGET_AUDIENCE_LABELS[vaccine.targetAudience]}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(vaccine.id)}
                      aria-expanded={isExpanded}
                      aria-controls={scheduleId}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2 -mx-2 text-sm font-semibold text-primary hover:bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {formatDosesCount(vaccine.doses.length)}
                      <ChevronDown className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      <span className="sr-only">{isExpanded ? 'Ocultar esquema' : 'Ver esquema'}</span>
                    </button>
                  </div>
                  <div>
                    <Badge variant={vaccine.isActive ? 'success' : 'neutral'}>
                      {vaccine.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="pt-1 lg:pt-0">{renderActions(vaccine)}</div>
                </div>
                {isExpanded && (
                  <div className="mt-4">
                    <DoseSchedule id={scheduleId} doses={vaccine.doses} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vacinas"
        subtitle="Catálogo de vacinas e esquemas de doses usados nas cadernetas"
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="vaccine-search" className="sr-only">
                Buscar vacina por nome ou doença
              </label>
              <input
                id="vaccine-search"
                type="search"
                autoComplete="off"
                maxLength={SEARCH_MAX_LENGTH}
                placeholder="Buscar por nome ou doença"
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
              Nova vacina
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
        title="Vacinas cadastradas"
        description={
          vaccineList.data
            ? `${visibleVaccines.length} ${visibleVaccines.length === 1 ? 'vacina' : 'vacinas'}`
            : undefined
        }
        action={
          vaccineList.isLoading && vaccineList.data ? (
            <span role="status" className="flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="size-4 animate-spin text-primary" />
              Atualizando...
            </span>
          ) : undefined
        }
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Filtrar por status" className="flex flex-wrap gap-2">
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
                  {vaccineList.data && <span className="ml-1.5 font-normal opacity-80">({counts[option.value]})</span>}
                </button>
              );
            })}
          </div>
          <div className="relative sm:w-56">
            <label htmlFor="vaccine-audience" className="sr-only">
              Filtrar por público-alvo
            </label>
            <select
              id="vaccine-audience"
              value={audience ?? ''}
              onChange={(event) => updateParams(filter.value, event.target.value || null)}
              className="w-full h-9 appearance-none rounded-full border border-border bg-white pl-4 pr-9 text-sm font-semibold text-primary-dark cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todos os públicos</option>
              {TARGET_AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          </div>
        </div>

        {renderList()}
      </Card>

      {modal?.type === 'form' && (
        <VaccineFormModal
          vaccine={modal.vaccine}
          onClose={closeModal}
          onSuccess={handleSaved}
          onOutdated={handleOutdated}
        />
      )}
      {modal?.type === 'status' && (
        <VaccineStatusDialog
          vaccine={modal.vaccine}
          onClose={closeModal}
          onSuccess={handleStatusChanged}
          onOutdated={handleOutdated}
        />
      )}
    </div>
  );
};

export default VaccineList;
