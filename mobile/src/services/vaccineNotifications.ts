import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import type { CardVaccine } from '@/types/vaccination';
import { buildDailyDigest, formatDigestNotification, type AlertPreferences } from '@/utils/vaccineAlerts';

// Notificações locais (D24): funcionam no Expo Go e não dependem do servidor
const CHANNEL_ID = 'alertas-vacina';
// Uma notificação consolidada por dia (RF007 nota 8), às 8h
const NOTIFY_HOUR = 8;
// Dias agendados a partir de hoje, reagendados a cada carga da caderneta (o iOS aceita até 64)
const SCHEDULE_DAYS = 30;

const isSupported = Platform.OS !== 'web';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export interface PermissionInfo {
  state: PermissionState;
  // false: o sistema não mostra mais o pedido; só pelas configurações
  canAskAgain: boolean;
}

let configured = false;

/**
 * Mostra a notificação com o app aberto e cria o canal do Android (só uma vez)
 */
export async function configureNotifications(): Promise<void> {
  if (!isSupported || configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alertas de vacina',
      description: 'Doses atrasadas, aguardando conferência e lembretes da próxima dose',
      importance: AndroidImportance.DEFAULT,
    });
  }
}

function toPermissionInfo(response: Notifications.NotificationPermissionsStatus): PermissionInfo {
  const state: PermissionState = response.granted ? 'granted' : response.status === 'denied' ? 'denied' : 'undetermined';
  return { state, canAskAgain: response.canAskAgain };
}

export async function getNotificationPermission(): Promise<PermissionInfo> {
  if (!isSupported) return { state: 'denied', canAskAgain: false };
  return toPermissionInfo(await Notifications.getPermissionsAsync());
}

/**
 * Pedido do sistema. Só é chamado depois da explicação do app (Início ou Perfil)
 */
export async function requestNotificationPermission(): Promise<PermissionInfo> {
  if (!isSupported) return { state: 'denied', canAskAgain: false };
  await configureNotifications();
  return toPermissionInfo(await Notifications.requestPermissionsAsync());
}

// Os reagendamentos rodam em fila, para dois carregamentos seguidos não se misturarem
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  queue = queue.then(task).catch(() => undefined);
  return queue;
}

/**
 * Cancela tudo e agenda de novo os próximos dias (sem acumular). Cada dia tem no máximo uma notificação,
 * com os avisos calculados para aquele dia. Hoje só entra se ainda não passou das 8h, para não repetir
 * um aviso já entregue (nota 5)
 */
export function rescheduleVaccineAlerts(vaccines: CardVaccine[], preferences: AlertPreferences): Promise<void> {
  return enqueue(async () => {
    if (!isSupported) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!preferences.alerts && !preferences.reminders) return;
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    await configureNotifications();

    const now = new Date();
    for (let offset = 0; offset < SCHEDULE_DAYS; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, NOTIFY_HOUR, 0, 0);
      if (date.getTime() <= now.getTime()) continue;
      const notification = formatDigestNotification(buildDailyDigest(vaccines, date, preferences));
      if (!notification) continue;

      await Notifications.scheduleNotificationAsync({
        content: { title: notification.title, body: notification.body, data: { url: notification.url } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
      });
    }
  });
}

/**
 * Ao sair da conta (LGPD): nada da caderneta fica agendado no aparelho
 */
export function cancelVaccineAlerts(): Promise<void> {
  return enqueue(async () => {
    if (!isSupported) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  });
}

// Rota guardada na notificação (`data.url`)
export function getNotificationUrl(response: Notifications.NotificationResponse): string | null {
  const url: unknown = response.notification.request.content.data?.url;
  return typeof url === 'string' && url.startsWith('/cidadao/') ? url : null;
}
