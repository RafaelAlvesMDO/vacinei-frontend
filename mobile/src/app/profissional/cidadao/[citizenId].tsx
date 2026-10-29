import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { CitizenVaccineItem } from '@/components/professional/CitizenVaccineItem';
import { openConfirmDose } from '@/components/professional/navigation';
import { VerifiedOnly } from '@/components/professional/VerifiedOnly';
import { Banner, Button, Card, Screen, StateMessage, StepHeader } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { SummaryCard } from '@/components/vaccination/SummaryCard';
import { useAuth } from '@/hooks/useAuth';
import { useCitizenCard } from '@/hooks/useCitizenCard';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { VaccinationCard } from '@/types/vaccination';
import { getAge } from '@/utils/confirmDose';
import { formatCalendarDate } from '@/utils/format';
import { getInitials } from '@/utils/roles';
import { sortVaccines } from '@/utils/vaccination';

/**
 * Caderneta do cidadão na ala Profissional (RF010): situação das vacinas e confirmação de doses.
 * Na própria caderneta, só leitura (RS006, D11)
 */
export default function CitizenCardScreen() {
  return (
    <VerifiedOnly>
      <CitizenCardContent />
    </VerifiedOnly>
  );
}

function CitizenCardContent() {
  const { citizenId } = useLocalSearchParams<{ citizenId: string }>();
  const { user } = useAuth();
  const { data: card, errorMessage, isRefreshing, reload } = useCitizenCard(citizenId);
  // Voltando da confirmação, a caderneta já aparece atualizada
  useReloadOnFocus(reload);
  const isOwnCard = user?.id === citizenId;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profissional/cidadaos'));

  return (
    <Screen
      header={<StepHeader title="Caderneta do cidadão" onBack={goBack} />}
      refreshing={isRefreshing}
      onRefresh={() => reload({ refreshing: true })}
    >
      {!card ? (
        <CardLoadState error={errorMessage} onRetry={() => reload()} loadingTitle="Carregando a caderneta..." />
      ) : (
        <>
          {errorMessage && <Banner tone="danger" title="Não foi possível atualizar" message={errorMessage} />}
          <CardContent card={card} isOwnCard={isOwnCard} />
        </>
      )}
    </Screen>
  );
}

function CardContent({ card, isOwnCard }: { card: VaccinationCard; isOwnCard: boolean }) {
  const { citizen } = card;
  const age = getAge(citizen.birthDate);
  const vaccines = sortVaccines(card.vaccines);
  const registerOther = () => openConfirmDose({ citizenId: citizen.id });

  return (
    <>
      <Card style={styles.citizen}>
        <View style={styles.avatar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={styles.initials}>{getInitials(citizen.name)}</Text>
        </View>
        <View style={styles.citizenText}>
          <Text style={typography.subtitle} accessibilityRole="header">
            {citizen.name}
          </Text>
          <Text style={typography.muted}>
            Nasc. {formatCalendarDate(citizen.birthDate)}
            {age !== null && ` · ${age} ${age === 1 ? 'ano' : 'anos'}`}
          </Text>
        </View>
      </Card>

      {isOwnCard && (
        <Banner
          tone="warning"
          icon="shield-outline"
          title="Esta é a sua caderneta"
          message="Você não pode confirmar a própria vacinação (RS006). Outro profissional de saúde deve conferir as suas doses."
        />
      )}

      {vaccines.length === 0 ? (
        <StateMessage
          variant="empty"
          icon="book-outline"
          title="Caderneta vazia"
          message={
            isOwnCard
              ? 'Nenhuma vacina registrada na sua caderneta.'
              : 'Nenhuma vacina registrada. Use "Registrar vacina" para lançar a primeira dose.'
          }
          action={isOwnCard ? undefined : { label: 'Registrar vacina', icon: 'needle', onPress: registerOther }}
        />
      ) : (
        <>
          <SummaryCard vaccines={card.vaccines} />
          {!isOwnCard && (
            <Button
              label="Registrar outra vacina"
              icon="add-circle-outline"
              accessibilityHint="Abre a confirmação de dose para qualquer vacina do catálogo"
              onPress={registerOther}
            />
          )}
          <View style={styles.list}>
            <Text style={typography.subtitle} accessibilityRole="header">
              Vacinas
            </Text>
            {vaccines.map((item) => (
              <CitizenVaccineItem
                key={item.vaccine.id}
                item={item}
                canConfirm={!isOwnCard}
                onConfirmDose={() => openConfirmDose({ citizenId: citizen.id, vaccineId: item.vaccine.id })}
                onConfirmRecord={(record) =>
                  openConfirmDose({ citizenId: citizen.id, vaccineId: item.vaccine.id, recordId: record.id })
                }
              />
            ))}
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  citizen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.white,
  },
  citizenText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  list: {
    gap: spacing.md,
  },
});
