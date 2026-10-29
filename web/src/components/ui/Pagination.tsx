import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { formatNumber } from '../../utils/format';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  // Ex.: { singular: 'usuário', plural: 'usuários' }
  itemLabel: { singular: string; plural: string };
  // Nome da lista para o leitor de tela, ex.: "Paginação dos usuários"
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

const BUTTON_CLASS =
  'inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary-dark hover:bg-surface active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100';

// Paginação das listas paginadas no servidor (D22): primeira/anterior, "Página X de Y", próxima/última e total
// de resultados (mesmo padrão do app)
export const Pagination: React.FC<Props> = ({
  page,
  totalPages,
  total,
  onPageChange,
  itemLabel,
  ariaLabel,
  disabled = false,
  className = '',
}) => {
  const lastPage = Math.max(totalPages, 1);
  const current = Math.min(page, lastPage);

  return (
    <nav
      aria-label={ariaLabel}
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-sm text-muted">
        {formatNumber(total)} {total === 1 ? itemLabel.singular : itemLabel.plural}
      </p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={disabled || current <= 1}
          aria-label="Primeira página"
          className={BUTTON_CLASS}
        >
          <ChevronsLeft className="size-4" aria-hidden="true" />
          {/* Abaixo do md só os ícones aparecem (o nome vem do aria-label), para os cinco itens caberem */}
          <span className="hidden md:inline">Primeira</span>
        </button>
        <button
          type="button"
          onClick={() => onPageChange(current - 1)}
          disabled={disabled || current <= 1}
          aria-label="Página anterior"
          className={BUTTON_CLASS}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden md:inline">Anterior</span>
        </button>
        <p
          className="min-w-0 text-center text-sm font-medium text-primary-dark tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          Página {formatNumber(current)} de {formatNumber(lastPage)}
        </p>
        <button
          type="button"
          onClick={() => onPageChange(current + 1)}
          disabled={disabled || current >= lastPage}
          aria-label="Próxima página"
          className={BUTTON_CLASS}
        >
          <span className="hidden md:inline">Próxima</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(lastPage)}
          disabled={disabled || current >= lastPage}
          aria-label="Última página"
          className={BUTTON_CLASS}
        >
          <span className="hidden md:inline">Última</span>
          <ChevronsRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
