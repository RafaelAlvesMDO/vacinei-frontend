import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, ConfirmDialog, Screen } from '@/components/ui';
import { NotificationSettingsCard } from '@/components/alerts/NotificationSettingsCard';
import { useAuth } from '@/hooks/useAuth';
import { useOptionalVaccineAlerts } from '@/hooks/useVaccineAlerts';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { Ala } from '@/types/auth';
import { ALA_LABELS, getInitials, ROLE_LABELS, VERIFICATION_LABELS } from '@/utils/roles';

/**
 * Perfil simples das duas alas: dados da conta, troca de ala (só profissional) e saída.
 * Edição do nome e troca de senha (RF003) ficam para uma próxima etapa
 */
export function ProfileScreen() {
  const { user, ala, chooseAla, signOut } = useAuth();
  const vaccineAlerts = useOptionalVaccineAlerts();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;

  const isProfessional = user.role === 'PROFISSIONAL_SAUDE';
  const registry = user.professionalRegistry;
  const otherAla: Ala = ala === 'profissional' ? 'cidadao' : 'profissional';

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setConfirmingSignOut(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <Text style={typography.title} accessibilityRole="header">
        Perfil
      </Text>

      <Card style={styles.account}>
        <View style={styles.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={styles.initials}>{getInitials(user.name)}</Text>
        </View>
        <View style={styles.accountText}>
          <Text style={typography.subtitle}>{user.name}</Text>
          <Text style={typography.muted} selectable>
            {user.email}
          </Text>
          <View style={styles.badges}>
            <Badge label={ROLE_LABELS[user.role]} icon={isProfessional ? 'medkit-outline' : 'person-outline'} />
            {registry && (
              <Badge
                label={VERIFICATION_LABELS[registry.status]}
                tone={registry.isVerified ? 'primary' : registry.status === 'RECUSADO' ? 'danger' : 'warning'}
                icon={registry.isVerified ? 'shield-checkmark-outline' : 'time-outline'}
              />
            )}
          </View>
        </View>
      </Card>

      {isProfessional && ala && (
        <Card>
          <Text style={typography.label}>Você está na {ALA_LABELS[ala]}</Text>
          <Text style={typography.muted}>
            A ala Cidadão mostra a sua caderneta; a ala Profissional, as ferramentas de atendimento.
          </Text>
          <Button
            label={`Trocar para a ${ALA_LABELS[otherAla]}`}
            variant="secondary"
            icon="swap-horizontal"
            onPress={() => chooseAla(otherAla)}
          />
        </Card>
      )}

      {/* Os alertas são da caderneta pessoal: só aparecem na ala Cidadão */}
      {vaccineAlerts && <NotificationSettingsCard />}

      <Card>
        <Button
          label="Política de privacidade"
          variant="link"
          icon="document-text-outline"
          onPress={() => router.push('/privacidade')}
          style={styles.link}
        />
      </Card>

      <Button
        label="Sair"
        variant="secondary"
        danger
        icon="log-out-outline"
        onPress={() => setConfirmingSignOut(true)}
      />

      <ConfirmDialog
        visible={confirmingSignOut}
        variant="danger"
        icon="log-out-outline"
        title="Sair da conta?"
        message="Você precisará entrar novamente para acessar sua caderneta."
        confirmLabel="Sair"
        loadingLabel="Saindo..."
        loading={signingOut}
        onConfirm={() => void handleSignOut()}
        onCancel={() => setConfirmingSignOut(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primary,
  },
  accountText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  link: {
    alignSelf: 'flex-start',
    marginLeft: -spacing.sm,
  },
});
