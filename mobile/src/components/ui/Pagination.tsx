import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, fonts, spacing } from '@/theme';
import { formatNumber } from '@/utils/format';
import { Button } from './Button';
import type { IconName } from './Icon';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

// Largura (com a fonte em 100%) a partir da qual os rótulos dos quatro botões cabem na linha
const LABELS_MIN_WIDTH = 560;

/**
 * Primeira · anterior · "Página X de Y" · próxima · última, numa linha só (D22). Em telas estreitas os
 * botões mostram só o ícone, e o rótulo continua para o leitor de tela. A página atual é anunciada ao mudar
 */
export function Pagination({ page, totalPages, onChange, disabled = false }: Props) {
  const { width, fontScale } = useWindowDimensions();
  if (totalPages <= 1) return null;

  const showLabels = width - 2 * spacing.xl >= LABELS_MIN_WIDTH * fontScale;
  const atStart = disabled || page <= 1;
  const atEnd = disabled || page >= totalPages;
  const current = `Página ${formatNumber(page)} de ${formatNumber(totalPages)}`;

  const button = (label: string, icon: IconName, target: number, blocked: boolean, end = false) => (
    <Button
      label={label}
      icon={icon}
      iconPosition={end ? 'end' : 'start'}
      iconOnly={!showLabels}
      variant="secondary"
      disabled={blocked}
      onPress={() => onChange(target)}
      style={styles.button}
    />
  );

  return (
    <View style={styles.container}>
      {button('Primeira', 'chevron-double-left', 1, atStart)}
      {button('Anterior', 'chevron-back', page - 1, atStart)}
      <Text style={styles.label} accessibilityLabel={current} accessibilityLiveRegion="polite">
        {/* Sem os rótulos, a forma curta cabe ao lado dos quatro botões em 320px */}
        {showLabels ? current : `${formatNumber(page)} de ${formatNumber(totalPages)}`}
      </Text>
      {button('Próxima', 'chevron-forward', page + 1, atEnd, true)}
      {button('Última', 'chevron-double-right', totalPages, atEnd, true)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  button: {
    paddingHorizontal: spacing.sm,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDark,
    textAlign: 'center',
  },
});
