import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';
import type { CardVaccine } from '@/types/vaccination';
import {
  buildDailyDigest,
  formatDigestNotification,
  type AlertPreferences,
  type DigestNotification,
  type DigestTarget,
} from '@/utils/vaccineAlerts';

type Notifications = typeof NotificationsModule;

// Notificações locais (D24, D36), só no build instalável (APK)
const CHANNEL_ID = 'alertas-vacina';
// Uma notificação consolidada por pessoa por dia (RF007 nota 8, D36), às 8h
const NOTIFY_HOUR = 8;
// Dias agendados a partir de hoje, reagendados a cada carga da caderneta
const SCHEDULE_DAYS = 30;
// Teto de agendamentos (o iOS guarda até 64): com vários dependentes, os dias mais próximos têm prioridade
const MAX_SCHEDULED = 60;
// Notificação de teste do Perfil, preservada pelo reagendamento
const TEST_NOTIFICATION_ID = 'teste-alerta-diario';
const TEST_DELAY_SECONDS = 5;

/**
 * Rodando no Expo Go (e não no build instalável). No Expo Go do Android (SDK 58), criar o canal falhava com
 * NullPointerException e tocar na notificação fechava o app (D24). Por isso, lá o módulo nativo nem é
 * carregado e as notificações do sistema ficam desligadas (D36); os avisos continuam dentro do app
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Notificações do sistema disponíveis neste ambiente
export const notificationsAvailable = Platform.OS !== 'web' && !isExpoGo;

// Botão "Enviar notificação de teste" no Perfil: em desenvolvimento e no APK `preview` (eas.json)
export const showNotificationTest = __DEV__ || process.env.EXPO_PUBLIC_NOTIFICATION_TEST === 'true';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export interface PermissionInfo {
  state: PermissionState;
  // false: o sistema não mostra mais o pedido; só pelas configurações
  canAskAgain: boolean;
}

const UNAVAILABLE: PermissionInfo = { state: 'unavailable', canAskAgain: false };

// Módulo carregado só uma vez e só fora do Expo Go
let modulePromise: Promise<Notifications | null> | null = null;

function loadModule(): Promise<Notifications | null> {
  if (!notificationsAvailable) return Promise.resolve(null);
  modulePromise ??= import('expo-notifications').catch((error: unknown) => {
    console.warn('Não foi possível carregar o módulo de notificações.', error);
    return null;
  });
  return modulePromise;
}

// Configuração feita uma vez e o canal criado, se deu certo
let configuration: Promise<Notifications | null> | null = null;
let channelId: string | null = null;

/**
 * Mostra a notificação com o app aberto e cria o canal "Alertas de vacina" do Android (só uma vez).
 * Devolve o módulo, ou null fora do build instalável. Nunca rejeita
 */
function configure(): Promise<Notifications | null> {
  configuration ??= (async () => {
    const Notifications = await loadModule();
    if (!Notifications) return null;
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
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Alertas de vacina',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
        channelId = CHANNEL_ID;
      } catch (error) {
        // Sem o canal próprio, o Android usa o canal padrão do expo-notifications
        console.warn('Não foi possível criar o canal de notificações; usando o canal padrão.', error);
      }
    }
    return Notifications;
  })();
  return configuration;
}

// Canal do aviso, só quando o canal próprio foi criado
function channelOption(): { channelId?: string } {
  return channelId ? { channelId } : {};
}

function toPermissionInfo(response: NotificationsModule.NotificationPermissionsStatus): PermissionInfo {
  const state: PermissionState = response.granted ? 'granted' : response.status === 'denied' ? 'denied' : 'undetermined';
  return { state, canAskAgain: response.canAskAgain };
}

export async function getNotificationPermission(): Promise<PermissionInfo> {
  const Notifications = await loadModule();
  if (!Notifications) return UNAVAILABLE;
  try {
    return toPermissionInfo(await Notifications.getPermissionsAsync());
  } catch (error) {
    console.warn('Não foi possível consultar a permissão de notificações.', error);
    return UNAVAILABLE;
  }
}

/**
 * Pedido do sistema. Só é chamado depois da explicação do app (modal da Início ou Perfil). Nunca rejeita
 */
export async function requestNotificationPermission(): Promise<PermissionInfo> {
  const Notifications = await configure();
  if (!Notifications) return UNAVAILABLE;
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
 * Caderneta de uma pessoa para o agendamento: o titular ou um dependente (D33)
 */
export interface NotificationPerson {
  // Identifica a pessoa no id da notificação ("titular" ou o id do dependente)
  key: string;
  target: DigestTarget;
  vaccines: CardVaccine[];
}

function dateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toContent(notification: DigestNotification): NotificationsModule.NotificationContentInput {
  return { title: notification.title, body: notification.body, data: { url: notification.url } };
}

/**
 * Cancela os agendamentos e agenda de novo os próximos dias (sem acumular): no máximo uma notificação por
 * pessoa por dia, com os avisos calculados para aquele dia. Hoje só entra se ainda não passou das 8h, para
 * não repetir um aviso já entregue (nota 5). Os dias mais próximos vêm primeiro, até o teto de agendamentos
 */
export function rescheduleVaccineAlerts(people: NotificationPerson[], preferences: AlertPreferences): Promise<void> {
  return enqueue(async () => {
    const Notifications = await configure();
    if (!Notifications) return;
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

    const now = new Date();
    let count = 0;
    for (let offset = 0; offset < SCHEDULE_DAYS && count < MAX_SCHEDULED; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, NOTIFY_HOUR, 0, 0);
      if (date.getTime() <= now.getTime()) continue;

      for (const person of people) {
        if (count >= MAX_SCHEDULED) break;
        const notification = formatDigestNotification(
          buildDailyDigest(person.vaccines, date, preferences),
          person.target,
        );
        if (!notification) continue;

        try {
          await Notifications.scheduleNotificationAsync({
            identifier: `vacina-${person.key}-${dateKey(date)}`,
            content: toContent(notification),
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, ...channelOption() },
          });
          count += 1;
        } catch (error) {
          // Um dia que falha não impede o agendamento dos outros
          console.warn(`Não foi possível agendar a notificação de ${date.toLocaleDateString('pt-BR')}.`, error);
        }
      }
    }
  });
}

export type TestNotificationResult = 'sent' | 'empty' | 'denied' | 'error';

/**
 * Teste do Perfil (desenvolvimento e APK `preview`): dispara em 5 s a notificação consolidada de hoje da
 * primeira pessoa com avisos (o titular primeiro, depois os dependentes), com a caderneta real e todos os
 * avisos, sem depender das 8h nem das preferências. Serve para conferir o texto e o toque
 */
export async function sendTestVaccineAlert(people: NotificationPerson[]): Promise<TestNotificationResult> {
  if ((await getNotificationPermission()).state !== 'granted') return 'denied';
  const now = new Date();
  const notification = people
    .map((person) => formatDigestNotification(buildDailyDigest(person.vaccines, now), person.target))
    .find((item): item is DigestNotification => item !== null);
  if (!notification) return 'empty';

  const Notifications = await configure();
  if (!Notifications) return 'denied';
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: TEST_NOTIFICATION_ID,
      content: toContent(notification),
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
 * Ao sair da conta (LGPD): nada da caderneta fica agendado nem na barra do aparelho
 */
export function cancelVaccineAlerts(): Promise<void> {
  return enqueue(async () => {
    const Notifications = await loadModule();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  });
}

// Rota guardada na notificação (`data.url`), só da ala Cidadão
function getResponseUrl(response: NotificationsModule.NotificationResponse): string | null {
  const url: unknown = response.notification.request.content.data?.url;
  return typeof url === 'string' && url.startsWith('/cidadao/') ? url : null;
}

/**
 * Toque na notificação (nota 4): avisa a rota de cada toque, inclusive o que abriu o app fechado (a última
 * resposta). Cada toque é entregue uma vez. Devolve a função que encerra a escuta
 */
export function subscribeToNotificationTaps(onTap: (url: string) => void): () => void {
  let active = true;
  let remove: (() => void) | null = null;
  const handled = new Set<string>();

  const handle = (Notifications: Notifications, response: NotificationsModule.NotificationResponse | null) => {
    if (!active || !response) return;
    const id = `${response.notification.request.identifier}:${response.notification.date}`;
    if (handled.has(id)) return;
    handled.add(id);
    // Sem limpar, a mesma resposta voltaria na próxima abertura do app
    Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    const url = getResponseUrl(response);
    if (url) onTap(url);
  };

  void loadModule().then((Notifications) => {
    if (!Notifications || !active) return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
      handle(Notifications, response),
    );
    remove = () => subscription.remove();
    Notifications.getLastNotificationResponseAsync()
      .then((response) => handle(Notifications, response))
      .catch(() => undefined);
  });

  return () => {
    active = false;
    remove?.();
  };
}
