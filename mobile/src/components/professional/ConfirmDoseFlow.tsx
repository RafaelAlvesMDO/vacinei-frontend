import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import {
  Badge,
  Banner,
  Button,
  Card,
  Icon,
  Screen,
  SelectField,
  StateMessage,
  StepHeader,
  TextField,
  type SelectOption,
} from '@/components/ui';
import { useForbiddenSync } from '@/hooks/useForbiddenSync';
import { parseApiError } from '@/services/auth';
import { confirmDose } from '@/services/vaccinationRecords';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { CardRecord, CatalogVaccine, ConfirmDoseResult, VaccinationCard } from '@/types/vaccination';
import {
  getDoseStatuses,
  getEarlyDoseDate,
  INACTIVE_VACCINE_MESSAGE,
  splitCatalog,
  suggestConfirmDose,
  validateConfirmLote,
} from '@/utils/confirmDose';
import { formatCalendarDate, formatDate } from '@/utils/format';
import { SCHEDULE_STATUS } from '@/utils/vaccination';
import { LOTE_MAX_LENGTH, normalizeLote } from '@/utils/vaccineRecord';

type Step = 'form' | 'review' | 'done';
type Field = 'vaccineId' | 'doseId' | 'lote';
type FieldErrors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ['vaccineId', 'doseId', 'lote'];
const ALREADY_CONFIRMED = 'Esta dose já foi confirmada.';

// Registro do cidadão aguardando confirmação: vacina e dose ficam fixas (RF007 nota 7)
export interface PendingRecord {
  vaccineId: string;
  vaccineName: string;
  record: CardRecord;
}

interface Props {
  card: VaccinationCard;
  // Catálogo de vacinas ativas (null enquanto carrega)
  catalog: CatalogVaccine[] | null;
  catalogError: string | null;
  onReloadCatalog: () => void;
  // Recarrega a caderneta (409, 404 e depois de confirmar)
  onReloadCard: () => void;
  initialVaccineId: string | null;
  pendingRecord: PendingRecord | null;
  professionalName: string;
  onExit: () => void;
  onGoToPanel: () => void;
}

/**
 * Confirmação presencial de dose (RF010, RS006): dados da vacinação → revisão → vacinação confirmada.
 * Vacina e dose vêm sugeridas e podem ser trocadas (notas 2 e 3); o lote é obrigatório. A data é a do dia
 * (definida pela API) e o profissional é o da sessão
 */
export function ConfirmDoseFlow({
  card,
  catalog,
  catalogError,
  onReloadCatalog,
  onReloadCard,
  initialVaccineId,
  pendingRecord,
  professionalName,
  onExit,
  onGoToPanel,
}: Props) {
  const { citizen } = card;
  const [step, setStep] = useState<Step>('form');
  const [record, setRecord] = useState(pendingRecord);
  const [vaccineId, setVaccineId] = useState(pendingRecord?.vaccineId ?? initialVaccineId);
  // null = segue a sugestão; preenchido quando o profissional escolhe outra dose
  const [chosenDoseId, setChosenDoseId] = useState<string | null>(pendingRecord?.record.dose.id ?? null);
  const [lote, setLote] = useState(() => normalizeLote(pendingRecord?.record.lotNumber ?? ''));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<{ status: number | null; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ConfirmDoseResult | null>(null);
  // Data da confirmação: definida pela API no envio, exibida só para conferência
  const [today] = useState(() => formatDate(new Date().toISOString()));
  useForbiddenSync(submitError?.status);

  const statuses = getDoseStatuses(card.vaccines);
  const cardVaccine = card.vaccines.find((item) => item.vaccine.id === vaccineId);
  const vaccine = catalog?.find((item) => item.id === vaccineId);
  // Vacina desativada: some do catálogo, mas os registros continuam na caderneta
  const isVaccineInactive = !record && !!vaccineId && !!catalog && !vaccine;
  const suggestedDoseId = suggestConfirmDose(vaccine, cardVaccine, statuses);
  const doseId = chosenDoseId ?? suggestedDoseId;
  const dose = vaccine?.doses.find((item) => item.id === doseId);
  const vaccineName = record?.vaccineName ?? vaccine?.name ?? '';
  const doseName = record?.record.dose.doseName ?? dose?.doseName ?? '';
  const applicationDate = record ? formatCalendarDate(record.record.applicationDate) : today;
  const earlyDoseDate = record ? null : getEarlyDoseDate(cardVaccine, doseId);

  // Voltar do Android na revisão retorna ao formulário
  useEffect(() => {
    if (step !== 'review') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!submitting) setStep('form');
      return true;
    });
    return () => subscription.remove();
  }, [step, submitting]);

  const clearError = (field: Field) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const review = () => {
    const found: FieldErrors = {};
    if (!record) {
      if (!vaccineId) found.vaccineId = 'Escolha a vacina aplicada.';
      else if (vaccine && !doseId) found.doseId = 'Escolha a dose aplicada.';
      else if (doseId && statuses.get(doseId) === 'CONFIRMADO') found.doseId = ALREADY_CONFIRMED;
    }
    const loteError = validateConfirmLote(lote);
    if (loteError) found.lote = loteError;
    setErrors(found);
    setSubmitError(isVaccineInactive ? { status: null, message: INACTIVE_VACCINE_MESSAGE } : null);
    if (Object.keys(found).length === 0 && !isVaccineInactive) setStep('review');
  };

  const backToForm = (message: string | null, status: number | null, fieldErrors: FieldErrors = {}) => {
    setSubmitError(message ? { status, message } : null);
    setErrors(fieldErrors);
    setStep('form');
  };

  const submit = async () => {
    if (!vaccineId || !doseId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const confirmed = await confirmDose({ citizenId: citizen.id, vaccineId, doseId, lote });
      setResult(confirmed);
      setStep('done');
      onReloadCard();
    } catch (reason) {
      const parsed = parseApiError(reason, 'Não foi possível confirmar a dose. Tente novamente.');
      if (parsed.status === 409) {
        backToForm(record ? ALREADY_CONFIRMED : null, 409, record ? {} : { doseId: ALREADY_CONFIRMED });
        onReloadCard();
      } else if (parsed.status === 400) {
        const fieldErrors: FieldErrors = {};
        for (const field of FIELDS) {
          if (parsed.fieldErrors[field]) fieldErrors[field] = parsed.fieldErrors[field];
        }
        backToForm(Object.keys(fieldErrors).length > 0 ? 'Confira os campos destacados.' : parsed.message, 400, fieldErrors);
      } else if (parsed.status === 404) {
        backToForm('Não encontramos o cidadão ou a vacina. A vacina pode ter sido desativada no catálogo.', 404);
        onReloadCatalog();
        onReloadCard();
      } else if (parsed.status === 403) {
        backToForm(parsed.message, 403);
      } else {
        // Falha de conexão ou do servidor: continua na revisão para tentar de novo
        setSubmitError({ status: parsed.status, message: parsed.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const registerAnother = () => {
    setRecord(null);
    setVaccineId(null);
    setChosenDoseId(null);
    setLote('');
    setErrors({});
    setSubmitError(null);
    setResult(null);
    setStep('form');
  };

  if (step === 'done' && result) {
    return (
      <DoneStep
        result={result}
        citizenName={citizen.name}
        professionalName={professionalName}
        onBackToCard={onExit}
        onRegisterAnother={registerAnother}
        onGoToPanel={onGoToPanel}
      />
    );
  }

  if (step === 'review') {
    return (
      <Screen
        header={
          <StepHeader
            title="Revise antes de confirmar"
            subtitle="Depois da confirmação, o registro não pode ser alterado."
            onBack={() => setStep('form')}
            step={{ current: 3, total: 3 }}
          />
        }
        footer={
          <View style={styles.footer}>
            <Button
              label="Confirmar aplicação"
              loadingLabel="Confirmando..."
              icon="checkmark"
              loading={submitting}
              onPress={submit}
            />
            <Button
              label="Editar informações"
              icon="create-outline"
              variant="secondary"
              disabled={submitting}
              onPress={() => setStep('form')}
            />
          </View>
        }
      >
        {submitError && <Banner tone="danger" title="Não foi possível confirmar" message={submitError.message} />}
        <Card style={styles.review}>
          <VaccineHero name={vaccineName} detail={`${doseName} · ${citizen.name}`} />
          <ReviewSection
            title="Cidadão"
            rows={[
              ['Nome', citizen.name],
              ['Nascimento', formatCalendarDate(citizen.birthDate)],
            ]}
          />
          <ReviewSection
            title="Aplicação"
            rows={[
              ['Vacina', vaccineName],
              ['Dose', doseName],
              ['Data de aplicação', applicationDate],
              ['Lote', lote],
            ]}
          />
          <ReviewSection title="Responsabilidade profissional" rows={[['Profissional', professionalName]]} />
        </Card>
        <Banner
          tone="warning"
          title="Confirmação definitiva"
          message="Ao confirmar, você declara que a dose foi aplicada (ou conferida na caderneta física) e assume a responsabilidade pelas informações registradas."
        />
        <Card>
          <Text style={typography.subtitle} accessibilityRole="header">
            O que acontecerá
          </Text>
          {[
            record ? 'O registro do cidadão passa a constar como confirmado' : 'A dose será adicionada à caderneta',
            'A pendência desta dose será encerrada',
            'O registro ficará vinculado à sua conta',
          ].map((text) => (
            <View key={text} style={styles.outcome}>
              <Icon name="checkmark-circle" color={colors.primary} />
              <Text style={[typography.body, styles.flex]}>{text}</Text>
            </View>
          ))}
        </Card>
      </Screen>
    );
  }

  const renderSelection = () => {
    if (catalogError && !catalog) {
      return (
        <StateMessage
          variant="error"
          title="Não foi possível carregar as vacinas"
          message={catalogError}
          action={{ label: 'Tentar novamente', icon: 'refresh', onPress: onReloadCatalog }}
        />
      );
    }
    if (!catalog) return <StateMessage variant="loading" title="Carregando vacinas..." />;

    const { pending, others } = splitCatalog(catalog, card.vaccines);
    const byId = new Map(card.vaccines.map((item) => [item.vaccine.id, item]));
    const vaccineOptions: SelectOption<string>[] = [...pending, ...others].map((item) => {
      const alert = byId.get(item.id)?.alert.status;
      return {
        value: item.id,
        label: item.name,
        description: alert && alert !== 'COMPLETA' ? `Pendente na caderneta · ${SCHEDULE_STATUS[alert].label}` : undefined,
      };
    });
    const doseOptions: SelectOption<string>[] = (vaccine?.doses ?? []).map((item) => {
      const status = statuses.get(item.id);
      const notes = [
        item.id === suggestedDoseId ? 'Sugerida pela caderneta' : null,
        status === 'CONFIRMADO' ? 'Já confirmada' : null,
        status === 'PENDENTE' ? 'Registrada pelo cidadão' : null,
      ].filter(Boolean);
      return {
        value: item.id,
        label: item.doseName,
        description: notes.length > 0 ? notes.join(' · ') : undefined,
        disabled: status === 'CONFIRMADO',
      };
    });

    return (
      <>
        {isVaccineInactive && <Banner tone="warning" title="Vacina desativada" message={INACTIVE_VACCINE_MESSAGE} />}
        <SelectField
          label="Vacina"
          required
          value={vaccine ? vaccineId : null}
          options={vaccineOptions}
          placeholder="Selecione a vacina"
          hint={vaccine ? `Previne: ${vaccine.targetDisease}` : 'As vacinas pendentes na caderneta aparecem primeiro.'}
          error={errors.vaccineId}
          onChange={(value) => {
            setVaccineId(value);
            setChosenDoseId(null);
            clearError('vaccineId');
            clearError('doseId');
          }}
        />
        <SelectField
          label="Dose"
          required
          value={doseId}
          options={doseOptions}
          placeholder={vaccine ? 'Selecione a dose' : 'Escolha a vacina primeiro'}
          disabled={!vaccine}
          hint={
            doseId && statuses.get(doseId) === 'PENDENTE'
              ? 'O cidadão já registrou esta dose. Ao confirmar, o registro dele passa a ser confirmado.'
              : 'Opções vinculadas à vacina escolhida.'
          }
          error={errors.doseId}
          onChange={(value) => {
            setChosenDoseId(value);
            clearError('doseId');
          }}
        />
        {earlyDoseDate && (
          <Banner
            tone="warning"
            title="Dose antes do prazo"
            message={`Esta dose está sendo registrada antes da data recomendada (${formatCalendarDate(earlyDoseDate)}). Confira se a dose escolhida está correta.`}
          />
        )}
      </>
    );
  };

  return (
    <Screen
      header={
        <StepHeader
          title="Dados da vacinação"
          subtitle={`Preencha a aplicação para ${citizen.name}`}
          onBack={onExit}
          step={{ current: 2, total: 3 }}
        />
      }
      footer={
        <Button
          label="Continuar para revisão"
          icon="arrow-forward"
          onPress={review}
          disabled={!record && !catalog}
        />
      }
    >
      {submitError && <Banner tone="danger" title="Não foi possível confirmar" message={submitError.message} />}

      <View style={styles.citizen} accessible>
        <Text style={styles.citizenName}>{citizen.name}</Text>
        <Text style={typography.muted}>Nasc. {formatCalendarDate(citizen.birthDate)}</Text>
        <Badge label="Selecionado" icon="checkmark" />
      </View>

      <Card style={styles.form}>
        {record ? <PendingRecordBox record={record} /> : renderSelection()}

        <ReadOnlyField label="Data de aplicação" value={applicationDate} hint={record ? 'Data informada pelo cidadão, mantida na confirmação.' : 'Data de hoje, registrada pelo sistema.'} />

        <TextField
          label="Lote"
          required
          placeholder="Ex.: FA26B317"
          hint={`Letras e números, até ${LOTE_MAX_LENGTH} caracteres (${lote.length}/${LOTE_MAX_LENGTH}).`}
          value={lote}
          onChangeText={(text) => {
            setLote(normalizeLote(text));
            clearError('lote');
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={LOTE_MAX_LENGTH}
          error={errors.lote}
        />

        <ReadOnlyField
          label="Profissional responsável"
          value={professionalName}
          hint="Vinculado à conta conectada."
        />
      </Card>
    </Screen>
  );
}

function PendingRecordBox({ record }: { record: PendingRecord }) {
  return (
    <View style={styles.pending}>
      <ReviewRow label="Vacina" value={record.vaccineName} />
      <ReviewRow label="Dose" value={record.record.dose.doseName} />
      <Text style={styles.pendingText}>
        Registro informado pelo cidadão. Confira a caderneta física: ao confirmar, ele passa a constar como confirmado.
      </Text>
    </View>
  );
}

function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.readOnly} accessible accessibilityLabel={`${label}: ${value}. Somente leitura. ${hint}`}>
      <View style={styles.readOnlyLabel}>
        <Text style={typography.label}>{label}</Text>
        <Text style={styles.small}>Somente leitura</Text>
      </View>
      <View style={styles.readOnlyBox}>
        <Text style={[typography.body, styles.flex]}>{value}</Text>
        <Icon name="lock-closed-outline" color={colors.muted} />
      </View>
      <Text style={styles.small}>{hint}</Text>
    </View>
  );
}

function ReviewSection({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBox}>
        {rows.map(([label, value]) => (
          <ReviewRow key={label} label={label} value={value} />
        ))}
      </View>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={typography.muted}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function VaccineHero({ name, detail }: { name: string; detail: string }) {
  return (
    <View style={styles.hero} accessible accessibilityLabel={`${name}. ${detail}`}>
      <View style={styles.heroIcon}>
        <Icon name="needle" size={24} color={colors.white} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.heroName}>{name}</Text>
        <Text style={typography.muted}>{detail}</Text>
      </View>
    </View>
  );
}

interface DoneStepProps {
  result: ConfirmDoseResult;
  citizenName: string;
  professionalName: string;
  onBackToCard: () => void;
  onRegisterAnother: () => void;
  onGoToPanel: () => void;
}

function DoneStep({ result, citizenName, professionalName, onBackToCard, onRegisterAnother, onGoToPanel }: DoneStepProps) {
  const { record } = result;
  const isExisting = result.action === 'CONFIRMED_EXISTING';
  const vaccineName = record.dose.vaccine.name;

  return (
    <Screen
      header={<StepHeader title="Vacinação confirmada" onBack={onBackToCard} backLabel="Voltar à caderneta" />}
      footer={
        <View style={styles.footer}>
          <Button label="Voltar à caderneta" icon="book-outline" onPress={onBackToCard} />
          <Button label="Registrar outra" icon="add" variant="secondary" onPress={onRegisterAnother} />
          <Button label="Voltar ao painel" icon="grid-outline" variant="link" onPress={onGoToPanel} />
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
          {isExisting ? 'Registro do cidadão confirmado!' : 'Vacinação confirmada!'}
        </Text>
        <Text style={[typography.muted, styles.center]}>
          {isExisting
            ? `O registro informado por ${citizenName} passou a constar como confirmado.`
            : `A dose foi registrada na caderneta de ${citizenName}.`}
        </Text>
      </View>

      <Card style={styles.review}>
        <VaccineHero name={vaccineName} detail={record.dose.doseName} />
        <Badge label="Confirmado" icon="checkmark-circle-outline" />
        <ReviewRow label="Cidadão" value={citizenName} />
        <ReviewRow label="Data de aplicação" value={formatCalendarDate(record.applicationDate)} />
        <ReviewRow label="Lote" value={record.lotNumber ?? '—'} />
        <ReviewRow label="Profissional" value={record.appliedBy?.name ?? professionalName} />
      </Card>

      <Banner
        tone="success"
        icon="notifications-off-outline"
        message={`A pendência de ${vaccineName} (${record.dose.doseName}) foi encerrada na caderneta.`}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  center: {
    textAlign: 'center',
  },
  footer: {
    gap: spacing.md,
  },
  small: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  citizen: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 2,
  },
  citizenName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.primaryDark,
  },
  form: {
    gap: spacing.lg,
  },
  pending: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pendingText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.warning,
  },
  readOnly: {
    gap: spacing.sm,
  },
  readOnlyLabel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: spacing.md,
  },
  readOnlyBox: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  review: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  sectionBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: spacing.md,
    rowGap: 2,
  },
  rowValue: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDark,
    textAlign: 'right',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.primaryDark,
  },
  outcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  success: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
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
});
