import { router, type Href } from 'expo-router';
import { clearLastNotificationResponseAsync, useLastNotificationResponse } from 'expo-notifications';
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import {
  DEFAULT_PREFERENCES,
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '@/services/notificationPreferences';
import {
  configureNotifications,
  getNotificationPermission,
  getNotificationUrl,
  requestNotificationPermission,
  rescheduleVaccineAlerts,
  type PermissionInfo,
} from '@/services/vaccineNotifications';
import type { AlertPreferences } from '@/utils/vaccineAlerts';

export interface VaccineAlertsContextValue {
  preferences: NotificationPreferences;
  permission: PermissionInfo | null;
  // A explicação da Início aparece até ser respondida, enquanto o sistema ainda pode pedir a permissão
  shouldPrompt: boolean;
  // Pede a permissão do sistema (depois da explicação do app). Devolve a situação nova
  enable: () => Promise<PermissionInfo>;
  dismissPrompt: () => void;
  // Ligar uma preferência sem permissão abre o pedido do sistema
  setPreference: (key: keyof AlertPreferences, value: boolean) => Promise<PermissionInfo | null>;
}

export const VaccineAlertsContext = createContext<VaccineAlertsContextValue | null>(null);

/**
 * Alertas de vacina (RF007) e lembretes (D31) da ala Cidadão: preferências, permissão, reagendamento a cada
 * carga da caderneta e abertura da tela certa ao tocar na notificação (nota 4)
 */
export function VaccineAlertsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const { card } = useVaccinationCard();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [permission, setPermission] = useState<PermissionInfo | null>(null);

  useEffect(() => {
    void configureNotifications();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getNotificationPreferences(userId).then((stored) => {
      if (!active) return;
      setPreferences(stored);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // A permissão pode mudar nas configurações do aparelho: confere de novo quando o app volta
  useEffect(() => {
    const check = () => {
      getNotificationPermission()
        .then(setPermission)
        .catch(() => undefined);
    };
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, []);

  // Reagenda sempre que a caderneta é carregada ou atualizada, cancelando as anteriores
  useEffect(() => {
    if (!card || !loaded || !permission) return;
    void rescheduleVaccineAlerts(card.vaccines, preferences);
  }, [card, loaded, permission, preferences]);

  // Toque na notificação: detalhe da vacina ou caderneta (a resposta só é tratada uma vez)
  const response = useLastNotificationResponse();
  const handledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handledRef.current === id) return;
    handledRef.current = id;
    // Sem limpar, a mesma resposta voltaria ao montar a ala de novo (ex.: depois de trocar de ala)
    clearLastNotificationResponseAsync().catch((error: unknown) => {
      console.warn('Não foi possível limpar a última notificação tocada.', error);
    });
    const url = getNotificationUrl(response);
    if (url) router.push(url as Href);
  }, [response]);

  const updatePreferences = useCallback(
    (changes: Partial<NotificationPreferences>) => {
      setPreferences((current) => {
        const next = { ...current, ...changes };
        if (userId) void saveNotificationPreferences(userId, next);
        return next;
      });
    },
    [userId],
  );

  const enable = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    updatePreferences({ prompted: true, ...(result.state === 'granted' ? { alerts: true, reminders: true } : {}) });
    return result;
  }, [updatePreferences]);

  const dismissPrompt = useCallback(() => updatePreferences({ prompted: true }), [updatePreferences]);

  const setPreference = useCallback(
    async (key: keyof AlertPreferences, value: boolean) => {
      updatePreferences({ [key]: value, prompted: true });
      if (!value || permission?.state === 'granted') return permission;
      const result = await requestNotificationPermission();
      setPermission(result);
      return result;
    },
    [permission, updatePreferences],
  );

  const shouldPrompt =
    loaded && !preferences.prompted && permission?.state === 'undetermined' && permission.canAskAgain;

  const value = useMemo(
    () => ({ preferences, permission, shouldPrompt, enable, dismissPrompt, setPreference }),
    [preferences, permission, shouldPrompt, enable, dismissPrompt, setPreference],
  );

  return <VaccineAlertsContext.Provider value={value}>{children}</VaccineAlertsContext.Provider>;
}
