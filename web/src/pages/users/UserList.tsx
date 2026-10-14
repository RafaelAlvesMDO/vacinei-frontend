import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ExternalLink, Loader2, Power, PowerOff, Search, Users } from 'lucide-react';
import { FeedbackBanner, type Feedback } from '../../components/feedback/FeedbackBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../components/ui/CardState';
import { Pagination } from '../../components/ui/Pagination';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useClampPage, useFilterParams, usePageParam, useSearchParamInput } from '../../hooks/useUrlPagination';
import { listUsers } from '../../services/users';
import type { ManagedUser, UpdatedUser } from '../../types/user';
import { formatRegistry } from '../../utils/councils';
import { formatDate, formatNumber } from '../../utils/format';
import { UserStatusDialog } from './components/UserStatusDialog';
import {
  ROLE_BADGE_VARIANTS,
  ROLE_OPTIONS,
  VERIFICATION_DISPLAY,
  getCategoryLabel,
  getRoleLabel,
  getVerificationStatus,
  isUserRole,
} from './utils';

const FEEDBACK_DURATION_MS = 8000;
const SEARCH_MAX_LENGTH = 100;
const PAGE_SIZE = 10;

type StatusFilter = 'ativos' | 'inativos' | 'todos';

interface FilterOption {
  value: StatusFilter;
  label: string;
  // Filtro `isActive` da API; omitido em Todos
  isActive?: boolean;
  emptyMessage: string;
}

const FILTERS: FilterOption[] = [
  { value: 'ativos', label: 'Ativos', isActive: true, emptyMessage: 'Nenhum usuário ativo' },
  { value: 'inativos', label: 'Inativos', isActive: false, emptyMessage: 'Nenhum usuário desativado' },
  { value: 'todos', label: 'Todos', emptyMessage: 'Nenhum usuário cadastrado' },
];

const GRID_COLUMNS =
  'lg:grid-cols-[minmax(0,1.8fr)_8.5rem_9rem_6.5rem_5.5rem_minmax(8.5rem,auto)]';

// Rota /usuarios (só ADMIN): gestão de contas. LGPD: apenas dados cadastrais, nunca a caderneta.
// Usuários não são excluídos, só desativados, porque os registros de vacinação apontam para eles
export const UserList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { searchParams, setFilters } = useFilterParams();
  const filter = FILTERS.find((option) => option.value === searchParams.get('status')) ?? FILTERS[0];
  const roleParam = searchParams.get('perfil');
  const role = isUserRole(roleParam) ? roleParam : null;
  const { input: searchInput, setInput: setSearchInput, search, isTyping } = useSearchParamInput();
  const { page, setPage } = usePageParam();

  // Busca, filtros e paginação rodam na API (D22): só a página atual é baixada
  const fetchUsers = useCallback(
    () => listUsers({ page, limit: PAGE_SIZE, role: role ?? undefined, isActive: filter.isActive, search }),
    [page, role, filter.isActive, search]
  );
  const userList = useAsync(fetchUsers, 'Não foi possível carregar os usuários.');
  useClampPage(page, userList.data?.totalPages, userList.isLoading, setPage);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
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

  // Contadores da API: respeitam o perfil e a busca, mas não o status
  const apiCounts = userList.data?.counts;
  const counts: Record<StatusFilter, number> | null = apiCounts
    ? { ativos: apiCounts.active, inativos: apiCounts.inactive, todos: apiCounts.active + apiCounts.inactive }
    : null;
  const users = userList.data?.items ?? [];

  const closeDialog = useCallback(() => setSelectedUser(null), []);

  const handleStatusChanged = (user: UpdatedUser) => {
    setSelectedUser(null);
    setHighlightedId(user.id);
    setFeedback(
      user.isActive
        ? { variant: 'success', title: 'Conta reativada', detail: `${user.name} já pode entrar novamente.` }
        : {
            variant: 'success',
            title: 'Conta desativada',
            detail: `${user.name} perdeu o acesso. Os registros de vacinação foram mantidos.`,
          }
    );
    userList.reload();
  };

  const handleOutdated = (message: string) => {
    setSelectedUser(null);
    setHighlightedId(null);
    setFeedback({ variant: 'warning', title: 'A lista estava desatualizada', detail: message });
    userList.reload();
  };

  const renderProfessionalInfo = (user: ManagedUser) => {
    const registry = user.professionalRegistry;
    if (user.role !== 'PROFISSIONAL_SAUDE' || !registry) return null;
    const verification = VERIFICATION_DISPLAY[getVerificationStatus(registry)];
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span>
          {getCategoryLabel(registry.category)} · {formatRegistry(registry)}
        </span>
        <Badge variant={verification.variant}>{verification.label}</Badge>
        <Link
          to={
            verification.filter === 'pendentes'
              ? '/profissionais'
              : `/profissionais?status=${verification.filter}`
          }
          className="inline-flex items-center gap-1 rounded font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Ver em Profissionais
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  };

  const renderActions = (user: ManagedUser) => {
    // O admin não pode desativar a própria conta
    if (user.id === currentUser?.id) {
      return <p className="text-xs text-muted lg:text-right">Sua conta</p>;
    }

    return user.isActive ? (
      <button
        type="button"
        onClick={() => setSelectedUser(user)}
        aria-label={`Desativar a conta de ${user.name}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-danger/30 px-3 text-sm font-semibold text-danger hover:bg-danger-soft active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/30"
      >
        <PowerOff className="size-4" />
        Desativar
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setSelectedUser(user)}
        aria-label={`Reativar a conta de ${user.name}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <Power className="size-4" />
        Reativar
      </button>
    );
  };

  const renderList = () => {
    // Na recarga após uma ação, a lista anterior continua na tela
    if (userList.isLoading && !userList.data) {
      return <CardLoading label="Carregando usuários..." />;
    }

    if (!userList.data) {
      return <CardError message={userList.error?.message ?? ''} onRetry={userList.reload} />;
    }

    if (users.length === 0) {
      const roleLabel = role ? ` com o perfil ${getRoleLabel(role)}` : '';
      return (
        <CardEmpty
          icon={Users}
          message={
            search ? `Nenhum usuário encontrado para “${search}”${roleLabel}.` : `${filter.emptyMessage}${roleLabel}.`
          }
        />
      );
    }

    return (
      <div className="-mx-5 sm:-mx-6">
        <div
          className={`hidden lg:grid ${GRID_COLUMNS} gap-4 border-b border-border px-6 pb-3 text-xs font-semibold uppercase tracking-wide text-muted`}
        >
          <span>Usuário</span>
          <span>Perfil</span>
          <span>CPF</span>
          <span>Cadastro</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>
        <ul className="divide-y divide-border">
          {users.map((user) => (
            <li
              key={user.id}
              className={`px-5 py-4 sm:px-6 transition-colors ${user.id === highlightedId ? 'bg-success-soft/60' : ''}`}
            >
              <div className={`grid gap-2 ${GRID_COLUMNS} lg:items-center lg:gap-4`}>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary-dark">
                    <span className="break-words">{user.name}</span>
                    {user.id === currentUser?.id && <Badge variant="neutral">Você</Badge>}
                    {user.id === highlightedId && <Badge variant="accent">Atualizado agora</Badge>}
                  </p>
                  <p className="text-xs text-muted break-all">{user.email}</p>
                  {renderProfessionalInfo(user)}
                </div>
                <div>
                  <Badge variant={ROLE_BADGE_VARIANTS[user.role]}>{getRoleLabel(user.role)}</Badge>
                </div>
                <p className="text-sm text-primary-dark tabular-nums">
                  <span className="text-xs text-muted lg:hidden">CPF: </span>
                  {user.cpf}
                </p>
                <p className="text-sm text-primary-dark">
                  <span className="text-xs text-muted lg:hidden">Cadastro: </span>
                  {formatDate(user.createdAt)}
                </p>
                <div>
                  <Badge variant={user.isActive ? 'success' : 'neutral'}>{user.isActive ? 'Ativo' : 'Inativo'}</Badge>
                </div>
                <div className="flex pt-1 lg:justify-end lg:pt-0">{renderActions(user)}</div>
              </div>
            </li>
          ))}
        </ul>
        <Pagination
          page={page}
          totalPages={userList.data.totalPages}
          total={userList.data.total}
          onPageChange={setPage}
          itemLabel={{ singular: 'usuário', plural: 'usuários' }}
          ariaLabel="Paginação dos usuários"
          className="border-t border-border px-5 pt-4 sm:px-6"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuários"
        subtitle="Contas de cidadãos, profissionais e administradores (somente dados cadastrais)"
        actions={
          <div className="relative">
            <label htmlFor="user-search" className="sr-only">
              Buscar usuário por nome, e-mail ou CPF
            </label>
            <input
              id="user-search"
              type="search"
              autoComplete="off"
              maxLength={SEARCH_MAX_LENGTH}
              placeholder="Buscar por nome, e-mail ou CPF"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full h-12 rounded-xl border border-input bg-white pl-4 pr-11 text-sm text-primary-dark placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
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
        title="Usuários cadastrados"
        description={
          userList.data
            ? `${formatNumber(userList.data.total)} ${userList.data.total === 1 ? 'usuário' : 'usuários'}`
            : undefined
        }
        action={
          (userList.isLoading || isTyping) && userList.data ? (
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
                  onClick={() => setFilters({ status: option.value === 'ativos' ? null : option.value })}
                  className={`h-9 rounded-full border px-4 text-sm font-semibold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    isActive
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white text-primary-dark hover:bg-surface'
                  }`}
                >
                  {option.label}
                  {counts && (
                    <span className="ml-1.5 font-normal">({formatNumber(counts[option.value])})</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="relative sm:w-56">
            <label htmlFor="user-role" className="sr-only">
              Filtrar por perfil
            </label>
            <select
              id="user-role"
              value={role ?? ''}
              onChange={(event) => setFilters({ perfil: event.target.value || null })}
              className="w-full h-9 appearance-none rounded-full border border-input bg-white pl-4 pr-9 text-sm font-semibold text-primary-dark cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todos os perfis</option>
              {ROLE_OPTIONS.map((option) => (
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

      {selectedUser && (
        <UserStatusDialog
          user={selectedUser}
          onClose={closeDialog}
          onSuccess={handleStatusChanged}
          onOutdated={handleOutdated}
        />
      )}
    </div>
  );
};

export default UserList;
