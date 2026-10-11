import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';

interface UnderConstructionProps {
  title: string;
  description: string;
}

// Página provisória das telas ainda não implementadas (etapas 4 e 5)
export const UnderConstruction: React.FC<UnderConstructionProps> = ({ title, description }) => (
  <div className="flex flex-col gap-6">
    <PageHeader title={title} subtitle={description} />

    <div className="bg-white rounded-2xl border border-border shadow-sm px-6 py-14 flex flex-col items-center text-center gap-4">
      <span className="flex size-14 items-center justify-center rounded-full bg-surface text-primary">
        <Construction className="size-6" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-primary-dark">Página em construção</h2>
        <p className="text-sm text-muted mt-1 max-w-md">
          Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary-dark hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <ArrowLeft className="size-4" />
        Voltar ao dashboard
      </Link>
    </div>
  </div>
);

export default UnderConstruction;
