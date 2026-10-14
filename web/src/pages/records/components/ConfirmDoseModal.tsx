import React, { useId, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CalendarDays, Loader2, ShieldCheck, Syringe, UserRound } from 'lucide-react';
import { CardError, CardLoading } from '../../../components/ui/CardState';
import { Modal } from '../../../components/ui/Modal';
import type { UseAsyncResult } from '../../../hooks/useAsync';
import { parseApiError } from '../../../services/auth';
import { confirmDose } from '../../../services/vaccinationRecords';
import type { CardRecord, CardVaccine, ConfirmDoseResult, Vaccine } from '../../../types/vaccination';
import { formatCalendarDate, formatDate } from '../../../utils/format';

const LOT_MAX_LENGTH = 20;
const LOT_PATTERN = /^[A-Z0-9]+$/;
const INACTIVE_VACCINE_MESSAGE =
  'Esta vacina foi desativada no catálogo e não aceita novas confirmações. Os registros já existentes continuam na caderneta.';

const SELECT_CLASSES =
  'w-full h-12 rounded-xl border bg-white px-4 text-sm text-primary-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-50 cursor-pointer';

export interface PendingRecord {
  vaccineId: string;
  vaccineName: string;
  record: CardRecord;
}

interface ConfirmDoseModalProps {
  citizen: { id: string; name: string };
  cardVaccines: CardVaccine[];
  catalog: UseAsyncResult<Vaccine[]>;
  // Vacina sugerida ao abrir (botão da caderneta); null abre o registro de qualquer vacina
  initialVaccineId: string | null;
  // Registro do cidadão aguardando confirmação: vacina e dose ficam fixas (RF007 nota 7)
  pendingRecord?: PendingRecord | null;
  professionalName: string;
  onClose: () => void;
  onSuccess: (result: ConfirmDoseResult) => void;
  // 409: a caderneta exibida está desatualizada
  onConflict: () => void;
}

function sanitizeLot(value: string): string {
  return value.toUpperCase().slice(0, LOT_MAX_LENGTH);
}

function validateLot(lot: string): string | null {
  if (!lot) return 'Informe o lote da vacina.';
  if (!LOT_PATTERN.test(lot)) return 'Use apenas letras e números, sem espaços ou símbolos.';
  return null;
}

// Modal de confirmação presencial (RF010). Vacina e dose vêm sugeridas e podem ser alteradas (notas 2 e 3)
export const ConfirmDoseModal: React.FC<ConfirmDoseModalProps> = ({
  citizen,
  cardVaccines,
  catalog,
  initialVaccineId,
  pendingRecord = null,
  professionalName,
  onClose,
  onSuccess,
  onConflict,
}) => {
  const fieldId = useId();
  // Data da confirmação: definida pela API no envio, exibida só para conferência
  const [todayIso] = useState(() => new Date().toISOString());
  const today = formatDate(todayIso);

  const cardByVaccineId = useMemo(
    () => new Map(cardVaccines.map((item) => [item.vaccine.id, item])),
    [cardVaccines]
  );

  // Status dos registros já existentes, por dose
  const recordStatusByDoseId = useMemo(() => {
    const map = new Map<string, 'CONFIRMADO' | 'PENDENTE'>();
    for (const item of cardVaccines) {
      for (const record of item.records) {
        if (record.status === 'CONFIRMADO') map.set(record.dose.id, 'CONFIRMADO');
        else if (!map.has(record.dose.id)) map.set(record.dose.id, 'PENDENTE');
      }
    }
    return map;
  }, [cardVaccines]);

  const vaccines = useMemo(
    () => [...(catalog.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [catalog.data]
  );
  const pendingVaccines = vaccines.filter((vaccine) => {
    const status = cardByVaccineId.get(vaccine.id)?.status;
    return status === 'ATRASADA' || status === 'EM_DIA';
  });
  const otherVaccines = vaccines.filter((vaccine) => !pendingVaccines.includes(vaccine));

  // Sugestão de dose: a próxima prevista na caderneta ou a primeira ainda não confirmada
  const suggestDoseId = (vaccineId: string): string => {
    const nextDoseId = cardByVaccineId.get(vaccineId)?.nextDose?.id;
    if (nextDoseId) return nextDoseId;
    const doses = vaccines.find((vaccine) => vaccine.id === vaccineId)?.doses ?? [];
    return doses.find((dose) => recordStatusByDoseId.get(dose.id) !== 'CONFIRMADO')?.id ?? '';
  };

  const [vaccineId, setVaccineId] = useState(pendingRecord?.vaccineId ?? initialVaccineId ?? '');
  // null = segue a sugestão; preenchido quando o profissional escolhe outra dose
  const [chosenDoseId, setChosenDoseId] = useState<string | null>(pendingRecord?.record.dose.id ?? null);
  const [lot, setLot] = useState(() => sanitizeLot(pendingRecord?.record.lotNumber ?? ''));
  const [lotError, setLotError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVaccine = vaccines.find((vaccine) => vaccine.id === vaccineId) ?? null;
  // Vacina desativada: some do catálogo, mas os registros continuam na caderneta
  const isVaccineInactive = !!vaccineId && !!catalog.data && !selectedVaccine;
  const doses = selectedVaccine?.doses ?? [];
  const doseId = chosenDoseId ?? (vaccineId ? suggestDoseId(vaccineId) : '');
  const suggestedDoseId = vaccineId ? suggestDoseId(vaccineId) : '';
  const selectedDoseStatus = doseId ? recordStatusByDoseId.get(doseId) : undefined;

  // Aviso, sem bloqueio, para a próxima dose confirmada antes da data prevista (dia em UTC, como na API)
  const cardItem = cardByVaccineId.get(vaccineId);
  const earlyDoseDate =
    !pendingRecord &&
    cardItem?.nextDose?.id === doseId &&
    cardItem.nextDoseDate &&
    cardItem.nextDoseDate.slice(0, 10) > todayIso.slice(0, 10)
      ? cardItem.nextDoseDate
      : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const lotValidation = validateLot(lot);
    setLotError(lotValidation);
    if (isVaccineInactive) {
      setSubmitError(INACTIVE_VACCINE_MESSAGE);
      return;
    }
    if (!vaccineId || !doseId) {
      setSubmitError('Selecione a vacina e a dose aplicada.');
      return;
    }
    if (lotValidation) return;

    setIsSubmitting(true);
    try {
      const result = await confirmDose({ citizenId: citizen.id, vaccineId, doseId, lote: lot });
      onSuccess(result);
    } catch (error) {
      const parsed = parseApiError(error, 'Não foi possível confirmar a dose.');
      if (parsed.status === 409) {
        setSubmitError('Esta dose já foi confirmada.');
        onConflict();
      } else {
        if (parsed.fieldErrors.lote) setLotError(parsed.fieldErrors.lote);
        setSubmitError(parsed.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Registro do cidadão: vacina e dose fixas, sem depender do catálogo
  const renderPendingRecord = ({ vaccineName, record }: PendingRecord) => (
    <div className="flex flex-col gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4 text-sm">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Vacina</dt>
          <dd className="font-semibold text-primary-dark">{vaccineName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Dose</dt>
          <dd className="font-semibold text-primary-dark">{record.dose.doseName}</dd>
        </div>
      </dl>
      <p className="text-xs text-warning">
        Registrado pelo cidadão
        {record.applicationDate ? ` com aplicação em ${formatDate(record.applicationDate)}` : ''}. Ao confirmar, o
        registro passa a constar como confirmado e a data de aplicação é mantida.
      </p>
    </div>
  );

  const renderSelection = () => (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${fieldId}-vaccine`} className="text-sm font-semibold text-primary-dark">
          Vacina
        </label>
        <select
          id={`${fieldId}-vaccine`}
          value={selectedVaccine ? vaccineId : ''}
          disabled={isSubmitting}
          onChange={(event) => {
            setVaccineId(event.target.value);
            setChosenDoseId(null);
            setSubmitError(null);
          }}
          className={`${SELECT_CLASSES} border-input`}
        >
          <option value="" disabled>
            Selecione a vacina
          </option>
          {pendingVaccines.length > 0 && (
            <optgroup label="Pendentes na caderneta">
              {pendingVaccines.map((vaccine) => (
                <option key={vaccine.id} value={vaccine.id}>
                  {vaccine.name}
                  {cardByVaccineId.get(vaccine.id)?.status === 'ATRASADA' ? ' (atrasada)' : ''}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={pendingVaccines.length > 0 ? 'Demais vacinas' : 'Vacinas'}>
            {otherVaccines.map((vaccine) => (
              <option key={vaccine.id} value={vaccine.id}>
                {vaccine.name}
              </option>
            ))}
          </optgroup>
        </select>
        {selectedVaccine && <p className="text-xs text-muted">Previne: {selectedVaccine.targetDisease}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${fieldId}-dose`} className="text-sm font-semibold text-primary-dark">
          Dose
        </label>
        <select
          id={`${fieldId}-dose`}
          value={doseId}
          disabled={!selectedVaccine || isSubmitting}
          onChange={(event) => {
            setChosenDoseId(event.target.value);
            setSubmitError(null);
          }}
          className={`${SELECT_CLASSES} border-input`}
        >
          <option value="" disabled>
            {selectedVaccine ? 'Selecione a dose' : 'Escolha a vacina primeiro'}
          </option>
          {doses.map((dose) => {
            const status = recordStatusByDoseId.get(dose.id);
            return (
              <option key={dose.id} value={dose.id} disabled={status === 'CONFIRMADO'}>
                {dose.doseName}
                {dose.id === suggestedDoseId ? ' (sugerida)' : ''}
                {status === 'CONFIRMADO' ? ' (já confirmada)' : ''}
                {status === 'PENDENTE' ? ' (registrada pelo cidadão)' : ''}
              </option>
            );
          })}
        </select>
        {selectedDoseStatus === 'PENDENTE' && (
          <p className="text-xs text-muted">
            O cidadão já registrou esta dose. Ao confirmar, o registro dele passa a ser confirmado.
          </p>
        )}
      </div>

      {earlyDoseDate && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning-soft p-3 text-sm text-warning"
        >
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          Esta dose está sendo registrada antes do prazo recomendado ({formatCalendarDate(earlyDoseDate)}). Confira
          se a dose selecionada está correta.
        </p>
      )}
    </>
  );

  const renderForm = () => {
    if (!pendingRecord) {
      if (catalog.isLoading) return <CardLoading label="Carregando vacinas..." />;
      if (catalog.error) return <CardError message={catalog.error.message} onRetry={catalog.reload} />;
    }

    return (
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {isVaccineInactive && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning-soft p-3 text-sm text-warning"
          >
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            {INACTIVE_VACCINE_MESSAGE}
          </p>
        )}
        {pendingRecord ? renderPendingRecord(pendingRecord) : renderSelection()}

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldId}-lot`} className="text-sm font-semibold text-primary-dark">
            Lote
          </label>
          <input
            id={`${fieldId}-lot`}
            type="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={LOT_MAX_LENGTH}
            placeholder="Ex.: 210A23"
            value={lot}
            disabled={isSubmitting}
            onChange={(event) => {
              setLot(sanitizeLot(event.target.value));
              setLotError(null);
            }}
            aria-invalid={lotError ? true : undefined}
            aria-describedby={`${fieldId}-lot-hint`}
            className={`w-full h-12 rounded-xl border bg-white px-4 text-sm uppercase tracking-wide text-primary-dark placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${
              lotError ? 'border-danger focus:border-danger' : 'border-input focus:border-primary'
            }`}
          />
          <p id={`${fieldId}-lot-hint`} className={`text-xs ${lotError ? 'text-danger' : 'text-muted'}`}>
            {lotError ?? `Letras e números, até ${LOT_MAX_LENGTH} caracteres (${lot.length}/${LOT_MAX_LENGTH}).`}
          </p>
        </div>

        <dl className="grid gap-3 rounded-xl bg-surface p-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <CalendarDays className="size-4 shrink-0 mt-0.5 text-primary" />
            <div>
              <dt className="text-xs text-muted">Data da aplicação</dt>
              <dd className="font-semibold text-primary-dark">{today}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="size-4 shrink-0 mt-0.5 text-primary" />
            <div className="min-w-0">
              <dt className="text-xs text-muted">Profissional responsável</dt>
              <dd className="font-semibold text-primary-dark truncate">{professionalName}</dd>
            </div>
          </div>
        </dl>

        {submitError && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            {submitError}
          </p>
        )}

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
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Syringe className="size-4" />}
            {isSubmitting ? 'Confirmando...' : 'Confirmar dose'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <Modal isOpen onClose={isSubmitting ? () => undefined : onClose} title="Confirmar dose" maxWidth="max-w-[560px]">
      <p className="-mt-3 mb-5 flex items-center gap-2 text-sm text-muted">
        <UserRound className="size-4 shrink-0 text-primary" />
        <span className="truncate">
          Cidadão: <span className="font-semibold text-primary-dark">{citizen.name}</span>
        </span>
      </p>
      {renderForm()}
    </Modal>
  );
};

export default ConfirmDoseModal;
