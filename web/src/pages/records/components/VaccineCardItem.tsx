import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Syringe } from 'lucide-react';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import type { CardRecord, CardVaccine, VaccineScheduleStatus } from '../../../types/vaccination';
import { formatCalendarDate, formatDate } from '../../../utils/format';

const STATUS_CONFIG: Record<VaccineScheduleStatus, { label: string; variant: BadgeVariant; icon: React.ElementType }> = {
  ATRASADA: { label: 'Atrasada', variant: 'danger', icon: AlertTriangle },
  EM_DIA: { label: 'Em dia', variant: 'accent', icon: Clock },
  COMPLETA: { label: 'Completa', variant: 'success', icon: CheckCircle2 },
};

interface VaccineCardItemProps {
  item: CardVaccine;
  // Destaque temporário após uma confirmação (RNF03)
  isHighlighted: boolean;
  // false na própria caderneta do profissional (RS006): esconde as ações de confirmar
  canConfirm: boolean;
  onConfirm: (vaccineId: string) => void;
  // Registro do cidadão aguardando confirmação, mesmo em vacina COMPLETA (RF007 nota 7)
  onConfirmRecord: (item: CardVaccine, record: CardRecord) => void;
}

export const VaccineCardItem: React.FC<VaccineCardItemProps> = ({
  item,
  isHighlighted,
  canConfirm,
  onConfirm,
  onConfirmRecord,
}) => {
  const { vaccine, status, appliedDoses, totalDoses, nextDose, nextDoseDate, records } = item;
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const isOverdue = status === 'ATRASADA';
  const progress = totalDoses > 0 ? Math.round((appliedDoses / totalDoses) * 100) : 0;

  const containerClasses = isHighlighted
    ? 'border-success bg-success-soft ring-2 ring-success/40'
    : isOverdue
      ? 'border-danger/30 bg-danger-soft/60 border-l-4 border-l-danger'
      : 'border-border bg-white';

  return (
    <li className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-colors duration-500 ${containerClasses}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-base font-semibold text-primary-dark break-words">{vaccine.name}</h3>
            <Badge variant={config.variant} className="gap-1">
              <StatusIcon className="size-3.5" />
              {config.label}
            </Badge>
            {isHighlighted && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="size-3.5" />
                Atualizada agora
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted mt-0.5 break-words">{vaccine.targetDisease}</p>

          <div className="mt-3 flex items-center gap-3">
            <div
              role="progressbar"
              aria-label={`Doses aplicadas de ${vaccine.name}`}
              aria-valuemin={0}
              aria-valuemax={totalDoses}
              aria-valuenow={appliedDoses}
              className="h-2 flex-1 max-w-48 overflow-hidden rounded-full bg-background"
            >
              <div
                className={`h-full rounded-full ${isOverdue ? 'bg-danger' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-primary-dark whitespace-nowrap">
              {appliedDoses}/{totalDoses} doses
            </span>
          </div>

          {nextDose && (
            <p className={`mt-2 text-sm ${isOverdue ? 'text-danger font-semibold' : 'text-muted'}`}>
              Próxima: {nextDose.doseName}
              {nextDoseDate && ` · ${isOverdue ? 'prevista para' : 'a partir de'} ${formatCalendarDate(nextDoseDate)}`}
            </p>
          )}
        </div>

        {canConfirm && status !== 'COMPLETA' && (
          <button
            type="button"
            onClick={() => onConfirm(vaccine.id)}
            className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              isOverdue ? 'bg-primary text-white hover:bg-primary-dark' : 'border border-primary text-primary hover:bg-surface'
            }`}
          >
            <Syringe className="size-4" />
            Confirmar dose
          </button>
        )}
      </div>

      {records.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-3">
          {records.map((record) => (
            // Em telas estreitas, o badge e o botão quebram para a linha de baixo
            <li key={record.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-sm">
              <span className="min-w-0 text-primary-dark break-words">
                <span className="font-medium">{record.dose.doseName}</span>
                <span className="text-muted">
                  {' · '}
                  {record.applicationDate ? formatDate(record.applicationDate) : 'sem data'}
                  {record.lotNumber && ` · Lote ${record.lotNumber}`}
                </span>
              </span>
              {record.status === 'CONFIRMADO' ? (
                <Badge variant="accent">Confirmado</Badge>
              ) : (
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <Badge variant="warning">Aguardando confirmação</Badge>
                  {canConfirm && (
                    <button
                      type="button"
                      onClick={() => onConfirmRecord(item, record)}
                      aria-label={`Confirmar ${record.dose.doseName} de ${vaccine.name}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary px-3 text-xs font-semibold text-primary hover:bg-surface active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <CheckCircle2 className="size-4" />
                      Confirmar
                    </button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default VaccineCardItem;
