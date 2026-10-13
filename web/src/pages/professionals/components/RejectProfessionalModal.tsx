import React, { useId, useState } from 'react';
import { AlertCircle, AlertTriangle, Loader2, UserX } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { parseApiError } from '../../../services/auth';
import { rejectProfessional } from '../../../services/professionals';
import type { Professional } from '../../../types/professional';
import { ProfessionalSummary } from './ProfessionalSummary';

const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 500;

function validateReason(reason: string): string | null {
  if (reason && reason.length < REASON_MIN_LENGTH) {
    return `O motivo deve ter pelo menos ${REASON_MIN_LENGTH} caracteres, ou deixe o campo em branco.`;
  }
  return null;
}

interface RejectProfessionalModalProps {
  professional: Professional;
  onClose: () => void;
  onSuccess: (professional: Professional) => void;
  // 404/409: a lista exibida está desatualizada
  onOutdated: (message: string) => void;
}

// Recusa do registro profissional com motivo opcional (RS001). Em verificados, revoga o acesso
export const RejectProfessionalModal: React.FC<RejectProfessionalModalProps> = ({
  professional,
  onClose,
  onSuccess,
  onOutdated,
}) => {
  const fieldId = useId();
  const isVerified = professional.verificationStatus === 'VERIFICADO';

  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [revokeAcknowledged, setRevokeAcknowledged] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedReason = reason.trim();
  const canSubmit = !isSubmitting && (!isVerified || revokeAcknowledged);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validation = validateReason(trimmedReason);
    setReasonError(validation);
    if (validation || !canSubmit) return;

    setIsSubmitting(true);
    try {
      onSuccess(await rejectProfessional(professional.id, trimmedReason || undefined));
    } catch (error) {
      const parsed = parseApiError(error, 'Não foi possível recusar o profissional.');
      if (parsed.status === 404) {
        onOutdated('Profissional não encontrado. O cadastro pode ter sido removido.');
      } else if (parsed.status === 409) {
        onOutdated(`A recusa de ${professional.name} já foi registrada por outro administrador.`);
      } else {
        if (parsed.fieldErrors.reason) setReasonError(parsed.fieldErrors.reason);
        setSubmitError(parsed.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={isSubmitting ? () => undefined : onClose}
      title={isVerified ? 'Revogar verificação' : 'Recusar profissional'}
      maxWidth="max-w-[520px]"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <ProfessionalSummary professional={professional} />

        {isVerified && (
          <div className="flex flex-col gap-3 rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
            <p className="flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>
                Este profissional já está verificado. Ao recusar, a verificação é revogada e ele{' '}
                <span className="font-semibold">perderá o acesso às funções de profissional</span>, como a
                confirmação de vacinas. A conta continua ativa.
              </span>
            </p>
            <label className="flex items-start gap-2 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={revokeAcknowledged}
                disabled={isSubmitting}
                onChange={(event) => setRevokeAcknowledged(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-danger cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/30"
              />
              Entendo que o profissional perderá o acesso às funções de profissional.
            </label>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldId}-reason`} className="text-sm font-semibold text-primary-dark">
            Motivo <span className="font-normal text-muted">(opcional)</span>
          </label>
          <textarea
            id={`${fieldId}-reason`}
            rows={4}
            maxLength={REASON_MAX_LENGTH}
            placeholder="Ex.: registro não localizado no site do conselho."
            value={reason}
            disabled={isSubmitting}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(null);
            }}
            aria-invalid={reasonError ? true : undefined}
            aria-describedby={`${fieldId}-reason-hint`}
            className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-primary-dark placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${
              reasonError ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
            }`}
          />
          <p id={`${fieldId}-reason-hint`} className={`text-xs ${reasonError ? 'text-danger' : 'text-muted'}`}>
            {reasonError ??
              `De ${REASON_MIN_LENGTH} a ${REASON_MAX_LENGTH} caracteres (${reason.length}/${REASON_MAX_LENGTH}).`}
          </p>
        </div>

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
            disabled={!canSubmit}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-danger px-6 text-sm font-semibold text-white hover:bg-danger/90 active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <UserX className="size-4" />}
            {isSubmitting ? 'Recusando...' : isVerified ? 'Revogar e recusar' : 'Recusar profissional'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectProfessionalModal;
