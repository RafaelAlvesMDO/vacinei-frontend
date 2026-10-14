import React from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  // Conteúdo exibido à direita do título (ex.: busca)
  actions?: React.ReactNode;
}

// Cabeçalho da página; o título também vai para a aba do navegador
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  usePageTitle(title);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm px-5 py-5 sm:px-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="w-full md:max-w-md">{actions}</div>}
    </div>
  );
};

export default PageHeader;
