import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isCancel } from 'axios';
import { AlertTriangle, ChevronRight, Loader2, Search, UserRound } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../../components/ui/CardState';
import { Pagination } from '../../../components/ui/Pagination';
import { useAuth } from '../../../hooks/useAuth';
import { useClampPage, usePageParam, useSearchParamInput } from '../../../hooks/useUrlPagination';
import { parseApiError } from '../../../services/auth';
import { getOverdue } from '../../../services/dashboard';
import type { OverdueList } from '../../../types/dashboard';
import { formatCalendarDate, formatNumber } from '../../../utils/format';

const PAGE_SIZE = 10;
const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 100;

interface FetchState {
  term: string;
  page: number;
  attempt: number;
  data: OverdueList | null;
  error: string | null;
}

function formatDays(days: number): string {
  return `${formatNumber(days)} ${days === 1 ? 'dia' : 'dias'}`;
}

// Busca ativa de faltosos (RF009, D21): pessoas com doses atrasadas, as mais atrasadas primeiro.
// Só para o profissional verificado: são dados de saúde identificados (LGPD)
export const OverdueCard: React.FC = () => {
  const { refreshProfile } = useAuth();
  // Busca (nome, com 1 caractere a lista continua completa) e página ficam na URL; filtro e paginação na API (D22)
  const { input: query, setInput: setQuery, search: searchTerm, isTyping } = useSearchParamInput({
    minLength: MIN_SEARCH_LENGTH,
  });
  const { page, setPage } = usePageParam();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<FetchState>({ term: '', page: 0, attempt: -1, data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();

    getOverdue({ page, limit: PAGE_SIZE, search: searchTerm }, controller.signal)
      .then((data) => setState({ term: searchTerm, page, attempt, data, error: null }))
      .catch((error: unknown) => {
        if (isCancel(error)) return;
        const parsed = parseApiError(error, 'Não foi possível carregar as pessoas com doses atrasadas.');
        // 403: a verificação do profissional mudou desde o login
        if (parsed.status === 403) refreshProfile().catch(() => undefined);
        setState({ term: searchTerm, page, attempt, data: null, error: parsed.message });
      });

    return () => controller.abort();
  }, [searchTerm, page, attempt, refreshProfile]);

  const isFetching = state.term !== searchTerm || state.page !== page || state.attempt !== attempt;
  const isLoading = isFetching || isTyping;
  useClampPage(page, state.data?.totalPages, isFetching, setPage);
  const reload = () => setAttempt((value) => value + 1);
  const { data } = state;

  const renderList = () => {
    // Durante um novo filtro, a lista anterior continua na tela
    if (!data && isLoading) return <CardLoading label="Carregando pessoas com doses atrasadas..." />;
    if (!data) return <CardError message={state.error ?? ''} onRetry={reload} />;

    if (data.items.length === 0) {
      return (
        <CardEmpty
          icon={AlertTriangle}
          message={
            state.term
              ? `Nenhuma pessoa com doses atrasadas encontrada para “${state.term}”.`
              : 'Nenhuma dose atrasada no momento.'
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
                className="group flex items-start gap-3 rounded-2xl border border-danger/25 border-l-4 border-l-danger bg-white p-4 shadow-sm transition hover:bg-danger-soft/40 hover:shadow active:scale-[0.995] focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                    <Badge variant="danger" className="gap-1">
                      <AlertTriangle className="size-3.5" />
                      Atrasado há {formatDays(person.maxDaysOverdue)}
                    </Badge>
                  </div>
                  <ul className="mt-3 flex flex-col gap-1.5 border-t border-border/70 pt-3">
                    {person.overdueVaccines.map((vaccine) => (
                      <li
                        key={vaccine.vaccineId}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm"
                      >
                        <span className="text-primary-dark">
                          <span className="font-medium">{vaccine.vaccineName}</span>
                          <span className="text-muted"> · {vaccine.nextDose.doseName}</span>
                        </span>
                        <span className="text-xs text-danger">
                          prevista para {formatCalendarDate(vaccine.nextDoseDate)}
                        </span>
                      </li>
                    ))}
                  </ul>
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
          ariaLabel="Paginação das pessoas com doses atrasadas"
          className="mt-5 border-t border-border pt-4"
        />
      </>
    );
  };

  return (
    <Card
      title="Busca ativa — doses atrasadas"
      description="Pessoas com vacinas em atraso, das mais atrasadas para as menos. Clique para abrir a caderneta."
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
        <dl className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3">
            <dt className="text-xs font-semibold text-danger">
              {state.term ? 'Pessoas encontradas' : 'Pessoas com doses atrasadas'}
            </dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-danger">{formatNumber(data.totalPessoas)}</dd>
          </div>
          <div className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3">
            <dt className="text-xs font-semibold text-danger">Doses atrasadas</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-danger">
              {formatNumber(data.totalDosesAtrasadas)}
            </dd>
          </div>
        </dl>
      )}

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
