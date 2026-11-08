import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { ConfirmDialog } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useDependents } from '@/hooks/useDependents';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import {
  DEFAULT_PREFERENCES,
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '@/services/notificationPreferences';
import {
  getNotificationPermission,
  requestNotificationPermission,
  rescheduleVaccineAlerts,
  type NotificationPerson,
  type PermissionInfo,
} from '@/services/vaccineNotifications';
import { getFirstName } from '@/utils/roles';
import { getDependentTarget, SELF_TARGET, type AlertPreferences } from '@/utils/vaccineAlerts';

export interface VaccineAlertsContextValue {
  preferences: NotificationPreferences;
  // null enquanto consulta; `unavailable` no Expo Go (D36)
  permission: PermissionInfo | null;
  // Titular e dependentes com caderneta carregada (para o teste do Perfil)
  people: NotificationPerson[];
  // Ligar uma preferência sem permissão abre o pedido do sistema
  setPreference: (key: keyof AlertPreferences, value: boolean) => Promise<void>;
}

export const VaccineAlertsContext = createContext<VaccineAlertsContextValue | null>(null);

// Espera as cargas da caderneta e dos dependentes assentarem antes de reagendar
const RESCHEDULE_DELAY_MS = 500;

/**
 * Notificações do sistema da ala Cidadão (RF007, D31, D36), só no build instalável: preferências, permissão
 * explicada por um modal depois do login e reagendamento do titular e dos dependentes. Reagenda quando a
 * caderneta do titular ou de um dependente carrega (abrir o app, registrar, editar ou excluir dose), quando
 * a lista de dependentes muda e quando o app volta ao primeiro plano
 */
export function VaccineAlertsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const { card } = useVaccinationCard();
  const { dependents } = useDependents();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionInfo | null>(null);
  const [requesting, setRequesting] = useState(false);
  const loaded = loadedFor !== null && loadedFor === userId;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getNotificationPreferences(userId).then((stored) => {
      if (!active) return;
      setPreferences(stored);
      setLoadedFor(userId);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // A permissão pode mudar nas configurações do aparelho: confere de novo quando o app volta. A consulta
  // nova também reagenda, o que mantém os avisos certos quando o dia muda com o app em segundo plano
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

  const people = useMemo<NotificationPerson[]>(() => {
    if (!card) return [];
    const list: NotificationPerson[] = [{ key: 'titular', target: SELF_TARGET, vaccines: card.vaccines }];
    for (const { dependent, card: dependentCard } of dependents ?? []) {
      if (!dependentCard) continue;
      list.push({
        key: dependent.id,
        target: getDependentTarget(dependent.id, getFirstName(dependent.name)),
        vaccines: dependentCard.vaccines,
      });
    }
    return list;
  }, [card, dependents]);

  // Sem a caderneta do titular ou a lista de dependentes (ex.: sem rede), os agendamentos anteriores ficam
  const ready = loaded && card !== null && dependents !== null && permission !== null;
  const available = permission !== null && permission.state !== 'unavailable';

  useEffect(() => {
    if (!ready || !available) return;
    const timer = setTimeout(() => {
      void rescheduleVaccineAlerts(people, preferences);
    }, RESCHEDULE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, available, people, preferences, permission]);

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

  const enable = async () => {
    setRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      updatePreferences({ prompted: true, ...(result.state === 'granted' ? { alerts: true, reminders: true } : {}) });
    } finally {
      setRequesting(false);
    }
  };

  const setPreference = useCallback(
    async (key: keyof AlertPreferences, value: boolean) => {
      updatePreferences({ [key]: value, prompted: true });
      if (!value || permission?.state === 'granted') return;
      setPermission(await requestNotificationPermission());
    },
    [permission, updatePreferences],
  );

  // Uma vez por conta, depois do login e com a caderneta na tela, enquanto o sistema ainda pode pedir
  const shouldPrompt =
    loaded && card !== null && !preferences.prompted && permission?.state === 'undetermined' && permission.canAskAgain;

  const value = useMemo(
    () => ({ preferences, permission, people, setPreference }),
    [preferences, permission, people, setPreference],
  );

  return (
    <VaccineAlertsContext.Provider value={value}>
      {children}
      <ConfirmDialog
        visible={shouldPrompt}
        icon="notifications-outline"
        title="Ative os lembretes de vacina"
        message={
          'Avisamos uma vez por dia, às 8h, quando uma dose sua ou dos seus dependentes estiver atrasada ou ' +
          'aguardando conferência, e lembramos 7 dias antes e no dia da próxima dose. Os avisos são calculados ' +
          'no seu aparelho, a partir da caderneta, e podem ser desativados no Perfil.'
        }
        confirmLabel="Ativar lembretes"
        loadingLabel="Aguardando permissão..."
        cancelLabel="Agora não"
        loading={requesting}
        onConfirm={() => void enable()}
        onCancel={() => updatePreferences({ prompted: true })}
      />
    </VaccineAlertsContext.Provider>
  );
}
