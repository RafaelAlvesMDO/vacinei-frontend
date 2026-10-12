import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isCancel } from 'axios';
import { AlertCircle, Loader2, Search, UserRound } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { parseApiError } from '../../services/auth';
import { searchCitizens } from '../../services/citizens';
import type { CitizenSearchResult } from '../../types/citizen';
import { formatCalendarDate } from '../../utils/format';

const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 100;

interface SearchState {
  term: string;
  results: CitizenSearchResult[];
  error: string | null;
}

// Busca de cidadãos (PROFISSIONAL_SAUDE): leva à confirmação de vacina com o cidadão escolhido
export const CitizenSearch: React.FC = () => {
  const navigate = useNavigate();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchState, setSearchState] = useState<SearchState>({ term: '', results: [], error: null });

  const debouncedQuery = useDebounce(query.trim(), 400);
  const isQueryValid = debouncedQuery.length >= MIN_SEARCH_LENGTH;
  // A busca está pendente enquanto o resultado não corresponde ao termo digitado
  const isSearching = query.trim().length >= MIN_SEARCH_LENGTH && searchState.term !== query.trim();

  useEffect(() => {
    if (!isQueryValid) return;

    const controller = new AbortController();

    searchCitizens(debouncedQuery, controller.signal)
      .then((results) => setSearchState({ term: debouncedQuery, results, error: null }))
      .catch((error: unknown) => {
        if (isCancel(error)) return;
        const { message } = parseApiError(error, 'Não foi possível buscar os cidadãos.');
        setSearchState({ term: debouncedQuery, results: [], error: message });
      });

    return () => controller.abort();
  }, [debouncedQuery, isQueryValid]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const results = isSearching ? [] : searchState.results;

  const selectCitizen = (citizen: CitizenSearchResult) => {
    setIsOpen(false);
    navigate(`/confirmar-vacina?citizenId=${encodeURIComponent(citizen.id)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      selectCitizen(results[activeIndex]);
    }
  };

  const trimmedLength = query.trim().length;
  const showDropdown = isOpen && trimmedLength > 0;

  const renderDropdownContent = () => {
    if (trimmedLength < MIN_SEARCH_LENGTH) {
      return <p className="px-4 py-3 text-sm text-muted">Digite ao menos 2 caracteres para buscar.</p>;
    }
    if (isSearching) {
      return (
        <p role="status" className="flex items-center gap-2 px-4 py-3 text-sm text-muted">
          <Loader2 className="size-4 animate-spin text-primary" />
          Buscando cidadãos...
        </p>
      );
    }
    if (searchState.error) {
      return (
        <p role="alert" className="flex items-start gap-2 px-4 py-3 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          {searchState.error}
        </p>
      );
    }
    if (results.length === 0) {
      return <p className="px-4 py-3 text-sm text-muted">Nenhum cidadão encontrado para “{query.trim()}”.</p>;
    }

    return (
      <ul id={listboxId} role="listbox" aria-label="Cidadãos encontrados" className="max-h-80 overflow-y-auto py-1">
        {results.map((citizen, index) => (
          <li
            key={citizen.id}
            id={`${listboxId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selectCitizen(citizen)}
            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${
              index === activeIndex ? 'bg-surface' : ''
            }`}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-primary">
              <UserRound className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-primary-dark truncate">{citizen.name}</span>
              <span className="block text-xs text-muted">
                CPF {citizen.cpf ?? '—'} · Nasc. {formatCalendarDate(citizen.birthDate)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        Buscar cidadão por nome ou CPF
      </label>
      <input
        id={`${listboxId}-input`}
        type="search"
        role="combobox"
        autoComplete="off"
        maxLength={MAX_SEARCH_LENGTH}
        placeholder="Buscar cidadão por nome ou CPF"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        className="w-full h-12 rounded-xl border border-border bg-white pl-4 pr-11 text-sm text-primary-dark placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
      <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {renderDropdownContent()}
        </div>
      )}
    </div>
  );
};

export default CitizenSearch;
