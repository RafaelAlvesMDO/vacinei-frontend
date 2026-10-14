import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { CardError, CardLoading } from './CardState';

interface StatCardProps {
  title: string;
  value: string | null;
  icon: React.ElementType;
  description?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  // Com `to`, o card inteiro vira um link (o texto do link aparece no rodapé)
  to?: string;
  linkLabel?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
  isLoading = false,
  error = null,
  onRetry,
  to,
  linkLabel = 'Ver detalhes',
}) => {
  const isDanger = variant === 'danger';
  // O erro tem o botão "Tentar novamente", que não pode ficar dentro de um link
  const isLink = Boolean(to) && !error;

  const containerClasses = `rounded-2xl border shadow-sm p-4 sm:p-5 flex flex-col gap-3 min-h-36 ${
    isDanger ? 'bg-danger-soft border-danger/25' : 'bg-white border-border'
  }`;

  const content = (
    <>
      <header className="flex items-start justify-between gap-3">
        <h2 className={`text-sm font-semibold leading-snug ${isDanger ? 'text-danger' : 'text-primary-dark'}`}>
          {title}
        </h2>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            isDanger ? 'bg-white text-danger' : 'bg-surface text-primary'
          }`}
        >
          <Icon className="size-5" />
        </span>
      </header>

      {isLoading ? (
        <CardLoading compact />
      ) : error ? (
        <CardError compact message={error} onRetry={onRetry} />
      ) : (
        <div>
          <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDanger ? 'text-danger' : 'text-primary-dark'}`}>
            {value ?? '—'}
          </p>
          {description && <p className="text-xs text-muted mt-1">{description}</p>}
        </div>
      )}

      {isLink && (
        <span
          className={`mt-auto inline-flex items-center gap-1 text-xs font-semibold group-hover:underline ${
            isDanger ? 'text-danger' : 'text-primary'
          }`}
        >
          {linkLabel}
          <ChevronRight className="size-4" />
        </span>
      )}
    </>
  );

  if (isLink && to) {
    return (
      <Link
        to={to}
        className={`group ${containerClasses} transition hover:shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 ${
          isDanger ? 'hover:border-danger/50 focus:ring-danger/30' : 'hover:border-primary/40 focus:ring-primary/30'
        }`}
      >
        {content}
      </Link>
    );
  }

  return <section className={containerClasses}>{content}</section>;
};

export default StatCard;
