import React, { useId, useState } from 'react';
import {
  AlertCircle,
  Baby,
  Info,
  Loader2,
  Plus,
  Save,
  ShieldPlus,
  Syringe,
  Timer,
  Trash2,
  Type,
} from 'lucide-react';
import { FormField, FormSelect } from '../../../components/ui/FormField';
import { Modal } from '../../../components/ui/Modal';
import { parseApiError } from '../../../services/auth';
import { createVaccine, updateVaccine } from '../../../services/vaccines';
import type {
  DosePayload,
  TargetAudience,
  Vaccine,
  VaccinePayload,
  VaccineUpdatePayload,
} from '../../../types/vaccination';
import { onlyDigits } from '../../../utils/format';
import { TARGET_AUDIENCE_OPTIONS, formatInterval, formatRecommendedAge, isTargetAudience } from '../utils';
import { DoseSchedule } from './DoseSchedule';

interface VaccineFormModalProps {
  // Sem `vaccine`, o modal cadastra uma nova vacina
  vaccine?: Vaccine;
  onClose: () => void;
  onSuccess: (vaccine: Vaccine, mode: 'created' | 'updated') => void;
  // 404: a vacina editada não existe mais
  onOutdated: (message: string) => void;
}

interface DoseDraft {
  key: number;
  doseName: string;
  recommendedAgeMonths: string;
  intervalDays: string;
  description: string;
}

interface FormValues {
  name: string;
  targetDisease: string;
  targetAudience: TargetAudience | '';
  description: string;
  doses: DoseDraft[];
}

type TextFieldName = 'name' | 'targetDisease' | 'description';
type DoseFieldName = keyof Omit<DoseDraft, 'key'>;
// Chaves: nomes dos campos e caminhos das doses no formato da API ("doses.0.doseName")
type FieldErrors = Record<string, string>;

const NAME_MAX_LENGTH = 100;
const DISEASE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 500;
const DOSE_NAME_MAX_LENGTH = 60;
const DOSE_DESCRIPTION_MAX_LENGTH = 200;
// Idade em meses (até 100 anos) e intervalo em dias (até 10 anos)
const AGE_MAX_MONTHS = 1200;
const INTERVAL_MAX_DAYS = 3650;
const GENERIC_ERROR = 'Não foi possível salvar a vacina. Tente novamente.';

// Campo do formulário de dose ↔ campo da dose na API
const DOSE_API_FIELDS: Record<DoseFieldName, keyof DosePayload> = {
  doseName: 'doseName',
  recommendedAgeMonths: 'recommendedAgeMonths',
  intervalDays: 'intervalDaysFromPrevious',
  description: 'description',
};
const FORM_FIELD_NAMES = new Set(['name', 'targetDisease', 'targetAudience', 'description', 'dosesCount', 'doses']);

let nextDoseKey = 0;

function createDoseDraft(index: number): DoseDraft {
  nextDoseKey += 1;
  return {
    key: nextDoseKey,
    doseName: index === 0 ? '1ª Dose' : `${index + 1}ª Dose`,
    recommendedAgeMonths: '',
    intervalDays: '',
    description: '',
  };
}

function toFormValues(vaccine?: Vaccine): FormValues {
  return {
    name: vaccine?.name ?? '',
    targetDisease: vaccine?.targetDisease ?? '',
    targetAudience: vaccine?.targetAudience ?? '',
    description: vaccine?.description ?? '',
    doses: vaccine ? [] : [createDoseDraft(0)],
  };
}

function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function doseErrorKey(index: number, field: keyof DosePayload): string {
  return `doses.${index}.${field}`;
}

function parseOptionalInt(value: string): number | null {
  return value ? Number(value) : null;
}

function validateForm(values: FormValues, isEditing: boolean): FieldErrors {
  const errors: FieldErrors = {};

  if (collapseSpaces(values.name).length < 2) errors.name = 'Informe o nome da vacina.';
  if (collapseSpaces(values.targetDisease).length < 2) errors.targetDisease = 'Informe a doença prevenida.';
  if (!values.targetAudience) errors.targetAudience = 'Selecione o público-alvo.';

  if (!isEditing) {
    if (values.doses.length === 0) errors.doses = 'Cadastre ao menos uma dose.';

    values.doses.forEach((dose, index) => {
      if (!dose.doseName.trim()) errors[doseErrorKey(index, 'doseName')] = 'Informe o nome da dose.';

      const age = parseOptionalInt(dose.recommendedAgeMonths);
      if (age !== null && age > AGE_MAX_MONTHS) {
        errors[doseErrorKey(index, 'recommendedAgeMonths')] = `Use até ${AGE_MAX_MONTHS} meses.`;
      }

      const interval = parseOptionalInt(dose.intervalDays);
      if (interval !== null && (interval < 1 || interval > INTERVAL_MAX_DAYS)) {
        errors[doseErrorKey(index, 'intervalDaysFromPrevious')] = `Use de 1 a ${INTERVAL_MAX_DAYS} dias.`;
      }
    });

    const names = values.doses.map((dose) => collapseSpaces(dose.doseName).toLowerCase());
    names.forEach((name, index) => {
      if (name && names.indexOf(name) !== index) {
        errors[doseErrorKey(index, 'doseName')] = 'Já existe uma dose com este nome.';
      }
    });
  }

  return errors;
}

function buildDoses(doses: DoseDraft[]): DosePayload[] {
  return doses.map((dose, index) => ({
    doseNumber: index + 1,
    doseName: collapseSpaces(dose.doseName),
    recommendedAgeMonths: parseOptionalInt(dose.recommendedAgeMonths),
    // A primeira dose não tem dose anterior
    intervalDaysFromPrevious: index === 0 ? null : parseOptionalInt(dose.intervalDays),
    description: dose.description.trim() || null,
  }));
}

// Chamado só depois de validateForm: o público-alvo já foi escolhido
function buildPayload(values: FormValues): VaccinePayload {
  const doses = buildDoses(values.doses);
  return {
    name: collapseSpaces(values.name),
    targetDisease: collapseSpaces(values.targetDisease),
    targetAudience: values.targetAudience || 'CRIANCA',
    description: values.description.trim() || undefined,
    dosesCount: doses.length,
    doses,
  };
}

// No PUT, envia só os campos alterados. Descrição apagada vira "" para ser removida
function buildChanges(values: FormValues, vaccine: Vaccine): VaccineUpdatePayload {
  const changes: VaccineUpdatePayload = {};
  const name = collapseSpaces(values.name);
  const targetDisease = collapseSpaces(values.targetDisease);
  const description = values.description.trim();

  if (name !== vaccine.name) changes.name = name;
  if (targetDisease !== vaccine.targetDisease) changes.targetDisease = targetDisease;
  if (values.targetAudience && values.targetAudience !== vaccine.targetAudience) {
    changes.targetAudience = values.targetAudience;
  }
  if (description !== (vaccine.description ?? '')) changes.description = description;
  return changes;
}

// Cadastro e edição de vacina pelo ADMIN. As doses só são definidas no cadastro (o PUT não aceita doses)
export const VaccineFormModal: React.FC<VaccineFormModalProps> = ({ vaccine, onClose, onSuccess, onOutdated }) => {
  const isEditing = !!vaccine;
  const fieldId = useId();
  const [values, setValues] = useState<FormValues>(() => toFormValues(vaccine));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearErrors = (keys: string[]) => {
    setFieldErrors((prev) => {
      if (!keys.some((key) => prev[key])) return prev;
      const next = { ...prev };
      for (const key of keys) delete next[key];
      return next;
    });
  };

  const setField = (field: TextFieldName, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    clearErrors([field]);
  };

  const setDoseField = (index: number, field: DoseFieldName, value: string) => {
    setValues((prev) => ({
      ...prev,
      doses: prev.doses.map((dose, current) => (current === index ? { ...dose, [field]: value } : dose)),
    }));
    clearErrors([doseErrorKey(index, DOSE_API_FIELDS[field])]);
  };

  // Ao adicionar ou remover, os erros das doses mudariam de índice: são limpos e refeitos no envio
  const clearDoseErrors = () => {
    setFieldErrors((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => key !== 'doses' && !key.startsWith('doses.')))
    );
  };

  const addDose = () => {
    setValues((prev) => ({ ...prev, doses: [...prev.doses, createDoseDraft(prev.doses.length)] }));
    clearDoseErrors();
  };

  // Só remove linhas do rascunho, antes de a vacina ser cadastrada
  const removeDose = (index: number) => {
    setValues((prev) => ({ ...prev, doses: prev.doses.filter((_, current) => current !== index) }));
    clearDoseErrors();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBannerError(null);

    const errors = validateForm(values, isEditing);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setBannerError('Confira os campos destacados.');
      return;
    }

    let changes: VaccineUpdatePayload | null = null;
    if (vaccine) {
      changes = buildChanges(values, vaccine);
      if (Object.keys(changes).length === 0) {
        setBannerError('Nenhuma alteração para salvar.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (vaccine && changes) {
        onSuccess(await updateVaccine(vaccine.id, changes), 'updated');
      } else {
        onSuccess(await createVaccine(buildPayload(values)), 'created');
      }
    } catch (error) {
      const parsed = parseApiError(error, GENERIC_ERROR);

      if (parsed.status === 404) {
        onOutdated('A vacina não foi encontrada. A lista foi atualizada.');
      } else if (parsed.status === 409) {
        setFieldErrors({ name: 'Já existe uma vacina com este nome.' });
        setBannerError(parsed.message);
      } else if (parsed.status === 400 && Object.keys(parsed.fieldErrors).length > 0) {
        const mapped: FieldErrors = {};
        const unmapped: string[] = [];
        for (const [path, message] of Object.entries(parsed.fieldErrors)) {
          if (FORM_FIELD_NAMES.has(path) || path.startsWith('doses.')) mapped[path] = message;
          else unmapped.push(message);
        }
        // dosesCount é calculado: o erro aparece junto das doses
        if (mapped.dosesCount) {
          mapped.doses = mapped.doses ?? mapped.dosesCount;
          delete mapped.dosesCount;
        }
        setFieldErrors(mapped);
        setBannerError(unmapped.length > 0 ? unmapped.join(' ') : 'Confira os campos destacados.');
      } else {
        setBannerError(parsed.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionTitleClasses = 'text-xs font-semibold uppercase tracking-wide text-muted';
  const descriptionError = fieldErrors.description;

  const renderDoseEditor = () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 rounded-xl bg-surface p-3 text-xs text-primary-dark">
        <Info className="size-4 shrink-0 text-primary" />
        <p>
          Confira o esquema antes de salvar: depois do cadastro, as doses não podem ser alteradas nem removidas, porque
          ficam ligadas aos registros de vacinação das cadernetas.
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {values.doses.map((dose, index) => {
          const ageMonths = parseOptionalInt(dose.recommendedAgeMonths);
          const intervalDays = parseOptionalInt(dose.intervalDays);
          const prefix = `${fieldId}-dose-${dose.key}`;
          return (
            <li key={dose.key} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-primary-dark">Dose {index + 1}</p>
                {values.doses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDose(index)}
                    aria-label={`Remover a dose ${index + 1} do rascunho`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-danger hover:bg-danger-soft cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/30"
                  >
                    <Trash2 className="size-4" />
                    Remover
                  </button>
                )}
              </div>
              <FormField
                id={`${prefix}-name`}
                label="Nome da dose"
                icon={Syringe}
                type="text"
                maxLength={DOSE_NAME_MAX_LENGTH}
                value={dose.doseName}
                onChange={(e) => setDoseField(index, 'doseName', e.target.value)}
                placeholder="Ex.: 1ª Dose, Reforço, Dose Única"
                error={fieldErrors[doseErrorKey(index, 'doseName')]}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  id={`${prefix}-age`}
                  label="Idade recomendada (meses, opcional)"
                  icon={Baby}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={dose.recommendedAgeMonths}
                  onChange={(e) => setDoseField(index, 'recommendedAgeMonths', onlyDigits(e.target.value))}
                  placeholder="Ex.: 2"
                  error={fieldErrors[doseErrorKey(index, 'recommendedAgeMonths')]}
                  hint={ageMonths !== null ? formatRecommendedAge(ageMonths) : 'Use 0 para “Ao nascer”.'}
                />
                {index === 0 ? (
                  <div className="text-xs text-muted sm:pt-8">A primeira dose não tem intervalo desde a anterior.</div>
                ) : (
                  <FormField
                    id={`${prefix}-interval`}
                    label="Intervalo desde a anterior (dias, opcional)"
                    icon={Timer}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    value={dose.intervalDays}
                    onChange={(e) => setDoseField(index, 'intervalDays', onlyDigits(e.target.value))}
                    placeholder="Ex.: 60"
                    error={fieldErrors[doseErrorKey(index, 'intervalDaysFromPrevious')]}
                    hint={intervalDays !== null ? formatInterval(intervalDays) : undefined}
                  />
                )}
              </div>
              <FormField
                id={`${prefix}-description`}
                label="Observação (opcional)"
                icon={Type}
                type="text"
                maxLength={DOSE_DESCRIPTION_MAX_LENGTH}
                value={dose.description}
                onChange={(e) => setDoseField(index, 'description', e.target.value)}
                placeholder="Ex.: Aplicada preferencialmente ao nascer"
                error={fieldErrors[doseErrorKey(index, 'description')]}
              />
            </li>
          );
        })}
      </ol>

      {fieldErrors.doses && (
        <p className="text-xs text-danger font-medium flex items-center gap-1">
          <AlertCircle className="size-3.5 shrink-0" />
          {fieldErrors.doses}
        </p>
      )}

      <button
        type="button"
        onClick={addDose}
        className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-dashed border-primary/50 px-4 text-sm font-semibold text-primary hover:bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <Plus className="size-4" />
        Adicionar dose
      </button>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={isSubmitting ? () => undefined : onClose}
      title={isEditing ? 'Editar vacina' : 'Nova vacina'}
      maxWidth="max-w-[640px]"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {bannerError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm text-danger"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            {bannerError}
          </p>
        )}

        <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
          <legend className={`${sectionTitleClasses} mb-3`}>Identificação</legend>
          <FormField
            id={`${fieldId}-name`}
            label="Nome"
            icon={Syringe}
            type="text"
            maxLength={NAME_MAX_LENGTH}
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Ex.: Pentavalente (DTP/HB/Hib)"
            error={fieldErrors.name}
          />
          <FormField
            id={`${fieldId}-disease`}
            label="Doença prevenida"
            icon={ShieldPlus}
            type="text"
            maxLength={DISEASE_MAX_LENGTH}
            value={values.targetDisease}
            onChange={(e) => setField('targetDisease', e.target.value)}
            placeholder="Ex.: Difteria, Tétano e Coqueluche"
            error={fieldErrors.targetDisease}
          />
          <div className="sm:max-w-[50%] sm:pr-2">
            <FormSelect
              id={`${fieldId}-audience`}
              label="Público-alvo"
              placeholder="Selecione"
              options={TARGET_AUDIENCE_OPTIONS}
              value={values.targetAudience}
              onChange={(e) => {
                const value = e.target.value;
                if (!isTargetAudience(value)) return;
                setValues((prev) => ({ ...prev, targetAudience: value }));
                clearErrors(['targetAudience']);
              }}
              error={fieldErrors.targetAudience}
            />
          </div>
          <div className="w-full">
            <label htmlFor={`${fieldId}-description`} className="block text-sm font-semibold text-primary-dark mb-1.5">
              Descrição (opcional)
            </label>
            <textarea
              id={`${fieldId}-description`}
              rows={3}
              maxLength={DESCRIPTION_MAX_LENGTH}
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Ex.: Previne as formas graves de tuberculose."
              aria-invalid={!!descriptionError}
              aria-describedby={descriptionError ? `${fieldId}-description-error` : undefined}
              className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-base text-primary-dark placeholder:text-muted/70 focus:outline-none disabled:opacity-50 ${
                descriptionError
                  ? 'border-danger ring-2 ring-danger/15'
                  : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
            {descriptionError ? (
              <p
                id={`${fieldId}-description-error`}
                className="mt-1.5 text-xs text-danger font-medium flex items-center gap-1"
              >
                <AlertCircle className="size-3.5 shrink-0" />
                {descriptionError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-muted">
                {values.description.length}/{DESCRIPTION_MAX_LENGTH} caracteres
              </p>
            )}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
          <legend className={`${sectionTitleClasses} mb-3`}>
            Esquema de doses{vaccine ? ` (${vaccine.doses.length})` : ''}
          </legend>
          {vaccine ? (
            <>
              <div className="flex items-start gap-2 rounded-xl bg-surface p-3 text-xs text-primary-dark">
                <Info className="size-4 shrink-0 text-primary" />
                <p>
                  As doses não podem ser alteradas nem removidas depois do cadastro, porque estão ligadas aos registros
                  de vacinação das cadernetas.
                </p>
              </div>
              <DoseSchedule doses={vaccine.doses} />
            </>
          ) : (
            renderDoseEditor()
          )}
        </fieldset>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-12 rounded-xl border border-border px-5 text-sm font-semibold text-primary-dark hover:bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar vacina'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VaccineFormModal;
