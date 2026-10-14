import React from 'react';
import { LogOut, TimerReset } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { formatCountdown } from '../../utils/idleTimeout';

interface IdleWarningModalProps {
  isOpen: boolean;
  remainingMs: number;
  onStayConnected: () => void;
  onSignOut: () => void;
}

// Aviso de sessão prestes a expirar por inatividade (RNF11). Só fecha pelos botões
export const IdleWarningModal: React.FC<IdleWarningModalProps> = ({ isOpen, remainingMs, onStayConnected, onSignOut }) => (
  <Modal
    isOpen={isOpen}
    onClose={onStayConnected}
    title="Sua sessão vai expirar"
    role="alertdialog"
    dismissible={false}
  >
    <div className="flex flex-col gap-6">
      <p className="text-sm leading-relaxed text-muted">
        Por segurança, a sessão é encerrada após um período sem uso. Você será desconectado em{' '}
        {/* A contagem não é anunciada a cada segundo; o leitor de tela lê o aviso ao abrir */}
        <strong className="font-semibold tabular-nums text-primary-dark" aria-live="off">
          {formatCountdown(remainingMs)}
        </strong>
        .
      </p>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onStayConnected}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
        >
          <TimerReset className="size-4" />
          Continuar conectado
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-primary-dark hover:bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <LogOut className="size-4" />
          Sair agora
        </button>
      </div>
    </div>
  </Modal>
);

export default IdleWarningModal;
