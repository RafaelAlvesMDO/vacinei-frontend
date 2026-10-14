import React from 'react';

// Listagens administrativas: tabela de colunas fixas a partir do xl e cards empilhados abaixo dele.
// O cabeçalho e as linhas leem o mesmo grid-template-columns (variável CSS), então título e conteúdo
// de cada coluna ficam sempre alinhados, e a largura não muda conforme o conteúdo da linha.

export interface DataTableColumn {
  header: string;
  // Valor do grid-template-columns: `minmax(0,2fr)` para texto, `rem` fixo para colunas curtas
  width: string;
  align?: 'left' | 'right';
}

// Botões de alternar estado (Desativar/Reativar, Verificar/Recusar) com a mesma largura mínima,
// para o botão vizinho não mudar de lugar entre as linhas
export const TOGGLE_ACTION_CLASS = 'min-w-[7.25rem] justify-center';

interface DataTableProps {
  columns: DataTableColumn[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, children, footer }) => {
  const style = {
    '--data-table-columns': columns.map((column) => column.width).join(' '),
  } as React.CSSProperties;

  return (
    <div className="-mx-5 sm:-mx-6" style={style}>
      <div className="hidden xl:grid xl:grid-cols-(--data-table-columns) gap-4 border-b border-border px-6 pb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        {columns.map((column) => (
          <span key={column.header} className={column.align === 'right' ? 'text-right' : 'text-left'}>
            {column.header}
          </span>
        ))}
      </div>
      <ul className="divide-y divide-border">{children}</ul>
      {footer}
    </div>
  );
};

interface DataTableRowProps {
  children: React.ReactNode;
  highlighted?: boolean;
  // Conteúdo abaixo das colunas, na largura da linha (ex.: esquema de doses expandido)
  details?: React.ReactNode;
}

export const DataTableRow: React.FC<DataTableRowProps> = ({ children, highlighted = false, details }) => (
  <li className={`px-5 py-4 sm:px-6 transition-colors ${highlighted ? 'bg-success-soft/60' : ''}`}>
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-(--data-table-columns) xl:items-center xl:gap-4 [&>*]:min-w-0">
      {children}
    </div>
    {details}
  </li>
);

// Célula de ações: à direita na tabela e à esquerda nos cards
export const DataTableActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-wrap items-center gap-2 pt-1 xl:justify-end xl:pt-0">{children}</div>
);

export default DataTable;
