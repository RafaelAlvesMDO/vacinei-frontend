import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Badge, Icon } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { Ubs } from '@/types/ubs';
import { getHoursSummary } from '@/utils/openingHours';
import { formatDistance, formatStreet } from '@/utils/ubs';

interface Props {
  ubs: Ubs;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cartão de uma UBS na lista e no mapa: abre o detalhe ao tocar
 */
export function UbsListItem({ ubs, style }: Props) {
  const street = formatStreet(ubs);
  const hours = getHoursSummary(ubs.openingHours);
  const distance = ubs.distanceKm === undefined ? null : formatDistance(ubs.distanceKm);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[ubs.name, distance && `a ${distance}`, street, hours.text].filter(Boolean).join('. ')}
      accessibilityHint="Abre o detalhe da UBS"
      onPress={() =>
        router.push({
          pathname: '/cidadao/ubs/[ubsId]',
          params: { ubsId: ubs.id, ...(ubs.distanceKm !== undefined && { distanceKm: String(ubs.distanceKm) }) },
        })
      }
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{ubs.name}</Text>
        {distance && <Badge label={distance} />}
      </View>

      <View style={styles.row}>
        <Icon name="location-outline" size={16} color={colors.muted} />
        <Text style={[typography.muted, styles.rowText]}>{street}</Text>
      </View>

      <View style={styles.row}>
        <Icon name="time-outline" size={16} color={colors.muted} />
        <Text style={[typography.muted, styles.rowText, hours.isOpen === true && styles.open]}>{hours.text}</Text>
        <Text style={styles.link}>Ver detalhes</Text>
      </View>
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
    gap: spacing.sm,
  },
  cardPressed: {
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  name: {
    flex: 1,
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
  link: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
});
