import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Badge, Icon } from '@/components/ui';
import { colors, fonts, radius, spacing, touchTarget, typography } from '@/theme';
import type { Ubs } from '@/types/ubs';
import { getHoursSummary } from '@/utils/openingHours';
import { formatDistance, formatStreet } from '@/utils/ubs';

interface Props {
  ubs: Ubs;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cartão de uma UBS na lista e no mapa: o cartão inteiro abre o detalhe. O status do dia ocupa a
 * linha toda, com um indicador colorido antes do texto (o texto é que explica, não só a cor)
 */
export function UbsListItem({ ubs, style }: Props) {
  const street = formatStreet(ubs);
  const hours = getHoursSummary(ubs.openingHours);
  const distance = ubs.distanceKm === undefined ? null : formatDistance(ubs.distanceKm);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[ubs.name, distance && `a ${distance}`, street, hours.text, 'Toque para ver detalhes']
        .filter(Boolean)
        .join('. ')}
      onPress={() =>
        router.push({
          pathname: '/cidadao/ubs/[ubsId]',
          params: { ubsId: ubs.id, ...(ubs.distanceKm !== undefined && { distanceKm: String(ubs.distanceKm) }) },
        })
      }
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{ubs.name}</Text>
          {distance && <Badge label={distance} />}
        </View>

        <View style={styles.row}>
          <Icon name="location-outline" size={16} color={colors.muted} />
          <Text style={[typography.muted, styles.rowText]}>{street}</Text>
        </View>

        <View style={styles.row}>
          {hours.isOpen === null ? (
            <Icon name="time-outline" size={16} color={colors.muted} />
          ) : (
            <View style={styles.dotBox}>
              <View style={[styles.dot, { backgroundColor: hours.isOpen ? colors.success : colors.muted }]} />
            </View>
          )}
          <Text style={[typography.muted, styles.rowText, hours.isOpen === true && styles.open]}>{hours.text}</Text>
        </View>
      </View>

      <Icon name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: touchTarget + spacing.lg * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardPressed: {
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  // Em telas estreitas ou com fonte ampliada, o badge desce para baixo do nome em vez de espremê-lo
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  name: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 140,
    minWidth: 0,
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.primaryDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  open: {
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  // Mesma caixa do ícone de 16 px, centrada na primeira linha do texto (lineHeight 20)
  dotBox: {
    width: 16,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
});
