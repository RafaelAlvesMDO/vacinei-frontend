import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { Button } from './Button';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  // Etapa atual e total: mostra "Etapa X de N" e a barra de progresso
  step?: { current: number; total: number };
}

/**
 * Cabeçalho branco dos fluxos em etapas (cadastro e recuperação de senha)
 */
export function StepHeader({ title, subtitle, onBack, backLabel = 'Voltar', step }: Props) {
  return (
    <>
      <View style={styles.container}>
        {onBack && (
          <Button label={backLabel} variant="link" icon="arrow-back" onPress={onBack} style={styles.back} />
        )}
        {step && (
          <Text style={styles.eyebrow}>
            Etapa {step.current} de {step.total}
          </Text>
        )}
        <Text style={typography.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle && <Text style={typography.muted}>{subtitle}</Text>}
      </View>

      {/* Barra de progresso abaixo do cabeçalho, sobre o fundo da tela (como nos designs) */}
      {step && step.total > 1 && (
        <View
          style={styles.progress}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Etapa ${step.current} de ${step.total}`}
          accessibilityValue={{ min: 1, max: step.total, now: step.current }}
        >
          {Array.from({ length: step.total }, (_, index) => (
            <View key={index} style={[styles.segment, index < step.current && styles.segmentDone]} />
          ))}
          <Text style={styles.counter}>
            {step.current}/{step.total}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  back: {
    alignSelf: 'flex-start',
    marginLeft: -spacing.sm,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  segmentDone: {
    backgroundColor: colors.primary,
  },
  counter: {
    ...typography.muted,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
});
