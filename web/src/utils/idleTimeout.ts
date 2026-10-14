// Encerramento da sessão por inatividade (RNF11). Funções puras, sem React, para testar sem esperar o tempo passar

export const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;
// O aviso aparece 1 minuto antes de encerrar
export const IDLE_WARNING_MS = 60_000;

const MINUTE_MS = 60_000;

/**
 * Converte VITE_IDLE_TIMEOUT_MINUTES em minutos. Aceita decimais ("0.5") para testes rápidos;
 * valor ausente, inválido ou não positivo volta para o padrão de 30 minutos
 */
export function parseIdleTimeoutMinutes(raw: string | undefined): number {
  const minutes = Number(raw?.trim().replace(',', '.'));
  return raw?.trim() && Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_IDLE_TIMEOUT_MINUTES;
}

export interface IdleConfig {
  timeoutMs: number;
  // Antecedência do aviso. Com tempo total de até 2 minutos, o aviso ocupa a metade (ex.: 1 min → aviso de 30 s)
  warningMs: number;
}

export function getIdleConfig(minutes: number): IdleConfig {
  const timeoutMs = minutes * MINUTE_MS;
  return { timeoutMs, warningMs: Math.min(IDLE_WARNING_MS, timeoutMs / 2) };
}

export type IdlePhase = 'active' | 'warning' | 'expired';

export interface IdleStatus {
  phase: IdlePhase;
  // Tempo até o encerramento (0 quando expirado)
  remainingMs: number;
}

export function getIdleStatus(lastActivityAt: number, now: number, { timeoutMs, warningMs }: IdleConfig): IdleStatus {
  const remainingMs = Math.max(0, lastActivityAt + timeoutMs - now);
  if (remainingMs === 0) return { phase: 'expired', remainingMs };
  if (remainingMs <= warningMs) return { phase: 'warning', remainingMs };
  return { phase: 'active', remainingMs };
}

// "0:59", "1:00"
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// "30 minutos", "2 minutos", "1 minuto", "30 segundos"
export function formatIdleDuration(minutes: number): string {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
  }
  const rounded = Math.round(minutes * 10) / 10;
  return `${String(rounded).replace('.', ',')} ${rounded === 1 ? 'minuto' : 'minutos'}`;
}
