import React from 'react';
import { Clock } from 'lucide-react';
import { formatTime } from '../../utils/format';

interface TimeInputProps {
  id: string;
  label: string;
  // "HH:MM", ou o que já foi digitado ("07", "07:3")
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  // Erro exibido em outro lugar, associado ao campo
  describedBy?: string;
}

// Campo de horário 24h com máscara: o usuário digita só números ("0700" → "07:00").
// Evita o input type="time", que pode exibir AM/PM conforme o idioma do navegador
export const TimeInput: React.FC<TimeInputProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  invalid = false,
  describedBy,
}) => (
  <div className="w-full min-w-0">
    <label htmlFor={id} className="block text-sm font-semibold text-primary-dark mb-1.5">
      {label}
    </label>
    <div
      className={`relative flex items-center rounded-xl bg-white border transition-all ${
        invalid
          ? 'border-danger ring-2 ring-danger/15'
          : 'border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
      }`}
    >
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        placeholder="07:00"
        value={value}
        onChange={(e) => onChange(formatTime(e.target.value))}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="w-full min-w-0 py-3.5 pl-4 pr-2 text-base tabular-nums bg-transparent border-0 text-primary-dark placeholder:text-muted focus:outline-none disabled:opacity-50"
      />
      <Clock aria-hidden="true" className="mr-4 size-5 shrink-0 text-muted pointer-events-none" />
    </div>
  </div>
);

export default TimeInput;
