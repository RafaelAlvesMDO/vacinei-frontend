import React from 'react';
import { AlertCircle, History, Plus, Trash2 } from 'lucide-react';
import { TimeSelect } from '../../../components/ui/TimeSelect';
import {
  createSlot,
  formatOpeningHours,
  isValidTime,
  validateSlots,
  WEEKDAYS,
  type OpeningSlot,
} from '../openingHours';
import { OpeningHoursLines } from './OpeningHoursLines';

interface OpeningHoursFieldProps {
  slots: OpeningSlot[];
  onChange: (slots: OpeningSlot[]) => void;
  // Erros por faixa (id) e erro geral do campo (ex.: 400 da API)
  slotErrors: Record<string, string>;
  error?: string;
  // Texto salvo fora do padrão das faixas, exibido como referência
  legacyText?: string | null;
  disabled?: boolean;
}

const DAY_NAMES = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

// Faixas de horário de funcionamento: dias da semana + abertura e fechamento
export const OpeningHoursField: React.FC<OpeningHoursFieldProps> = ({
  slots,
  onChange,
  slotErrors,
  error,
  legacyText,
  disabled = false,
}) => {
  const usedDays = new Set(slots.flatMap((slot) => slot.days));
  const canAddSlot = usedDays.size < WEEKDAYS.length;
  // Prévia do texto salvo, só quando todas as faixas estão completas
  const preview = Object.keys(validateSlots(slots)).length === 0 ? formatOpeningHours(slots) : null;

  const updateSlot = (id: string, changes: Partial<OpeningSlot>) => {
    onChange(slots.map((slot) => (slot.id === id ? { ...slot, ...changes } : slot)));
  };

  const toggleDay = (slot: OpeningSlot, day: number) => {
    const days = slot.days.includes(day) ? slot.days.filter((value) => value !== day) : [...slot.days, day];
    updateSlot(slot.id, { days });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-primary-dark">Horário de funcionamento</p>

      {legacyText && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning-soft p-3 text-xs text-warning">
          <History className="size-4 shrink-0" />
          <p>
            Horário salvo anteriormente: <strong>“{legacyText}”</strong>. Ele não informa os dias da semana. Defina as
            faixas abaixo para atualizá-lo.
          </p>
        </div>
      )}

      {slots.map((slot, index) => {
        const slotError = slotErrors[slot.id];
        const errorId = `${slot.id}-error`;
        return (
          <div
            key={slot.id}
            role="group"
            aria-label={`Faixa de horário ${index + 1}`}
            className={`flex flex-col gap-3 rounded-xl border p-4 ${slotError ? 'border-danger/40' : 'border-border'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Faixa {index + 1}</span>
              {slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(slots.filter((item) => item.id !== slot.id))}
                  disabled={disabled}
                  aria-label={`Remover faixa ${index + 1}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-danger hover:bg-danger-soft cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/30 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                  Remover
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((label, day) => {
                const isSelected = slot.days.includes(day);
                const isUsedElsewhere = !isSelected && usedDays.has(day);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={isUsedElsewhere ? `${DAY_NAMES[day]} (já está em outra faixa)` : DAY_NAMES[day]}
                    title={isUsedElsewhere ? 'Já está em outra faixa' : undefined}
                    onClick={() => toggleDay(slot, day)}
                    disabled={disabled || isUsedElsewhere}
                    className={`h-9 min-w-12 rounded-full border px-3 text-sm font-semibold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40 ${
                      isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-white text-primary-dark hover:bg-surface'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TimeSelect
                id={`${slot.id}-opens`}
                label="Abre às"
                value={slot.opensAt}
                onChange={(opensAt) => updateSlot(slot.id, { opensAt })}
                disabled={disabled}
                invalid={!!slotError && !isValidTime(slot.opensAt)}
                describedBy={slotError ? errorId : undefined}
              />
              <TimeSelect
                id={`${slot.id}-closes`}
                label="Fecha às"
                value={slot.closesAt}
                onChange={(closesAt) => updateSlot(slot.id, { closesAt })}
                disabled={disabled}
                invalid={
                  !!slotError &&
                  (!isValidTime(slot.closesAt) || (isValidTime(slot.opensAt) && slot.closesAt <= slot.opensAt))
                }
                describedBy={slotError ? errorId : undefined}
              />
            </div>

            {slotError && (
              <p id={errorId} className="flex items-center gap-1 text-xs font-medium text-danger">
                <AlertCircle className="size-3.5 shrink-0" />
                {slotError}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={() => onChange([...slots, createSlot()])}
          disabled={disabled || !canAddSlot}
          title={canAddSlot ? undefined : 'Todos os dias já estão em alguma faixa'}
          className="inline-flex h-9 items-center gap-1.5 self-start rounded-xl border border-border px-3 text-sm font-semibold text-primary-dark hover:bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" />
          Adicionar horário
        </button>
        {preview && (
          <div className="text-xs text-muted sm:text-right">
            <p>Será exibido como:</p>
            <OpeningHoursLines text={preview} className="font-semibold text-primary-dark" />
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

export default OpeningHoursField;
