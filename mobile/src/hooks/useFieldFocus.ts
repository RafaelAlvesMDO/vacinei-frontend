import { useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, findNodeHandle, type TextInputInstance, type View } from 'react-native';

// Campo que não é de texto (seleção, pílulas): só recebe o foco do leitor de tela
export type FocusableView = ComponentRef<typeof View>;

type Target = { kind: 'input'; node: TextInputInstance } | { kind: 'view'; node: FocusableView };

// Espera a tela renderizar com os erros, para o leitor de tela ler o campo já com a mensagem (na dica)
const FOCUS_DELAY_MS = 300;

/**
 * Foco no primeiro campo com erro (WCAG 3.3.1, RNF04): anuncia quantos campos precisam de atenção e leva o
 * foco do teclado (campos de texto) e do leitor de tela ao primeiro deles, na ordem da tela. Não valida nada:
 * recebe os erros que o formulário já calculou
 */
export function useFieldFocus<F extends string>(order: readonly F[]) {
  const targets = useRef<Partial<Record<F, Target>>>({});

  const register = (field: F, target: Target | null) => {
    if (target) targets.current[field] = target;
    else delete targets.current[field];
  };

  const inputRef = (field: F) => (node: TextInputInstance | null) =>
    register(field, node ? { kind: 'input', node } : null);

  const viewRef = (field: F) => (node: FocusableView | null) => register(field, node ? { kind: 'view', node } : null);

  const focusField = (field: F) => {
    const target = targets.current[field];
    if (!target) return;
    if (target.kind === 'input') target.node.focus();
    const handle = findNodeHandle(target.node);
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
  };

  const focusFirstError = (errors: Partial<Record<F, string | null | undefined>>) => {
    const fields = order.filter((field) => !!errors[field]);
    const first = fields[0];
    if (first === undefined) return;
    AccessibilityInfo.announceForAccessibility(
      fields.length === 1 ? '1 campo precisa de atenção.' : `${fields.length} campos precisam de atenção.`,
    );
    setTimeout(() => focusField(first), FOCUS_DELAY_MS);
  };

  return { inputRef, viewRef, focusField, focusFirstError };
}

export type FieldFocus<F extends string> = ReturnType<typeof useFieldFocus<F>>;
