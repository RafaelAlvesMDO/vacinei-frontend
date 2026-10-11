import React from 'react';
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
}) => {
  const isDanger = variant === 'danger';

  return (
    <section
      className={`rounded-2xl border shadow-sm p-4 sm:p-5 flex flex-col gap-3 min-h-36 ${
        isDanger ? 'bg-danger-soft border-danger/25' : 'bg-white border-border'
      }`}
    >
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
    </section>
  );
};

export default StatCard;
