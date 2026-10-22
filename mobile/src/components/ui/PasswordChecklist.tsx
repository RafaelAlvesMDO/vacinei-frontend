import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { PASSWORD_REQUIREMENTS } from '@/utils/password';
import { Icon } from './Icon';

interface Props {
  password: string;
}

// 5 requisitos da RF001 → 4 segmentos da barra de força
function getStrength(metCount: number): { segments: number; label: string; color: string } {
  if (metCount === PASSWORD_REQUIREMENTS.length) return { segments: 4, label: 'Senha forte', color: colors.success };
  if (metCount >= 3) return { segments: 2, label: 'Força média', color: colors.warning };
  return { segments: 1, label: 'Senha fraca', color: colors.danger };
}

/**
 * Força da senha e checklist da regra RF001, atualizados a cada tecla
 */
export function PasswordChecklist({ password }: Props) {
  const results = PASSWORD_REQUIREMENTS.map((requirement) => ({
    label: requirement.label,
    met: requirement.test(password),
  }));
  const metCount = results.filter((result) => result.met).length;
  const strength = getStrength(metCount);

  return (
    <View style={styles.container}>
      {password.length > 0 && (
        <View
          accessible
          accessibilityLabel={`${strength.label}: ${metCount} de ${results.length} requisitos atendidos`}
          style={styles.strength}
        >
          <View style={styles.bar}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[styles.segment, index < strength.segments && { backgroundColor: strength.color }]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
        </View>
      )}

      {results.map(({ label, met }) => (
        <View
          key={label}
          style={styles.item}
          accessible
          accessibilityLabel={`${label}: ${met ? 'atendido' : 'pendente'}`}
        >
          <Icon
            name={met ? 'checkmark-circle' : 'remove-outline'}
            size={18}
            color={met ? colors.success : colors.muted}
          />
          <Text style={[typography.muted, met && styles.itemMet]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  strength: {
    gap: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  strengthLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemMet: {
    color: colors.success,
  },
});
