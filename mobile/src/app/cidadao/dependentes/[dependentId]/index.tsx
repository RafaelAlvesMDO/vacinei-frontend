import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DependentLoadState } from '@/components/dependents/DependentLoadState';
import { SituationBadges } from '@/components/dependents/SituationBadges';
import { Banner, Button, Card, ConfirmDialog, Icon, Screen, StepHeader } from '@/components/ui';
import { useDependents } from '@/hooks/useDependents';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { parseApiError } from '@/services/auth';
import { deleteDependent } from '@/services/dependents';
import { colors, fonts, radius, spacing, touchTarget, typography } from '@/theme';
import type { Dependent } from '@/types/dependent';
import { formatCpf } from '@/utils/cpf';
import { describeDependent, formatVaccineCount, RELATIONSHIP_LABELS, SEX_LABELS } from '@/utils/dependents';
import { formatCalendarDate, formatDate } from '@/utils/format';
import { getFirstName, getInitials } from '@/utils/roles';

const SAVED_MESSAGES: Record<string, string> = {
  cadastrado: 'Dependente cadastrado. Agora você pode registrar as vacinas na caderneta do dependente.',
  editado: 'Os dados do dependente foram atualizados.',
};

/**
 * Perfil do dependente (RF012, D33): dados básicos, acesso à caderneta, edição e remoção. Só o responsável
 * acessa (RS004)
 */
export default function DependentProfile() {
  const { dependentId, salvo } = useLocalSearchParams<{ dependentId: string; salvo?: string }>();
  const { dependents, error, isRefreshing, reload, removed } = useDependents();
  const { card, error: cardError, reload: reloadCard } = useVaccinationCard();
  // Voltando da caderneta, o resumo já aparece atualizado
  useReloadOnFocus(reloadCard);
  const dependent = dependents?.find((item) => item.dependent.id === dependentId)?.dependent;
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/cidadao/dependentes'));
  // Depois de remover, volta para onde o perfil foi aberto (lista ou Início), que já não mostra o dependente
  const goToList = goBack;

  const remove = async () => {
    if (!dependent) return;
    setRemoving(true);
    try {
      await deleteDependent(dependent.id);
      setConfirming(false);
      goToList();
      removed(dependent.id);
    } catch (reason) {
      const parsed = parseApiError(reason, 'Não foi possível remover o dependente. Tente novamente.');
      if (parsed.status === 404) {
        // Já removido (por exemplo, em outro aparelho)
        setConfirming(false);
        goToList();
        removed(dependent.id);
        return;
      }
      setRemoveError(parsed.message);
      setConfirming(false);
    } finally {
      setRemoving(false);
    }
  };

  const refresh = () => {
    reload({ refreshing: true });
    reloadCard();
  };

  return (
    <Screen
      header={<StepHeader title="Perfil do dependente" onBack={goBack} />}
      refreshing={isRefreshing}
      onRefresh={refresh}
    >
      {!dependent ? (
        <DependentLoadState loaded={dependents !== null} error={error} onRetry={() => reload()} onBack={goBack} />
      ) : (
        <>
          {salvo && SAVED_MESSAGES[salvo] && <Banner tone="success" message={SAVED_MESSAGES[salvo]} />}
          {removeError && <Banner tone="danger" title="Não foi possível remover" message={removeError} />}

          <ProfileHero dependent={dependent} />
          <InfoCard dependent={dependent} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Caderneta de ${getFirstName(dependent.name)}`}
            accessibilityHint="Abre a caderneta de vacinação do dependente"
            onPress={() =>
              router.push({ pathname: '/cidadao/dependentes/[dependentId]/caderneta', params: { dependentId } })
            }
            style={({ pressed }) => [styles.cardLink, pressed && styles.pressed]}
          >
            <View style={styles.cardIcon}>
              <Icon name="book-outline" size={24} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Caderneta de {getFirstName(dependent.name)}</Text>
              <Text style={typography.muted}>
                {card ? formatVaccineCount(card.vaccines.length) : cardError ? 'Não foi possível carregar' : 'Carregando...'}
              </Text>
              {card && <SituationBadges card={card} />}
            </View>
            <Icon name="chevron-forward" color={colors.muted} />
          </Pressable>

          <Button
            label="Editar dados"
            icon="create-outline"
            variant="secondary"
            accessibilityHint={`Edita os dados de ${dependent.name}`}
            onPress={() =>
              router.push({ pathname: '/cidadao/dependentes/[dependentId]/editar', params: { dependentId } })
            }
          />
          <Button
            label="Remover dependente"
            icon="trash-outline"
            variant="link"
            danger
            accessibilityHint={`Remove ${dependent.name} da sua lista de dependentes`}
            onPress={() => {
              setRemoveError(null);
              setConfirming(true);
            }}
          />

          <ConfirmDialog
            visible={confirming}
            variant="danger"
            icon="person-remove-outline"
            title={`Remover ${dependent.name}?`}
            message="Você perderá o acesso ao perfil e à caderneta deste dependente, e os registros ainda não confirmados serão apagados. Dependentes com doses confirmadas por um profissional de saúde não podem ser removidos."
            confirmLabel="Remover dependente"
            loadingLabel="Removendo..."
            loading={removing}
            onConfirm={() => void remove()}
            onCancel={() => setConfirming(false)}
          />
        </>
      )}
    </Screen>
  );
}

function ProfileHero({ dependent }: { dependent: Dependent }) {
  return (
    <View style={styles.hero}>
      <View style={styles.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={styles.initials}>{getInitials(dependent.name)}</Text>
      </View>
      <View style={styles.heroText}>
        <Text style={styles.heroName} accessibilityRole="header">
          {dependent.name}
        </Text>
        <Text style={typography.muted}>{describeDependent(dependent)}</Text>
      </View>
    </View>
  );
}

function InfoCard({ dependent }: { dependent: Dependent }) {
  return (
    <Card style={styles.info}>
      <InfoRow label="Data de nascimento" value={formatCalendarDate(dependent.birthDate)} />
      <InfoRow label="Sexo" value={SEX_LABELS[dependent.sex]} />
      <InfoRow label="CPF" value={dependent.cpf ? formatCpf(dependent.cpf) : 'Não informado'} />
      <InfoRow
        label="Parentesco"
        value={dependent.relationship ? RELATIONSHIP_LABELS[dependent.relationship] : 'Não informado'}
      />
      <InfoRow label="Cadastrado em" value={formatDate(dependent.createdAt)} />
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={typography.muted}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.white,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  heroName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primaryDark,
  },
  info: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: spacing.md,
    rowGap: 2,
  },
  infoValue: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDark,
    textAlign: 'right',
  },
  cardLink: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.primaryDark,
  },
});
