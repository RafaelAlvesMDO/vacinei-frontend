import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Card, Icon, Screen, StateMessage, StepHeader, type IconName } from '@/components/ui';
import { getCurrentCoords } from '@/hooks/useUserLocation';
import { parseApiError } from '@/services/auth';
import { getUbs } from '@/services/ubs';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { Ubs } from '@/types/ubs';
import { getOpeningStatus, splitOpeningHours } from '@/utils/openingHours';
import { callUbs, distanceKm, formatDistance, formatFullAddress, openDirections } from '@/utils/ubs';

function getErrorMessage(error: unknown): string {
  const parsed = parseApiError(error, 'Não foi possível carregar os dados da UBS.');
  if (parsed.status === 404 || parsed.status === 400) return 'Esta UBS não foi encontrada.';
  return parsed.message;
}

// A lista já traz a distância calculada pela API; aberto pela caderneta, o app calcula com a posição atual
function parseDistance(value: string | undefined): number | null {
  if (value === undefined) return null;
  const km = Number(value);
  return Number.isFinite(km) ? km : null;
}

/**
 * Detalhe da UBS (RF008 notas 1 a 5): distância, endereço completo, horário (uma faixa por linha,
 * com o status do dia) e telefone. "Ligar" abre a discagem e "Como chegar", o app de mapas
 */
export default function UbsDetail() {
  const params = useLocalSearchParams<{ ubsId: string; distanceKm?: string }>();
  const { ubsId } = params;
  const [ubs, setUbs] = useState<Ubs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(() => parseDistance(params.distanceKm));
  const [actionError, setActionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getUbs(ubsId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setUbs(data);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [ubsId, attempt]);

  // Só com a permissão já concedida: o detalhe nunca pede a localização
  useEffect(() => {
    if (!ubs || distance !== null) return;
    let active = true;
    Location.getForegroundPermissionsAsync()
      .then(async (permission) => {
        if (!permission.granted) return;
        const position = await getCurrentCoords();
        if (active && 'coords' in position) setDistance(distanceKm(position.coords, ubs));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [ubs, distance]);

  const retry = () => {
    setIsLoading(true);
    setError(null);
    setAttempt((value) => value + 1);
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/cidadao/ubs'));

  const runAction = useCallback((action: () => Promise<void>, message: string) => {
    setActionError(null);
    action().catch(() => setActionError(message));
  }, []);

  return (
    <Screen
      header={<StepHeader title="Detalhe da UBS" onBack={goBack} />}
      footer={
        ubs && (
          <View style={styles.actions}>
            {ubs.phone && (
              <Button
                label="Ligar"
                icon="call-outline"
                variant="secondary"
                onPress={() => runAction(() => callUbs(ubs.phone ?? ''), 'Não foi possível abrir a discagem.')}
                accessibilityHint={`Liga para ${ubs.phone}`}
                style={styles.action}
              />
            )}
            <Button
              label="Como chegar"
              icon="navigate-outline"
              onPress={() => runAction(() => openDirections(ubs), 'Não foi possível abrir o app de mapas.')}
              accessibilityHint="Abre a rota no app de mapas do celular"
              style={styles.action}
            />
          </View>
        )
      }
    >
      {isLoading ? (
        <StateMessage variant="loading" title="Carregando a UBS..." />
      ) : !ubs ? (
        <StateMessage
          variant="error"
          title="Não foi possível abrir a UBS"
          message={error ?? undefined}
          action={{ label: 'Tentar novamente', icon: 'refresh', onPress: retry }}
        />
      ) : (
        <UbsContent ubs={ubs} distance={distance} actionError={actionError} />
      )}
    </Screen>
  );
}

function UbsContent({ ubs, distance, actionError }: { ubs: Ubs; distance: number | null; actionError: string | null }) {
  const status = getOpeningStatus(ubs.openingHours);
  const hours = splitOpeningHours(ubs.openingHours);
  const address = formatFullAddress(ubs);

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name="medkit-outline" size={26} color={colors.white} />
        </View>
        <View style={styles.heroText}>
          <Text style={[typography.subtitle, styles.heroTitle]} accessibilityRole="header">
            {ubs.name}
          </Text>
          {distance !== null && <Text style={styles.heroDistance}>{formatDistance(distance)} de você</Text>}
        </View>
      </View>

      {!ubs.isActive && (
        <Banner tone="warning" title="Unidade desativada" message="Esta UBS não está mais em funcionamento." />
      )}
      {actionError && <Banner tone="danger" message={actionError} />}

      <Card style={styles.info}>
        <InfoRow icon="location-outline" label="Endereço completo" accessibilityValue={address}>
          <Text style={typography.body}>{address}</Text>
        </InfoRow>

        <InfoRow
          icon="time-outline"
          label="Horário de funcionamento"
          accessibilityValue={[status?.label, ...hours].filter(Boolean).join('. ') || 'Não informado'}
        >
          {status && <Text style={[styles.status, status.isOpen && styles.statusOpen]}>{status.label}</Text>}
          {hours.length === 0 ? (
            <Text style={typography.body}>Não informado</Text>
          ) : (
            hours.map((line) => (
              <Text key={line} style={typography.body}>
                {line}
              </Text>
            ))
          )}
        </InfoRow>

        {ubs.phone && (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Telefone: ${ubs.phone}`}
            accessibilityHint="Abre a discagem"
            onPress={() => callUbs(ubs.phone ?? '').catch(() => undefined)}
            style={({ pressed }) => [styles.pressableRow, pressed && styles.pressed]}
          >
            <InfoRow icon="call-outline" label="Telefone">
              <Text style={[typography.body, styles.phone]}>{ubs.phone}</Text>
            </InfoRow>
          </Pressable>
        )}

        {distance !== null && (
          <InfoRow icon="navigate-outline" label="Distância estimada" accessibilityValue={formatDistance(distance)}>
            <Text style={typography.body}>{formatDistance(distance)} em linha reta</Text>
          </InfoRow>
        )}
      </Card>
    </>
  );
}

interface InfoRowProps {
  icon: IconName;
  label: string;
  children: ReactNode;
  // Sem ele, a linha não é agrupada (ex.: dentro de um botão, que já tem o próprio rótulo)
  accessibilityValue?: string;
}

function InfoRow({ icon, label, children, accessibilityValue }: InfoRowProps) {
  const grouped = accessibilityValue !== undefined;
  return (
    <View
      style={styles.row}
      accessible={grouped}
      accessibilityLabel={grouped ? `${label}: ${accessibilityValue}` : undefined}
    >
      <View style={styles.rowIcon}>
        <Icon name={icon} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
  },
  heroDistance: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
  info: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowLabel: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.warning,
  },
  statusOpen: {
    color: colors.primary,
  },
  phone: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    textDecorationLine: 'underline',
  },
  pressableRow: {
    borderRadius: radius.md,
    margin: -spacing.xs,
    padding: spacing.xs,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  action: {
    flex: 1,
  },
});
