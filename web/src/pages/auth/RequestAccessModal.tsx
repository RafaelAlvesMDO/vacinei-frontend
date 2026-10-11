import React, { useState } from 'react';
import { Mail, ShieldAlert, Send, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { parseApiError, requestAccess } from '../../services/auth';

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestAccessModal: React.FC<RequestAccessModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'form' | 'sent'>('form');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    onClose();
    // Reseta estado após fechamento com pequeno delay para transição suave
    setTimeout(() => {
      setStatus('form');
      setEmail('');
      setError(null);
      setIsLoading(false);
    }, 200);
  };

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) {
      setError('Por favor, informe seu e-mail institucional.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      setError('Insira um formato de e-mail válido.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await requestAccess(email);
      setStatus('sent');
    } catch (err) {
      const { message } = parseApiError(err, 'Não foi possível enviar a solicitação. Tente novamente mais tarde.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar conta">
      {status === 'form' ? (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col items-center">
          {/* Ícone de destaque */}
          <div className="mb-4 size-20 rounded-full bg-surface text-primary flex items-center justify-center">
            <ShieldAlert className="size-10 stroke-[1.5]" />
          </div>

          {/* Texto descritivo */}
          <p className="text-sm text-muted text-center max-w-[280px] leading-relaxed mb-6">
            Solicitar acesso ao administrador do sistema para criar sua conta
          </p>

          {/* Campo de e-mail */}
          <div className="w-full">
            <div
              className={`relative flex items-center rounded-xl bg-white border transition-all ${
                error
                  ? 'border-danger ring-2 ring-danger/15'
                  : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
              }`}
            >
              <input
                id="request-access-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Digite seu e-mail"
                autoComplete="email"
                disabled={isLoading}
                className="w-full py-3.5 pl-4 pr-2 text-base bg-transparent border-0 text-primary-dark placeholder:text-muted/70 focus:outline-none disabled:opacity-50"
              />
              <div className="pr-4 text-muted flex items-center pointer-events-none">
                <Mail className="size-5" />
              </div>
            </div>

            {error && (
              <p className="mt-1.5 text-xs text-danger font-medium flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3 mt-8 w-full">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-xl border border-border bg-white text-primary-dark font-semibold text-sm hover:bg-background transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <span>Enviar</span>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Estado de Confirmação: Solicitação Enviada */
        <div className="py-6 flex flex-col items-center text-center animate-in fade-in duration-300">
          <div className="mb-6 size-24 rounded-full bg-surface text-primary flex items-center justify-center">
            <Send className="size-11 stroke-[1.5] -rotate-12" />
          </div>

          <p className="text-base text-primary-dark font-medium leading-relaxed max-w-[280px] mb-4">
            Sua solicitação foi enviada ao administrador.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default RequestAccessModal;
