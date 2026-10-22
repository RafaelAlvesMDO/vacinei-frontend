import { useEffect, useState } from 'react';

/**
 * Segundos restantes até `endsAt` (timestamp em ms), atualizados a cada segundo. null ou prazo vencido → 0.
 * Conta pelo relógio, e não por decrementos, para não atrasar com o app em segundo plano
 */
export function useCountdown(endsAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return;

    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= endsAt) clearInterval(timer);
    };
    // O primeiro tique sai logo, para o prazo novo não aparecer com o relógio anterior
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [endsAt]);

  if (endsAt === null) return 0;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}
