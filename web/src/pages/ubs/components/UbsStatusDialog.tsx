import React, { useState } from 'react';
import { AlertCircle, Info, Loader2, Power, PowerOff } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { parseApiError } from '../../../services/auth';
import { setUbsStatus } from '../../../services/ubs';
import type { Ubs } from '../../../types/ubs';
import { formatUbsAddress } from '../utils';

interface UbsStatusDialogProps {
  ubs: Ubs;
  onClose: () => void;
  onSuccess: (ubs: Ubs) => void;
  // 404: a UBS não existe mais
  onOutdated: (message: string) => void;
}

// Confirmação para desativar ou reativar uma UBS. A UBS nunca é excluída (D10)
export const UbsStatusDialog: React.FC<UbsStatusDialogProps> = ({ ubs, onClose, onSuccess, onOutdated }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const willDeactivate = ubs.isActive;

  const handleConfirm = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      onSuccess(await setUbsStatus(ubs.id, !willDeactivate));
    } catch (error) {
      const parsed = parseApiError(
        error,
        willDeactivate ? 'Não foi possível desativar a UBS.' : 'Não foi possível reativar a UBS.'
      );
      if (parsed.status === 404) {
        onOutdated('A UBS não foi encontrada. A lista foi atualizada.');
      } else {
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
      title={willDeactivate ? 'Desativar UBS' : 'Reativar UBS'}
      maxWidth="max-w-[500px]"
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="font-semibold text-primary-dark">{ubs.name}</p>
          <p className="text-sm text-muted">{formatUbsAddress(ubs)}</p>
        </div>

        {willDeactivate ? (
          <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning-soft p-4 text-sm text-warning">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p>A UBS deixará de aparecer no aplicativo, mas o histórico de vacinações registradas nela será mantido.</p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl bg-surface p-4 text-sm text-primary-dark">
            <Info className="size-4 shrink-0 mt-0.5 text-primary" />
            <p>A UBS voltará a aparecer no aplicativo para os cidadãos.</p>
          </div>
        )}

        {submitError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm text-danger"
          >
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
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 disabled:opacity-50 ${
              willDeactivate
                ? 'bg-danger hover:bg-danger/90 focus:ring-danger/30'
                : 'bg-primary hover:bg-primary-dark focus:ring-primary/30'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : willDeactivate ? (
              <PowerOff className="size-4" />
            ) : (
              <Power className="size-4" />
            )}
            {isSubmitting
              ? willDeactivate
                ? 'Desativando...'
                : 'Reativando...'
              : willDeactivate
                ? 'Desativar UBS'
                : 'Reativar UBS'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UbsStatusDialog;
