import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.closest('[inert]') && element.getClientRects().length > 0
  );
}

// Contêineres com foco preso, do mais antigo ao mais recente: só o do topo reage ao teclado
// (ex.: aviso de inatividade aberto sobre um formulário)
const trapStack: HTMLElement[] = [];

interface FocusTrapOptions {
  // Fecha o contêiner com a tecla Esc
  onEscape?: () => void;
  // Elemento focado ao abrir; sem ele (ou se devolver null), o primeiro elemento focável do contêiner
  getInitialFocus?: () => HTMLElement | null;
}

/**
 * Mantém o foco do teclado dentro do contêiner enquanto `isActive` (modais, menu lateral no celular).
 * Ao abrir, foca o primeiro elemento; ao fechar, devolve o foco a quem estava focado antes (WCAG 2.4.3)
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  isActive: boolean,
  { onEscape, getInitialFocus }: FocusTrapOptions = {}
): void {
  // Refs para usar sempre os callbacks mais recentes sem reiniciar o efeito
  const onEscapeRef = useRef(onEscape);
  const getInitialFocusRef = useRef(getInitialFocus);
  useEffect(() => {
    onEscapeRef.current = onEscape;
    getInitialFocusRef.current = getInitialFocus;
  }, [onEscape, getInitialFocus]);

  useEffect(() => {
    const container = containerRef.current;
    if (!isActive || !container) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    trapStack.push(container);

    // Respeita um autoFocus já aplicado dentro do contêiner
    if (!container.contains(document.activeElement)) {
      const target = getInitialFocusRef.current?.() ?? getFocusableElements(container)[0] ?? container;
      target.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (trapStack[trapStack.length - 1] !== container) return;
      if (event.key === 'Escape' && onEscapeRef.current) {
        event.stopPropagation();
        onEscapeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      trapStack.splice(trapStack.lastIndexOf(container), 1);
      // O botão que abriu pode ter saído da tela (ex.: lista recarregada)
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [containerRef, isActive]);
}
