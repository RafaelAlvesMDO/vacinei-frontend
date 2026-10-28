import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { Badge, Banner, Button, Card, Icon, Screen, StateMessage, StepHeader } from '@/components/ui';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { useVaccineCatalog } from '@/hooks/useVaccineCatalog';
import { parseApiError } from '@/services/auth';
import { createRecord, updateRecord } from '@/services/vaccinationRecords';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { SavedRecord, VaccinationCard } from '@/types/vaccination';
import { formatCalendarDate } from '@/utils/format';
import { getRecordBadge } from '@/utils/vaccination';
import {
  getTakenDoseIds,
  suggestDose,
  toFormValues,
  toRecordPayload,
  validateRecordForm,
  type RecordField,
  type RecordFormErrors,
  type RecordFormValues,
  type RecordInitialValues,
} from '@/utils/vaccineRecord';
import { VaccineRecordForm } from './VaccineRecordForm';

type Step = 'form' | 'summary' | 'saved';

const RECORD_FIELDS: RecordField[] = ['vaccineId', 'doseId', 'applicationDate', 'lote'];
const DUPLICATE_DOSE = 'Esta dose já está na sua caderneta.';

interface Props {
  card: VaccinationCard;
  // Vacina do detalhe, registro em edição ou leitura do OCR (etapa 8), para o cidadão conferir
  initialValues?: RecordInitialValues;
  // Id do registro em edição (PUT); sem ele, cadastro (POST)
  recordId?: string | null;
  title?: string;
  subtitle?: string;
  // Sai do fluxo (voltar no primeiro passo)
  onExit: () => void;
}

/**
 * Cadastro manual na própria caderneta (RF005, D30): formulário → resumo para conferir → registro salvo.
 * O registro fica "Aguardando confirmação" até um profissional conferir presencialmente (D06)
 */
export function VaccineRecordFlow({ card, initialValues, recordId = null, title, subtitle, onExit }: Props) {
  const { reload: reloadCard } = useVaccinationCard();
  const { vaccines, error: catalogError, reload: reloadCatalog } = useVaccineCatalog();
  const [editingId, setEditingId] = useState(recordId);
  const [step, setStep] = useState<Step>('form');
  const [draft, setDraft] = useState(() => toFormValues(initialValues));
  const [errors, setErrors] = useState<RecordFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SavedRecord | null>(null);

  const isEditing = editingId !== null;
  const vaccine = vaccines?.find((item) => item.id === draft.vaccineId);
  const cardVaccine = card.vaccines.find((item) => item.vaccine.id === draft.vaccineId);
  const taken = getTakenDoseIds(cardVaccine, editingId);
  // Vacina vinda de fora sem a dose (ex.: "Registrar nova dose"): sugere a próxima pendente
  const values: RecordFormValues =
    vaccine && !draft.doseId ? { ...draft, doseId: suggestDose(vaccine, cardVaccine, taken)?.id ?? null } : draft;
  const dose = vaccine?.doses.find((item) => item.id === values.doseId);

  // Voltar do Android no resumo retorna ao formulário
  useEffect(() => {
    if (step !== 'summary') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!saving) setStep('form');
      return true;
    });
    return () => subscription.remove();
  }, [step, saving]);

  const change = (patch: Partial<RecordFormValues>) => {
    // Parte dos valores exibidos (com a dose sugerida), para a sugestão não se perder ao editar outro campo
    setDraft({ ...values, ...patch });
    setErrors((current) => {
      const next = { ...current };
      for (const field of Object.keys(patch) as RecordField[]) delete next[field];
      return next;
    });
  };

  const review = () => {
    const found = validateRecordForm(values, { vaccine, taken, birthDate: card.citizen.birthDate });
    setErrors(found);
    setError(null);
    if (Object.keys(found).length === 0) setStep('summary');
  };

  const backToForm = (message: string | null, fieldErrors: RecordFormErrors = {}) => {
    setError(message);
    setErrors(fieldErrors);
    setStep('form');
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = toRecordPayload(values);
      const record = editingId ? await updateRecord(editingId, payload) : await createRecord(payload);
      setSaved(record);
      setStep('saved');
      reloadCard();
    } catch (reason) {
      const parsed = parseApiError(reason, 'Não foi possível salvar o registro. Tente novamente.');
      if (parsed.status === 400) {
        const fieldErrors: RecordFormErrors = {};
        for (const field of RECORD_FIELDS) {
          if (parsed.fieldErrors[field]) fieldErrors[field] = parsed.fieldErrors[field];
        }
        backToForm(Object.keys(fieldErrors).length > 0 ? 'Confira os campos destacados.' : parsed.message, fieldErrors);
      } else if (parsed.status === 409) {
        backToForm(null, { doseId: DUPLICATE_DOSE });
        reloadCard();
      } else if (parsed.status === 404) {
        backToForm(
          isEditing
            ? 'Não encontramos este registro ou a vacina escolhida. Ele pode ter sido excluído ou a vacina, desativada.'
            : 'Esta vacina não está mais disponível no catálogo. Escolha outra vacina.',
        );
        reloadCatalog();
        reloadCard();
      } else if (parsed.status === 403) {
        // Ex.: o registro foi confirmado por um profissional enquanto era editado
        backToForm(parsed.message);
        reloadCard();
      } else {
        // Falha de conexão ou do servidor: continua no resumo para tentar de novo
        setError(parsed.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const addAnother = () => {
    setEditingId(null);
    setDraft(toFormValues());
    setErrors({});
    setError(null);
    setSaved(null);
    setStep('form');
  };

  const goToCard = () => {
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/cidadao/caderneta');
  };

  if (step === 'saved' && saved) {
    return (
      <SavedStep
        record={saved}
        citizenName={card.citizen.name}
        isEditing={isEditing}
        onGoToCard={goToCard}
        onAddAnother={addAnother}
        onExit={onExit}
      />
    );
  }

  if (step === 'summary' && vaccine && dose) {
    return (
      <Screen
        header={<StepHeader title="Resumo da vacina" subtitle="Confira antes de salvar" onBack={() => setStep('form')} />}
        footer={
          <View style={styles.footerActions}>
            <Button
              label="Editar informações"
              icon="create-outline"
              variant="secondary"
              onPress={() => setStep('form')}
              disabled={saving}
            />
            <Button
              label={isEditing ? 'Salvar alterações' : 'Salvar na caderneta'}
              loadingLabel="Salvando..."
              icon="checkmark"
              loading={saving}
              onPress={save}
            />
          </View>
        }
      >
        {error && <Banner tone="danger" title="Não foi possível salvar" message={error} />}
        <VaccineHero name={vaccine.name} detail={`${dose.doseName} · ${card.citizen.name}`} />
        <Card style={styles.rows}>
          <SummaryRow label="Data de aplicação" value={values.applicationDate} />
          <SummaryRow label="Lote" value={values.lote || 'Não informado'} />
          <SummaryRow label="Doença" value={vaccine.targetDisease} />
          <View style={styles.summaryRow}>
            <Text style={typography.muted}>Origem do registro</Text>
            <Badge label="Informado por você" tone="neutral" icon="person-outline" />
          </View>
        </Card>
        <Banner
          tone="warning"
          title="Aguardando confirmação"
          message="Registros feitos por você ficam aguardando confirmação até um profissional de saúde conferi-los presencialmente."
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <StepHeader
          title={title ?? (isEditing ? 'Editar registro' : 'Cadastrar vacina')}
          subtitle={subtitle ?? 'Preencha os dados da aplicação'}
          onBack={onExit}
        />
      }
      footer={
        <View style={styles.footer}>
          <Button label="Confirmar informações" icon="checkmark" onPress={review} disabled={!vaccines} />
          <Text style={[styles.small, styles.center]}>* Campos obrigatórios para salvar o registro.</Text>
        </View>
      }
    >
      {error && <Banner tone="danger" title="Não foi possível salvar" message={error} />}
      {vaccines ? (
        <VaccineRecordForm
          values={values}
          onChange={change}
          errors={errors}
          catalog={vaccines}
          cardVaccines={card.vaccines}
          editingRecordId={editingId}
        />
      ) : catalogError ? (
        <StateMessage
          variant="error"
          title="Não foi possível carregar as vacinas"
          message={catalogError}
          action={{ label: 'Tentar novamente', icon: 'refresh', onPress: reloadCatalog }}
        />
      ) : (
        <StateMessage variant="loading" title="Carregando vacinas..." />
      )}
    </Screen>
  );
}

interface SavedStepProps {
  record: SavedRecord;
  citizenName: string;
  isEditing: boolean;
  onGoToCard: () => void;
  onAddAnother: () => void;
  onExit: () => void;
}

function SavedStep({ record, citizenName, isEditing, onGoToCard, onAddAnother, onExit }: SavedStepProps) {
  const badge = getRecordBadge(record);
  const vaccineName = record.dose.vaccine.name;
  const date = formatCalendarDate(record.applicationDate);

  return (
    <Screen
      header={<StepHeader title="Registro salvo" onBack={onExit} />}
      footer={
        <View style={styles.footerActions}>
          <Button label="Ver minha caderneta" icon="book-outline" onPress={onGoToCard} />
          {isEditing ? (
            <Button label="Voltar para a vacina" icon="arrow-back" variant="secondary" onPress={onExit} />
          ) : (
            <Button label="Adicionar outra vacina" icon="add" variant="secondary" onPress={onAddAnother} />
          )}
        </View>
      }
    >
      <View style={styles.success} accessibilityLiveRegion="polite">
        <View style={styles.successHalo}>
          <View style={styles.successCircle}>
            <Icon name="checkmark" size={36} color={colors.white} />
          </View>
        </View>
        <Text style={[typography.title, styles.center]} accessibilityRole="header">
          {isEditing ? 'Registro atualizado!' : 'Vacina registrada!'}
        </Text>
        <Text style={[typography.muted, styles.center]}>
          {vaccineName} ({record.dose.doseName}) foi salva na caderneta de {citizenName}.
        </Text>
      </View>

      <Card style={styles.savedCard}>
        <View style={styles.savedTitle}>
          <Text style={styles.savedName}>{vaccineName}</Text>
          <Text style={typography.muted}>
            {record.dose.doseName} · {date}
          </Text>
        </View>
        <Badge label={badge.label} tone={badge.tone} icon={badge.icon} />
      </Card>

      <Banner
        tone="warning"
        message="Leve sua caderneta física à UBS: um profissional de saúde confere o registro presencialmente e ele passa a constar como confirmado."
      />
    </Screen>
  );
}

function VaccineHero({ name, detail }: { name: string; detail: string }) {
  return (
    <View style={styles.hero} accessible accessibilityLabel={`${name}. ${detail}`}>
      <View style={styles.heroIcon}>
        <Icon name="needle" size={26} color={colors.white} />
      </View>
      <View style={styles.heroText}>
        <Text style={styles.heroName}>{name}</Text>
        <Text style={typography.muted}>{detail}</Text>
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={typography.muted}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.sm,
  },
  footerActions: {
    gap: spacing.md,
  },
  small: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  center: {
    textAlign: 'center',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  heroName: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.primaryDark,
  },
  rows: {
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.md,
    rowGap: 2,
  },
  summaryValue: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.primaryDark,
    textAlign: 'right',
  },
  success: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  successHalo: {
    width: 112,
    height: 112,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  savedTitle: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    gap: 2,
  },
  savedName: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.primaryDark,
  },
});
