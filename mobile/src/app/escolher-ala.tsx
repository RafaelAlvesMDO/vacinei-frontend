import { StyleSheet, Text, View } from 'react-native';
import { BrandHeader } from '@/components/BrandHeader';
import { Badge, Button, RadioCard, Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography } from '@/theme';
import { getFirstName, VERIFICATION_LABELS } from '@/utils/roles';

/**
 * Escolha da ala pelo profissional (D23), na primeira entrada neste aparelho.
 * Depois, o app abre a última ala e a troca fica no Perfil
 */
export default function ChooseAla() {
  const { user, chooseAla, signOut } = useAuth();
  if (!user) return null;

  const status = user.professionalRegistry?.status ?? 'PENDENTE';
  const verified = user.professionalRegistry?.isVerified ?? false;

  return (
    <Screen>
      <BrandHeader />

      <View style={styles.intro}>
        <Text style={typography.title} accessibilityRole="header">
          Olá, {getFirstName(user.name)}
        </Text>
        <Text style={[typography.body, styles.muted]}>Como você quer usar o app agora?</Text>
      </View>

      <RadioCard
        mode="button"
        icon="person-outline"
        title="Ala Cidadão"
        description="Sua caderneta de vacinação e as UBS próximas"
        onPress={() => chooseAla('cidadao')}
      />
      <RadioCard
        mode="button"
        icon="medkit-outline"
        title="Ala Profissional"
        description="Atendimento e confirmação de doses"
        onPress={() => chooseAla('profissional')}
        extra={
          !verified && (
            <Badge
              label={VERIFICATION_LABELS[status]}
              tone={status === 'RECUSADO' ? 'danger' : 'warning'}
              icon="time-outline"
            />
          )
        }
      />

      <Text style={[typography.muted, styles.center]}>Você pode trocar de ala a qualquer momento pelo Perfil.</Text>

      <View style={styles.footer}>
        <Button label="Sair" variant="link" icon="log-out-outline" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  muted: {
    color: colors.muted,
  },
  center: {
    textAlign: 'center',
  },
  footer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
