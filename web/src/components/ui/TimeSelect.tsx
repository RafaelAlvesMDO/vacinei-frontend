import React from 'react';
import { Clock } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const DEFAULT_MINUTES = ['00', '15', '30', '45'];

interface TimeSelectProps {
  id: string;
  label: string;
  // "HH:MM"; partes não escolhidas ficam vazias ("07:" ou "")
  value: string;
  onChange: (value: string) => void;
  minutes?: readonly string[];
  disabled?: boolean;
  invalid?: boolean;
  // Erro exibido em outro lugar, associado aos selects
  describedBy?: string;
}

// Seletor de horário em 24h (hora + minutos), igual em qualquer navegador e idioma,
// ao contrário do input type="time", que pode exibir AM/PM
export const TimeSelect: React.FC<TimeSelectProps> = ({
  id,
  label,
  value,
  onChange,
  minutes = DEFAULT_MINUTES,
  disabled = false,
  invalid = false,
  describedBy,
}) => {
  const [hour = '', minute = ''] = value.split(':');
  // Minuto salvo fora da lista (ex.: dados antigos com "07:20") continua selecionável
  const minuteOptions = minute && !minutes.includes(minute) ? [...minutes, minute].sort() : minutes;

  const update = (nextHour: string, nextMinute: string) => {
    onChange(nextHour || nextMinute ? `${nextHour}:${nextMinute}` : '');
  };

  const selectClasses =
    'appearance-none bg-transparent border-0 py-3.5 px-2 text-base text-center tabular-nums text-primary-dark cursor-pointer rounded-lg focus:outline-none focus:bg-surface disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <fieldset className="w-full min-w-0" disabled={disabled}>
      <legend className="block text-sm font-semibold text-primary-dark mb-1.5">{label}</legend>
      <div
        className={`flex items-center rounded-xl bg-white border pl-2 transition-all ${
          invalid
            ? 'border-danger ring-2 ring-danger/15'
            : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
        }`}
      >
        <select
          id={`${id}-hour`}
          aria-label={`${label}: hora`}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          value={hour}
          // Ao escolher a hora, os minutos começam em "00"
          onChange={(e) => update(e.target.value, minute || (e.target.value ? '00' : ''))}
          className={`${selectClasses} ${hour ? '' : 'text-muted/70'}`}
        >
          <option value="" disabled>
            --
          </option>
          {HOURS.map((option) => (
            <option key={option} value={option} className="text-primary-dark">
              {option}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="font-semibold text-muted">
          :
        </span>
        <select
          id={`${id}-minute`}
          aria-label={`${label}: minutos`}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          value={minute}
          onChange={(e) => update(hour, e.target.value)}
          className={`${selectClasses} ${minute ? '' : 'text-muted/70'}`}
        >
          <option value="" disabled>
            --
          </option>
          {minuteOptions.map((option) => (
            <option key={option} value={option} className="text-primary-dark">
              {option}
            </option>
          ))}
        </select>
        <Clock aria-hidden="true" className="ml-auto mr-4 size-5 shrink-0 text-muted" />
      </div>
    </fieldset>
  );
};

export default TimeSelect;
