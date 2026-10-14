import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

const BOX_CLASSES = 'relative flex items-center rounded-xl bg-white border transition-all';
const BOX_STATE_CLASSES = {
  error: 'border-danger ring-2 ring-danger/15',
  default: 'border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
};
// min-w-0: sem ele, o input (item flex) não encolhe abaixo da largura intrínseca (~20 caracteres)
const CONTROL_CLASSES =
  'w-full min-w-0 py-3.5 pl-4 pr-2 text-base bg-transparent border-0 text-primary-dark placeholder:text-muted focus:outline-none disabled:opacity-50';

interface FieldShellProps {
  id?: string;
  label?: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}

// Liga o campo à mensagem de erro (ou, sem erro, à dica) para o leitor de tela
function describedBy(id: string | undefined, error: string | undefined, hint: React.ReactNode): string | undefined {
  if (!id) return undefined;
  if (error) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}

// Rótulo, caixa do campo, dica e mensagem de erro no padrão visual dos modais de autenticação
const FieldShell: React.FC<FieldShellProps> = ({ id, label, error, hint, children }) => (
  <div className="w-full min-w-0">
    {label && (
      <label htmlFor={id} className="block text-sm font-semibold text-primary-dark mb-1.5 break-words">
        {label}
      </label>
    )}

    <div className={`${BOX_CLASSES} ${error ? BOX_STATE_CLASSES.error : BOX_STATE_CLASSES.default}`}>{children}</div>

    {hint && !error && (
      <div id={id ? `${id}-hint` : undefined} className="mt-1.5 text-xs text-muted">
        {hint}
      </div>
    )}

    {error && (
      // role="alert": o erro é anunciado pelo leitor de tela assim que aparece
      <p
        id={id ? `${id}-error` : undefined}
        role="alert"
        className="mt-1.5 text-xs text-danger font-medium flex items-start gap-1 animate-in fade-in"
      >
        <AlertCircle className="size-3.5 shrink-0 mt-px" />
        <span className="min-w-0 break-words">{error}</span>
      </p>
    )}
  </div>
);

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ElementType;
  label?: string;
  error?: string;
  hint?: React.ReactNode;
  // Ação à direita (ex.: exibir senha) substitui o ícone decorativo
  trailing?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ icon: Icon, label, error, hint, trailing, ...inputProps }) => (
  <FieldShell id={inputProps.id} label={label} error={error} hint={hint}>
    <input
      {...inputProps}
      aria-invalid={!!error}
      aria-describedby={describedBy(inputProps.id, error, hint)}
      className={CONTROL_CLASSES}
    />
    {trailing ?? (
      <div className="pr-4 text-muted flex items-center pointer-events-none">
        <Icon className="size-5" />
      </div>
    )}
  </FieldShell>
);

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: React.ReactNode;
  placeholder: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, error, hint, placeholder, options, ...selectProps }) => (
  <FieldShell id={selectProps.id} label={label} error={error} hint={hint}>
    <select
      {...selectProps}
      aria-invalid={!!error}
      aria-describedby={describedBy(selectProps.id, error, hint)}
      className={`${CONTROL_CLASSES} appearance-none cursor-pointer pr-10 ${selectProps.value ? '' : 'text-muted'}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="text-primary-dark">
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-4 size-5 text-muted" />
  </FieldShell>
);

export default FormField;
