import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';
import { Icon } from './Icon';

interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function Checkbox({ label, checked, onChange, error }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      accessibilityHint={error}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.boxChecked, !!error && styles.boxError]}>
        {checked && <Icon name="checkmark" size={18} color={colors.white} />}
      </View>
      <Text style={[typography.body, styles.label]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  box: {
    width: 24,
    height: 24,
    marginTop: 2,
    borderRadius: radius.sm - 2,
    borderWidth: 2,
    borderColor: colors.input,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  boxError: {
    borderColor: colors.danger,
  },
  label: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
