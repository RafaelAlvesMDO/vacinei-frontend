import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { colors } from '@/theme';
import type { Coords, Ubs } from '@/types/ubs';
import { MAP_HTML } from './mapHtml';

interface Props {
  items: Ubs[];
  selectedId: string | null;
  userCoords: Coords | null;
  onSelect: (id: string) => void;
  // Leaflet ou tiles não carregaram: a tela mostra o aviso e a lista (RNF15)
  onUnavailable: () => void;
}

// Sem nenhum tile nesse tempo, o mapa é dado como indisponível
const LOAD_TIMEOUT_MS = 15_000;

type MapMessage = { type: 'init' | 'tiles-ok' | 'unavailable' } | { type: 'select'; id: string };

function parseMessage(data: string): MapMessage | null {
  try {
    const message: unknown = JSON.parse(data);
    if (typeof message !== 'object' || message === null || !('type' in message)) return null;
    const { type } = message;
    if (type === 'select') {
      return 'id' in message && typeof message.id === 'string' ? { type, id: message.id } : null;
    }
    return type === 'init' || type === 'tiles-ok' || type === 'unavailable' ? { type } : null;
  } catch {
    return null;
  }
}

// A página só navega para o próprio HTML; links (ex.: atribuição do OSM) abrem no navegador
function handleNavigation(request: ShouldStartLoadRequest): boolean {
  const { url } = request;
  if (url === 'about:blank' || url.startsWith('data:')) return true;
  if (/^https?:/.test(url)) Linking.openURL(url).catch(() => undefined);
  return false;
}

/**
 * Mapa das UBS com tiles do OpenStreetMap (Leaflet numa WebView, compatível com o Expo Go).
 * O `User-Agent` identifica o app, como pede a política de uso dos tiles do OSM
 */
export function UbsMap({ items, selectedId, userCoords, onSelect, onUnavailable }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const tilesLoadedRef = useRef(false);
  const notifyUnavailable = useEffectEvent(onUnavailable);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!tilesLoadedRef.current) notifyUnavailable();
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const payload = {
      points: items.map(({ id, name, latitude, longitude }) => ({ id, name, latitude, longitude })),
      selectedId,
      user: userCoords,
    };
    webViewRef.current?.injectJavaScript(`window.vacinei && window.vacinei.update(${JSON.stringify(payload)}); true;`);
  }, [isReady, items, selectedId, userCoords]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = parseMessage(event.nativeEvent.data);
    if (!message) return;
    if (message.type === 'select') onSelect(message.id);
    else if (message.type === 'init') setIsReady(true);
    else if (message.type === 'tiles-ok') tilesLoadedRef.current = true;
    else onUnavailable();
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ html: MAP_HTML }}
      originWhitelist={['*']}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={handleNavigation}
      onError={() => onUnavailable()}
      applicationNameForUserAgent="Vacinei/1.0 (TCC CESMAC)"
      setSupportMultipleWindows={false}
      javaScriptEnabled
      style={styles.map}
      accessibilityLabel="Mapa das UBS. As mesmas unidades estão na aba Lista."
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
