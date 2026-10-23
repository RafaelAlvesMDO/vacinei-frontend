import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationPermissionPrompt } from '@/components/ubs/LocationPermissionPrompt';
import { MapUnavailable } from '@/components/ubs/MapUnavailable';
import { UbsListItem } from '@/components/ubs/UbsListItem';
import { UbsMap } from '@/components/ubs/UbsMap';
import {
  Badge,
  Banner,
  Button,
  Icon,
  SegmentedControl,
  StateMessage,
  TextField,
  type IconName,
  type SegmentOption,
} from '@/components/ui';
import {
  enableLocationServices,
  getCurrentCoords,
  useUserLocation,
  type LocationPermission,
} from '@/hooks/useUserLocation';
import { parseApiError } from '@/services/auth';
import { listNearbyUbs, listUbs, NEARBY_RADIUS_KM } from '@/services/ubs';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';
import type { Coords, Ubs } from '@/types/ubs';
import { matchesUbsSearch } from '@/utils/ubs';

type DisplayMode = 'lista' | 'mapa';

// Por que a lista não está ordenada pela distância, mesmo com a permissão concedida
type LocationIssue = 'services-off' | 'unavailable' | 'out-of-range';

interface UbsData {
  items: Ubs[];
  // Ordenada pela API a partir da posição do aparelho
  byDistance: boolean;
  userCoords: Coords | null;
}

const VIEW_OPTIONS: SegmentOption<DisplayMode>[] = [
  { value: 'lista', label: 'Lista' },
  { value: 'mapa', label: 'Mapa' },
];

function countLabel(count: number, byDistance: boolean): string {
  const units = count === 1 ? '1 unidade' : `${count} unidades`;
  return byDistance ? `${units} perto de você` : units;
}

/**
 * Localização de UBS (RF008): com a permissão, as unidades vêm ordenadas pela distância, recalculada
 * a cada consulta (nota 2); sem ela, a lista completa com busca por bairro ou endereço (nota 7).
 * A explicação aparece antes do pedido do sistema (RNF09, nota 6). Mapa com tiles do OSM (RNF15)
 */
export default function UbsScreen() {
  const { permission, request } = useUserLocation();
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [view, setView] = useState<DisplayMode>('lista');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<UbsData | null>(null);
  const [locationIssue, setLocationIssue] = useState<LocationIssue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const showPrompt = permission === 'undetermined' && !promptDismissed;

  // Nova consulta: posição atual (se houver permissão) e lista da API. A anterior é cancelada
  const load = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (permission === 'checking') return;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (options?.refreshing) setIsRefreshing(true);

      try {
        let coords: Coords | null = null;
        let issue: LocationIssue | null = null;
        if (permission === 'granted') {
          const position = await getCurrentCoords();
          if ('coords' in position) coords = position.coords;
          else issue = position.error;
        }

        let items: Ubs[] = [];
        let byDistance = false;
        if (coords) {
          items = await listNearbyUbs(coords, controller.signal);
          byDistance = items.length > 0;
          if (!byDistance) issue = 'out-of-range';
        }
        if (!byDistance) items = await listUbs(controller.signal);

        if (controller.signal.aborted) return;
        setData({ items, byDistance, userCoords: coords });
        setLocationIssue(issue);
        setError(null);
      } catch (reason: unknown) {
        if (!controller.signal.aborted) setError(parseApiError(reason, 'Não foi possível carregar as UBS.').message);
      } finally {
        if (!controller.signal.aborted) setIsRefreshing(false);
      }
    },
    [permission],
  );

  // A cada vez que a aba ganha foco (e quando a permissão muda), a distância é recalculada
  useFocusEffect(
    useCallback(() => {
      if (!showPrompt) load();
    }, [load, showPrompt]),
  );

  useEffect(() => () => controllerRef.current?.abort(), []);

  const requestPermission = async () => {
    setIsRequesting(true);
    await request();
    setIsRequesting(false);
    setPromptDismissed(true);
  };

  // "Ativar" do aviso: liga a localização do aparelho, pede a permissão ou abre as configurações
  const activateLocation = async () => {
    if (permission === 'granted') {
      if (locationIssue === 'services-off') await enableLocationServices();
      load({ refreshing: true });
      return;
    }
    if (permission === 'blocked') {
      await Linking.openSettings();
      return;
    }
    await requestPermission();
  };

  if (showPrompt) {
    return (
      <LocationPermissionPrompt
        onAllow={requestPermission}
        onSkip={() => setPromptDismissed(true)}
        isRequesting={isRequesting}
      />
    );
  }

  const visible = data ? data.items.filter((ubs) => matchesUbsSearch(ubs, search)) : [];
  const selected = visible.find((ubs) => ubs.id === selectedId) ?? visible[0] ?? null;
  const showMap = view === 'mapa' && !mapUnavailable && data !== null && visible.length > 0;

  const retryMap = () => {
    setMapUnavailable(false);
    setMapKey((key) => key + 1);
  };

  const notices = (
    <>
      <LocationNotice
        permission={permission}
        issue={locationIssue}
        onActivate={activateLocation}
        isRequesting={isRequesting}
      />
      {data && error && <Banner tone="danger" title="Não foi possível atualizar" message={error} />}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Text style={[typography.title, styles.title]} accessibilityRole="header">
            {data?.byDistance ? 'UBS próximas' : 'UBS'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={permission === 'granted' ? 'Atualizar minha localização' : 'Usar minha localização'}
            onPress={() => (permission === 'granted' ? load({ refreshing: true }) : activateLocation())}
            style={({ pressed }) => [styles.locate, pressed && styles.locatePressed]}
          >
            <Icon name="locate-outline" size={24} color={colors.primaryDark} />
          </Pressable>
        </View>

        <SegmentedControl
          accessibilityLabel="Forma de exibição"
          options={VIEW_OPTIONS}
          selected={view}
          onChange={setView}
        />

        <TextField
          label="Buscar UBS"
          placeholder="Buscar bairro ou endereço"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          trailing={
            search ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                onPress={() => setSearch('')}
                style={styles.clear}
              >
                <Icon name="close-circle" color={colors.muted} />
              </Pressable>
            ) : (
              <Icon name="search" color={colors.muted} />
            )
          }
        />
      </View>

      {showMap ? (
        <View style={styles.mapArea}>
          <View style={styles.mapNotices}>{notices}</View>
          <View style={styles.mapBox}>
            <UbsMap
              key={mapKey}
              items={visible}
              selectedId={selected?.id ?? null}
              userCoords={data?.byDistance ? data.userCoords : null}
              onSelect={setSelectedId}
              onUnavailable={() => setMapUnavailable(true)}
            />
            {selected && <UbsListItem ubs={selected} style={styles.mapCard} />}
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => load({ refreshing: true })}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.inner}>
            {!data ? (
              error ? (
                <StateMessage
                  variant="error"
                  title="Não foi possível carregar as UBS"
                  message={error}
                  action={{ label: 'Tentar novamente', icon: 'refresh', onPress: () => load() }}
                />
              ) : (
                <StateMessage variant="loading" title="Carregando as UBS..." />
              )
            ) : (
              <>
                {notices}
                {view === 'mapa' && mapUnavailable && <MapUnavailable onRetry={retryMap} />}

                <View style={styles.countRow}>
                  <Text style={[typography.muted, styles.count]} accessibilityLiveRegion="polite">
                    {view === 'mapa' && mapUnavailable ? 'UBS em lista' : countLabel(visible.length, data.byDistance)}
                  </Text>
                  {data.byDistance && <Badge label="Por distância" icon="navigate-outline" />}
                </View>

                {visible.length === 0 ? (
                  <StateMessage
                    variant="empty"
                    icon="search"
                    title="Nenhuma UBS encontrada"
                    message={search ? 'Tente outro nome, bairro ou endereço.' : 'Não há unidades ativas no momento.'}
                  />
                ) : (
                  <View style={styles.list}>
                    {visible.map((ubs) => (
                      <UbsListItem key={ubs.id} ubs={ubs} />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface NoticeProps {
  permission: LocationPermission;
  issue: LocationIssue | null;
  onActivate: () => void;
  isRequesting: boolean;
}

/**
 * Aviso de lista sem ordenação por distância, com a ação para conceder a permissão depois
 */
function LocationNotice({ permission, issue, onActivate, isRequesting }: NoticeProps) {
  if (permission === 'checking') return null;

  let message: string;
  let action: string | null = 'Ativar';
  let icon: IconName = 'map-marker-off-outline';
  if (permission !== 'granted') {
    message = 'Localização desativada. A lista não está ordenada por distância.';
    if (permission === 'blocked') action = 'Abrir configurações';
  } else if (issue === 'services-off') {
    message = 'A localização do aparelho está desligada. A lista não está ordenada por distância.';
  } else if (issue === 'unavailable') {
    message = 'Não foi possível obter a sua localização. A lista não está ordenada por distância.';
    action = 'Tentar novamente';
  } else if (issue === 'out-of-range') {
    message = `Nenhuma UBS em até ${NEARBY_RADIUS_KM} km de você. A lista mostra todas as unidades, sem ordenação por distância.`;
    action = null;
    icon = 'information-circle-outline';
  } else {
    return null;
  }

  return (
    <Banner tone={issue === 'out-of-range' ? 'info' : 'warning'} icon={icon} message={message}>
      {action && (
        <Button
          label={action}
          variant="link"
          onPress={onActivate}
          loading={isRequesting}
          style={styles.noticeAction}
        />
      )}
    </Banner>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  top: {
    width: '100%',
    maxWidth: 560 + spacing.xl * 2,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  locate: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locatePressed: {
    backgroundColor: colors.surface,
  },
  clear: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.md,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  inner: {
    flexGrow: 1,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  count: {
    flexShrink: 1,
  },
  list: {
    gap: spacing.md,
  },
  noticeAction: {
    alignSelf: 'flex-start',
    marginLeft: -spacing.sm,
  },
  mapArea: {
    flex: 1,
  },
  mapNotices: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  mapBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mapCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
