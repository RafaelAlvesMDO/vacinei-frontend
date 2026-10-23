import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import type { Coords } from '@/types/ubs';

// checking: ainda consultando; denied: pode pedir de novo; blocked: só pelas configurações do aparelho
export type LocationPermission = 'checking' | 'undetermined' | 'granted' | 'denied' | 'blocked';

export type PositionResult = { coords: Coords } | { error: 'services-off' | 'unavailable' };

const POSITION_TIMEOUT_MS = 10_000;
// Posição recente aceita quando o GPS demora a responder
const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

function toPermission(response: Location.LocationPermissionResponse): LocationPermission {
  if (response.granted) return 'granted';
  if (response.status === Location.PermissionStatus.UNDETERMINED) return 'undetermined';
  return response.canAskAgain ? 'denied' : 'blocked';
}

/**
 * Permissão de localização em primeiro plano (RNF09). Só é pedida pelo `request`, depois da explicação
 * na tela (RF008 nota 6). É conferida de novo quando o app volta ao primeiro plano (ex.: das configurações)
 */
export function useUserLocation() {
  const [permission, setPermission] = useState<LocationPermission>('checking');

  const check = useCallback(() => {
    Location.getForegroundPermissionsAsync()
      .then((response) => setPermission(toPermission(response)))
      .catch(() => setPermission('denied'));
  }, []);

  useEffect(() => {
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, [check]);

  const request = useCallback(async (): Promise<LocationPermission> => {
    try {
      const next = toPermission(await Location.requestForegroundPermissionsAsync());
      setPermission(next);
      return next;
    } catch {
      setPermission('denied');
      return 'denied';
    }
  }, []);

  return { permission, request };
}

function timeout(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

/**
 * Posição atual do aparelho, buscada a cada consulta (RF008 nota 2). LGPD: fica só na memória
 */
export async function getCurrentCoords(): Promise<PositionResult> {
  try {
    if (!(await Location.hasServicesEnabledAsync())) return { error: 'services-off' };
    const position =
      (await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        timeout(POSITION_TIMEOUT_MS),
      ])) ?? (await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }));
    if (!position) return { error: 'unavailable' };
    return { coords: { latitude: position.coords.latitude, longitude: position.coords.longitude } };
  } catch {
    return { error: 'unavailable' };
  }
}

/**
 * Localização do aparelho desligada: no Android, o próprio sistema oferece ligar; no iOS, abre as configurações
 */
export async function enableLocationServices(): Promise<void> {
  if (Platform.OS === 'android') {
    await Location.enableNetworkProviderAsync().catch(() => undefined);
    return;
  }
  await Linking.openSettings();
}
