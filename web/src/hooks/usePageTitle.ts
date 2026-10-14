import { useEffect } from 'react';

const APP_TITLE = 'Vacinei!? | Gerenciador Web';

/**
 * Título da aba por página (WCAG 2.4.2), ex.: "Usuários | Vacinei!? | Gerenciador Web"
 */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_TITLE}` : APP_TITLE;
  }, [title]);
}
