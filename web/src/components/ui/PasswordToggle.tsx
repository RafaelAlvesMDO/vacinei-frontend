import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  disabled?: boolean;
  // Ex.: "senha" ou "senhas" (quando o botão controla vários campos)
  noun?: string;
}

// Botão de exibir/ocultar senha, usado como `trailing` do FormField. Alcançável pelo Tab e com nome acessível
export const PasswordToggle: React.FC<PasswordToggleProps> = ({ isVisible, onToggle, disabled = false, noun = 'senha' }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    aria-label={`Exibir ${noun}`}
    aria-pressed={isVisible}
    className="mr-2 rounded-lg p-2 text-muted hover:text-primary-dark transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
  >
    {isVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
  </button>
);

export default PasswordToggle;
