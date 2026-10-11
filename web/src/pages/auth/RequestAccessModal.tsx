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
          {/* Ícone de Escudo de Alerta (vermelho) */}
          <div className="mb-4">
            <ShieldAlert className="size-20 text-red-500 stroke-[1.5]" />
          </div>

          {/* Texto descritivo */}
          <p className="text-sm text-slate-600 text-center max-w-[280px] leading-relaxed mb-6">
            Solicitar acesso ao administrador do sistema para criar sua conta
          </p>

          {/* Campo de e-mail */}
          <div className="w-full">
            <div
              className={`relative flex items-center rounded-2xl bg-stone-50 border transition-all ${
                error
                  ? 'border-red-400 ring-2 ring-red-100 bg-red-50/20'
                  : 'border-slate-300 focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100 focus-within:bg-white'
              }`}
            >
              <div className="pl-4 pr-2 text-slate-400 flex items-center pointer-events-none">
                <Mail className="size-5" />
              </div>
              <input
                id="request-access-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Digite seu email"
                autoComplete="email"
                disabled={isLoading}
                className="w-full py-3 pr-4 text-sm bg-transparent border-0 text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-600 text-center flex items-center justify-center gap-1 animate-in fade-in">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-center gap-4 mt-8 w-full">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-8 py-2.5 rounded-full border border-red-500 text-red-500 font-medium text-sm hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-10 py-2.5 rounded-full bg-[#005c9e] hover:bg-[#004d84] active:bg-[#003e6b] text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
          <div className="mb-6">
            <Send className="size-20 text-[#005c9e] stroke-[1.5] -rotate-12" />
          </div>

          <p className="text-base text-slate-800 font-medium leading-relaxed max-w-[280px] mb-4">
            Sua solicitação foi enviada ao administrador.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default RequestAccessModal;
