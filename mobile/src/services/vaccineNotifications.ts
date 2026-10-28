import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { CardVaccine } from '@/types/vaccination';
import { buildDailyDigest, formatDigestNotification, type AlertPreferences } from '@/utils/vaccineAlerts';

// Notificações locais (D24): funcionam no Expo Go e não dependem do servidor
const CHANNEL_ID = 'alertas-vacina';
// Uma notificação consolidada por dia (RF007 nota 8), às 8h
const NOTIFY_HOUR = 8;
// Dias agendados a partir de hoje, reagendados a cada carga da caderneta (o iOS aceita até 64)
const SCHEDULE_DAYS = 30;
// Notificação de teste do Perfil (só em desenvolvimento), preservada pelo reagendamento
const TEST_NOTIFICATION_ID = 'teste-alerta-diario';
const TEST_DELAY_SECONDS = 5;

const isSupported = Platform.OS !== 'web';

/**
 * Rodando no Expo Go (e não no build instalável). No Expo Go do Android (SDK 58), criar o canal falha com
 * NullPointerException e tocar na notificação fecha o app, sem erro no JavaScript: lá o app não cria o
 * canal, agenda sem `channelId` e não trata o toque (que só abre o app)
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export interface PermissionInfo {
  state: PermissionState;
  // false: o sistema não mostra mais o pedido; só pelas configurações
  canAskAgain: boolean;
}

const UNSUPPORTED: PermissionInfo = { state: 'denied', canAskAgain: false };

// Configuração feita uma vez (a mesma promessa é reaproveitada) e o canal criado, se deu certo
let configuration: Promise<void> | null = null;
let channelId: string | null = null;

async function createAndroidChannel(): Promise<void> {
  try {
    // Só id, nome e importância: nenhuma opção nula ou indefinida chega ao módulo nativo
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alertas de vacina',
      importance: AndroidImportance.DEFAULT,
    });
    channelId = CHANNEL_ID;
  } catch (error) {
    // Sem o canal próprio, o Android usa o canal padrão do expo-notifications
    console.warn('Não foi possível criar o canal de notificações; usando o canal padrão.', error);
  }
}

/**
 * Mostra a notificação com o app aberto e cria o canal do Android (só uma vez). Nunca rejeita
 */
export function configureNotifications(): Promise<void> {
  if (!isSupported) return Promise.resolve();
  configuration ??= (async () => {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    } catch (error) {
      console.warn('Não foi possível configurar a exibição das notificações.', error);
    }
    if (Platform.OS === 'android' && !isExpoGo) await createAndroidChannel();
  })();
  return configuration;
}

// Canal do aviso, só quando o canal próprio foi criado
function channelOption(): { channelId?: string } {
  return channelId ? { channelId } : {};
}

function toPermissionInfo(response: Notifications.NotificationPermissionsStatus): PermissionInfo {
  const state: PermissionState = response.granted ? 'granted' : response.status === 'denied' ? 'denied' : 'undetermined';
  return { state, canAskAgain: response.canAskAgain };
}

export async function getNotificationPermission(): Promise<PermissionInfo> {
  if (!isSupported) return UNSUPPORTED;
  try {
    return toPermissionInfo(await Notifications.getPermissionsAsync());
  } catch (error) {
    console.warn('Não foi possível consultar a permissão de notificações.', error);
    return UNSUPPORTED;
  }
}

/**
 * Pedido do sistema. Só é chamado depois da explicação do app (Início ou Perfil). Nunca rejeita
 */
export async function requestNotificationPermission(): Promise<PermissionInfo> {
  if (!isSupported) return UNSUPPORTED;
  await configureNotifications();
  try {
    return toPermissionInfo(await Notifications.requestPermissionsAsync());
  } catch (error) {
    console.warn('Não foi possível pedir a permissão de notificações.', error);
    return getNotificationPermission();
  }
}

// Os reagendamentos rodam em fila, para dois carregamentos seguidos não se misturarem
let queue: Promise<void> = Promise.resolve();

// A fila nunca rejeita: uma falha vira aviso e não impede as próximas tarefas
function enqueue(task: () => Promise<void>): Promise<void> {
  queue = queue.then(task).catch((error: unknown) => {
    console.warn('Não foi possível atualizar as notificações de vacina.', error);
  });
  return queue;
}

/**
 * Cancela os agendamentos e agenda de novo os próximos dias (sem acumular). Cada dia tem no máximo uma notificação,
 * com os avisos calculados para aquele dia. Hoje só entra se ainda não passou das 8h, para não repetir
 * um aviso já entregue (nota 5)
 */
export function rescheduleVaccineAlerts(vaccines: CardVaccine[], preferences: AlertPreferences): Promise<void> {
  return enqueue(async () => {
    if (!isSupported) return;
    // Mantém a notificação de teste, que pode estar a segundos de disparar
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((request) => request.identifier !== TEST_NOTIFICATION_ID)
        .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
    );
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

      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: notification.title, body: notification.body, data: { url: notification.url } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, ...channelOption() },
        });
      } catch (error) {
        // Um dia que falha não impede o agendamento dos outros
        console.warn(`Não foi possível agendar a notificação de ${date.toLocaleDateString('pt-BR')}.`, error);
      }
    }
  });
}

export type TestNotificationResult = 'sent' | 'empty' | 'denied' | 'error';

/**
 * Só em desenvolvimento: dispara em 5 s a notificação consolidada de hoje, com a caderneta real e todos
 * os avisos (sem depender das 8h nem das preferências), para conferir o texto e o toque
 */
export async function sendTestVaccineAlert(vaccines: CardVaccine[]): Promise<TestNotificationResult> {
  if (!isSupported) return 'denied';
  if ((await getNotificationPermission()).state !== 'granted') return 'denied';
  const notification = formatDigestNotification(buildDailyDigest(vaccines, new Date()));
  if (!notification) return 'empty';
  await configureNotifications();

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: TEST_NOTIFICATION_ID,
      content: { title: notification.title, body: notification.body, data: { url: notification.url } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: TEST_DELAY_SECONDS,
        ...channelOption(),
      },
    });
    return 'sent';
  } catch (error) {
    console.warn('Não foi possível agendar a notificação de teste.', error);
    return 'error';
  }
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
