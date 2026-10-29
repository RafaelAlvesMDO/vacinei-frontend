import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';

interface Props {
  title: string;
  description: string;
  icon: IconName;
  // Destaque verde cheio (ação principal) ou cartão branco
  highlighted?: boolean;
  onPress: () => void;
}

/**
 * Atalho do painel ("Registrar vacinação", "Busca ativa")
 */
export function ActionCard({ title, description, icon, highlighted = false, onPress }: Props) {
  const textColor = highlighted ? colors.white : colors.primaryDark;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        highlighted && styles.highlighted,
        pressed && (highlighted ? styles.highlightedPressed : styles.pressed),
      ]}
    >
      <View style={[styles.icon, highlighted && styles.iconHighlighted]}>
        <Icon name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        <Text style={[typography.muted, highlighted && styles.descriptionHighlighted]}>{description}</Text>
      </View>
      <Icon name="arrow-forward" color={highlighted ? colors.white : colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  highlighted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  highlightedPressed: {
    backgroundColor: colors.primaryDark,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHighlighted: {
    backgroundColor: colors.white,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
  },
  descriptionHighlighted: {
    color: colors.white,
  },
});
