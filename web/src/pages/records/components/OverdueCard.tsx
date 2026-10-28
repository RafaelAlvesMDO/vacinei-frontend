import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isCancel } from 'axios';
import { AlertTriangle, ChevronRight, Clock, Loader2, Search, UserRound } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../../components/ui/CardState';
import { Pagination } from '../../../components/ui/Pagination';
import { useAuth } from '../../../hooks/useAuth';
import { useClampPage, useFilterParams, usePageParam, useSearchParamInput } from '../../../hooks/useUrlPagination';
import { parseApiError } from '../../../services/auth';
import { getOverdue } from '../../../services/dashboard';
import type { OverdueGroup, OverdueList, OverdueVaccine, PendingDose } from '../../../types/dashboard';
import { formatCalendarDate, formatNumber } from '../../../utils/format';

const PAGE_SIZE = 10;
const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 100;
const GROUP_PARAM = 'grupo';

interface FetchState {
  term: string;
  group: OverdueGroup;
  page: number;
  attempt: number;
  data: OverdueList | null;
  error: string | null;
}

const DAYS_PER_YEAR = 365;

// Acima de 1 ano, só "mais de 1 ano" (D32)
function formatDays(days: number): string {
  if (days > DAYS_PER_YEAR) return 'mais de 1 ano';
  return `${formatNumber(days)} ${days === 1 ? 'dia' : 'dias'}`;
}

function formatPendingDoses(doses: PendingDose[]): string {
  return doses.map((dose) => dose.doseName).join(', ');
}

interface GroupOption {
  value: OverdueGroup;
  param: string | null;
  label: string;
}

// Grupo na URL (`?grupo=aguardando`); o padrão é Atrasadas
const GROUPS: GroupOption[] = [
  { value: 'ATRASADA', param: null, label: 'Atrasadas' },
  { value: 'AGUARDANDO_CONFERENCIA', param: 'aguardando', label: 'Aguardando conferência' },
];

const GROUP_TEXT: Record<OverdueGroup, { loading: string; error: string; empty: string; emptySearch: string }> = {
  ATRASADA: {
    loading: 'Carregando pessoas com doses atrasadas...',
    error: 'Não foi possível carregar as pessoas com doses atrasadas.',
    empty: 'Nenhuma dose atrasada no momento.',
    emptySearch: 'Nenhuma pessoa com doses atrasadas encontrada para',
  },
  AGUARDANDO_CONFERENCIA: {
    loading: 'Carregando doses aguardando conferência...',
    error: 'Não foi possível carregar as doses aguardando conferência.',
    empty: 'Nenhuma dose aguardando conferência no momento.',
    emptySearch: 'Nenhuma pessoa com doses aguardando conferência encontrada para',
  },
};

const PendingBadge: React.FC = () => (
  <Badge variant="warning" className="gap-1">
    <Clock className="size-3.5" />
    Registro aguardando confirmação
  </Badge>
);

// Busca ativa (RF009, D21) em dois grupos (D32): doses vencidas sem registro, das mais atrasadas para as menos,
// e doses já informadas pelo cidadão, que só dependem da conferência presencial.
// Só para o profissional verificado: são dados de saúde identificados (LGPD)
export const OverdueCard: React.FC = () => {
  const { refreshProfile } = useAuth();
  const { searchParams, setFilters } = useFilterParams();
  const group = GROUPS.find((option) => option.param === searchParams.get(GROUP_PARAM)) ?? GROUPS[0];
  // Busca (nome, com 1 caractere a lista continua completa) e página ficam na URL; filtro e paginação na API (D22)
  const { input: query, setInput: setQuery, search: searchTerm, isTyping } = useSearchParamInput({
    minLength: MIN_SEARCH_LENGTH,
  });
  const { page, setPage } = usePageParam();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<FetchState>({
    term: '',
    group: group.value,
    page: 0,
    attempt: -1,
    data: null,
    error: null,
  });
  const text = GROUP_TEXT[group.value];

  useEffect(() => {
    const controller = new AbortController();
    const status = group.value;

    getOverdue({ page, limit: PAGE_SIZE, search: searchTerm, status }, controller.signal)
      .then((data) => setState({ term: searchTerm, group: status, page, attempt, data, error: null }))
      .catch((error: unknown) => {
        if (isCancel(error)) return;
        const parsed = parseApiError(error, GROUP_TEXT[status].error);
        // 403: a verificação do profissional mudou desde o login
        if (parsed.status === 403) refreshProfile().catch(() => undefined);
        setState({ term: searchTerm, group: status, page, attempt, data: null, error: parsed.message });
      });

    return () => controller.abort();
  }, [searchTerm, group.value, page, attempt, refreshProfile]);

  const isFetching =
    state.term !== searchTerm || state.group !== group.value || state.page !== page || state.attempt !== attempt;
  const isLoading = isFetching || isTyping;
  useClampPage(page, state.data?.totalPages, isFetching, setPage);
  const reload = () => setAttempt((value) => value + 1);
  const { data } = state;
  // Os itens só seguem o grupo da resposta (durante a troca, a lista anterior continua na tela)
  const isAwaiting = state.group === 'AGUARDANDO_CONFERENCIA';

  const renderVaccines = (vaccines: OverdueVaccine[]) => (
    <ul className="mt-3 flex flex-col gap-2 border-t border-border/70 pt-3">
      {vaccines.map((vaccine) => (
        <li key={vaccine.vaccineId} className="flex flex-col gap-1 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className="text-primary-dark">
              <span className="font-medium">{vaccine.vaccineName}</span>
              <span className="text-muted">
                {' · '}
                {isAwaiting || !vaccine.nextDose ? formatPendingDoses(vaccine.pendingDoses) : vaccine.nextDose.doseName}
              </span>
            </span>
            {!isAwaiting && vaccine.nextDoseDate && (
              <span className="text-xs text-danger">prevista para {formatCalendarDate(vaccine.nextDoseDate)}</span>
            )}
          </div>
          {vaccine.pendingDoses.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <PendingBadge />
              <span className="text-xs text-muted">
                {isAwaiting
                  ? vaccine.pendingDoses
                      .map((dose) => `${dose.doseName}: aplicada em ${formatCalendarDate(dose.applicationDate)}`)
                      .join(' · ')
                  : `${formatPendingDoses(vaccine.pendingDoses)} ${
                      vaccine.pendingDoses.length === 1 ? 'informada' : 'informadas'
                    } pelo cidadão`}
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const renderList = () => {
    // Durante um novo filtro, a lista anterior continua na tela
    if (!data && isLoading) return <CardLoading label={text.loading} />;
    if (!data) return <CardError message={state.error ?? ''} onRetry={reload} />;

    if (data.items.length === 0) {
      return (
        <CardEmpty
          icon={isAwaiting ? Clock : AlertTriangle}
          message={
            state.term
              ? `${GROUP_TEXT[state.group].emptySearch} “${state.term}”.`
              : GROUP_TEXT[state.group].empty
          }
        />
      );
    }

    return (
      <>
        <ul className={`flex flex-col gap-3 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
          {data.items.map((person) => (
            <li key={person.id}>
              <Link
                to={`/confirmar-vacina?citizenId=${encodeURIComponent(person.id)}`}
                className={`group flex items-start gap-3 rounded-2xl border border-l-4 bg-white p-4 shadow-sm transition hover:shadow active:scale-[0.995] focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isAwaiting
                    ? 'border-warning/25 border-l-warning hover:bg-warning-soft/40'
                    : 'border-danger/25 border-l-danger hover:bg-danger-soft/40'
                }`}
              >
                <span className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-surface text-primary sm:flex">
                  <UserRound className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary-dark break-words group-hover:underline">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted tabular-nums">CPF {person.cpf ?? '—'}</p>
                    </div>
                    {person.maxDaysOverdue !== null && !isAwaiting && (
                      <Badge variant="danger" className="gap-1">
                        <AlertTriangle className="size-3.5" />
                        Atrasado há {formatDays(person.maxDaysOverdue)}
                      </Badge>
                    )}
                  </div>
                  {renderVaccines(person.vaccines)}
                </div>
                <ChevronRight className="mt-2 size-5 shrink-0 text-muted group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
        <Pagination
          page={page}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={setPage}
          itemLabel={{ singular: 'pessoa', plural: 'pessoas' }}
          ariaLabel={isAwaiting ? 'Paginação das pessoas com doses aguardando conferência' : 'Paginação das pessoas com doses atrasadas'}
          className="mt-5 border-t border-border pt-4"
        />
      </>
    );
  };

  return (
    <Card
      title="Busca ativa"
      description="Atrasadas: doses vencidas sem nenhum registro, das mais atrasadas para as menos. Aguardando conferência: doses que o cidadão já informou e só faltam ser confirmadas presencialmente. Clique para abrir a caderneta."
      action={
        isLoading && data ? (
          <span role="status" className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
            <Loader2 className="size-4 animate-spin text-primary" />
            Atualizando...
          </span>
        ) : undefined
      }
    >
      {data && (
        <dl className="mb-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          <div className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3">
            <dt className="text-xs font-semibold text-danger">Doses atrasadas</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-danger">
              {formatNumber(data.doseCounts.ATRASADA)}
            </dd>
            <dd className="text-xs text-danger">
              {formatNumber(data.counts.ATRASADA)} {data.counts.ATRASADA === 1 ? 'pessoa' : 'pessoas'}
            </dd>
          </div>
          <div className="rounded-xl border border-warning/25 bg-warning-soft px-4 py-3">
            <dt className="text-xs font-semibold text-warning">Aguardando conferência</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-warning">
              {formatNumber(data.doseCounts.AGUARDANDO_CONFERENCIA)}
            </dd>
            <dd className="text-xs text-warning">
              {formatNumber(data.counts.AGUARDANDO_CONFERENCIA)}{' '}
              {data.counts.AGUARDANDO_CONFERENCIA === 1 ? 'pessoa' : 'pessoas'}
            </dd>
          </div>
        </dl>
      )}

      <div role="group" aria-label="Grupo da busca ativa" className="mb-4 flex flex-wrap gap-2">
        {GROUPS.map((option) => {
          const isActive = option.value === group.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilters({ [GROUP_PARAM]: option.param })}
              className={`h-9 rounded-full border px-4 text-sm font-semibold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                isActive
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-white text-primary-dark hover:bg-surface'
              }`}
            >
              {option.label}
              {data && <span className="ml-1.5 font-normal">({formatNumber(data.counts[option.value])})</span>}
            </button>
          );
        })}
      </div>

      <div className="relative mb-5">
        <label htmlFor="overdue-search" className="sr-only">
          Filtrar pessoas com doses atrasadas pelo nome
        </label>
        <input
          id="overdue-search"
          type="search"
          autoComplete="off"
          maxLength={MAX_SEARCH_LENGTH}
          placeholder="Filtrar pelo nome"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full h-11 rounded-xl border border-input bg-white pl-4 pr-11 text-sm text-primary-dark placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
      </div>
      {query.trim().length === 1 && (
        <p className="-mt-3 mb-4 text-xs text-muted">Digite ao menos 2 caracteres para filtrar.</p>
      )}

      {renderList()}
    </Card>
  );
};

export default OverdueCard;
