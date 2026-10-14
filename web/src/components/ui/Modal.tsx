import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  // "alertdialog" para avisos que exigem resposta (ex.: sessão prestes a expirar)
  role?: 'dialog' | 'alertdialog';
  // Esconde o botão de fechar e ignora Esc e o clique fora (a resposta tem de vir dos botões do modal)
  dismissible?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-[460px]',
  role = 'dialog',
  dismissible = true,
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Foco preso no modal, Esc fecha e o foco volta ao botão que o abriu (WCAG 2.1.2 e 2.4.3).
  // O foco inicial vai para o primeiro campo ou botão do conteúdo, e não para o "Fechar"
  useFocusTrap(panelRef, isOpen, {
    onEscape: dismissible ? onClose : undefined,
    getInitialFocus: () =>
      contentRef.current?.querySelector<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href]'
      ) ?? null,
  });

  // Evita scroll da página de fundo quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-dark/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative w-full min-w-0 ${maxWidth} max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-3xl p-5 min-[400px]:p-7 sm:p-9 shadow-xl flex flex-col transition-all animate-in zoom-in-95 duration-200 focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between gap-3 mb-6">
          {title ? (
            <h2 id={titleId} className="min-w-0 text-xl min-[400px]:text-2xl font-bold text-primary-dark tracking-tight break-words">
              {title}
            </h2>
          ) : (
            <div />
          )}

          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="shrink-0 text-muted hover:text-primary-dark hover:bg-surface p-1.5 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Conteúdo do Modal */}
        <div ref={contentRef} className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
