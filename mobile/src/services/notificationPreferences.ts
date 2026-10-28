import * as SecureStore from 'expo-secure-store';
import { ALL_ALERTS, type AlertPreferences } from '@/utils/vaccineAlerts';

const PREFERENCES_KEY = 'vacinei.notificationPreferences';

export interface NotificationPreferences extends AlertPreferences {
  // A explicação da Início já foi respondida ("Ativar alertas" ou "Agora não")
  prompted: boolean;
}

interface StoredPreferences extends NotificationPreferences {
  userId: string;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = { ...ALL_ALERTS, prompted: false };

/**
 * Preferências de alertas e lembretes (RF007, D31) da conta. Outra conta no aparelho começa com o padrão
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    const json = await SecureStore.getItemAsync(PREFERENCES_KEY);
    if (!json) return DEFAULT_PREFERENCES;
    const stored = JSON.parse(json) as Partial<StoredPreferences>;
    if (stored.userId !== userId) return DEFAULT_PREFERENCES;
    return {
      alerts: stored.alerts !== false,
      reminders: stored.reminders !== false,
      prompted: stored.prompted === true,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function saveNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      PREFERENCES_KEY,
      JSON.stringify({ userId, ...preferences } satisfies StoredPreferences),
    );
  } catch {
    // Sem gravar, a escolha vale até o app fechar
  }
}
