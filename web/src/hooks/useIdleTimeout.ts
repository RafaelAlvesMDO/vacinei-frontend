import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getIdleConfig, getIdleStatus, parseIdleTimeoutMinutes, type IdleStatus } from '../utils/idleTimeout';

// Tempo de inatividade configurável para testes (ex.: VITE_IDLE_TIMEOUT_MINUTES=2)
export const IDLE_TIMEOUT_MINUTES = parseIdleTimeoutMinutes(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES);

// Última atividade compartilhada entre as abas: usar o painel em uma aba mantém as outras conectadas
const LAST_ACTIVITY_KEY = '@vacinei:lastActivity';
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
const STORAGE_WRITE_INTERVAL_MS = 1000;
const TICK_MS = 1000;

function readSharedActivity(): number {
  try {
    return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeSharedActivity(timestamp: number): void {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
  } catch {
    // Sem storage (ex.: modo privado restrito), o controle vale só para esta aba
  }
}

interface UseIdleTimeoutOptions {
  enabled: boolean;
  onTimeout: () => void;
  minutes?: number;
}

interface UseIdleTimeoutResult {
  status: IdleStatus;
  // "Continuar conectado": reinicia a contagem
  stayConnected: () => void;
}

/**
 * Encerra a sessão após um período sem uso (RNF11), com aviso antes do fim.
 * Durante o aviso, mexer o mouse ou digitar não reinicia a contagem: é preciso escolher "Continuar conectado".
 * A contagem é calculada pelo relógio (e não por timers acumulados), então vale também após o computador hibernar
 */
export function useIdleTimeout({
  enabled,
  onTimeout,
  minutes = IDLE_TIMEOUT_MINUTES,
}: UseIdleTimeoutOptions): UseIdleTimeoutResult {
  const config = useMemo(() => getIdleConfig(minutes), [minutes]);
  const [status, setStatus] = useState<IdleStatus>({ phase: 'active', remainingMs: config.timeoutMs });

  const lastActivityRef = useRef(0);
  const lastWriteRef = useRef(0);
  const phaseRef = useRef<IdleStatus['phase']>('active');
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const registerActivity = useCallback((force: boolean) => {
    if (!force && phaseRef.current !== 'active') return;
    const now = Date.now();
    lastActivityRef.current = now;
    if (force || now - lastWriteRef.current >= STORAGE_WRITE_INTERVAL_MS) {
      lastWriteRef.current = now;
      writeSharedActivity(now);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Nova sessão: a contagem começa do zero, mesmo que outra aba tenha deixado uma atividade antiga salva
    phaseRef.current = 'active';
    registerActivity(true);

    const tick = () => {
      if (phaseRef.current === 'expired') return;

      const lastActivity = Math.max(lastActivityRef.current, readSharedActivity());
      lastActivityRef.current = lastActivity;
      const next = getIdleStatus(lastActivity, Date.now(), config);
      phaseRef.current = next.phase;

      // Fora do aviso, só a mudança de fase importa (evita renderizar o layout a cada segundo)
      setStatus((previous) =>
        next.phase === 'active' && previous.phase === 'active'
          ? previous
          : next.phase === previous.phase && Math.ceil(next.remainingMs / 1000) === Math.ceil(previous.remainingMs / 1000)
            ? previous
            : next
      );

      if (next.phase === 'expired') onTimeoutRef.current();
    };

    const handleActivity = () => registerActivity(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', handleVisibility);
    const intervalId = window.setInterval(tick, TICK_MS);
    // Primeira leitura logo após ativar (ex.: estado "expired" de uma sessão anterior volta a "active")
    const firstTickId = window.setTimeout(tick, 0);

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(intervalId);
      window.clearTimeout(firstTickId);
    };
  }, [enabled, config, registerActivity]);

  const stayConnected = useCallback(() => {
    phaseRef.current = 'active';
    registerActivity(true);
    setStatus({ phase: 'active', remainingMs: config.timeoutMs });
  }, [config, registerActivity]);

  return { status, stayConnected };
}
