import React from 'react';
import { AlertCircle, Inbox, Loader2, RotateCw } from 'lucide-react';

interface CardLoadingProps {
  label?: string;
  compact?: boolean;
}

export const CardLoading: React.FC<CardLoadingProps> = ({ label = 'Carregando...', compact = false }) => (
  <div
    role="status"
    className={`flex items-center justify-center gap-2 text-sm text-muted ${compact ? 'py-2' : 'flex-1 py-10'}`}
  >
    <Loader2 className="size-5 animate-spin text-primary" />
    <span>{label}</span>
  </div>
);

interface CardErrorProps {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const CardError: React.FC<CardErrorProps> = ({ message, onRetry, compact = false }) => (
  <div
    role="alert"
    className={`flex flex-col items-center justify-center gap-2 text-center ${compact ? 'py-1' : 'flex-1 py-10'}`}
  >
    <div className="flex items-start gap-2 text-sm text-danger">
      <AlertCircle className="size-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <RotateCw className="size-4" />
        Tentar novamente
      </button>
    )}
  </div>
);

interface CardEmptyProps {
  message: string;
  icon?: React.ElementType;
}

export const CardEmpty: React.FC<CardEmptyProps> = ({ message, icon: Icon = Inbox }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10 text-center">
    <span className="flex size-12 items-center justify-center rounded-full bg-surface text-primary">
      <Icon className="size-6" />
    </span>
    <p className="text-sm text-muted max-w-xs">{message}</p>
  </div>
);
