import React, { useState } from 'react';
import { AlertCircle, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { parseApiError } from '../../../services/auth';
import { verifyProfessional } from '../../../services/professionals';
import type { Professional } from '../../../types/professional';
import { getCouncilInfo } from '../../../utils/councils';
import { ProfessionalSummary } from './ProfessionalSummary';

interface VerifyProfessionalDialogProps {
  professional: Professional;
  onClose: () => void;
  onSuccess: (professional: Professional) => void;
  // 404/409: a lista exibida está desatualizada
  onOutdated: (message: string) => void;
}

// Confirmação da verificação manual do registro profissional (RS001)
export const VerifyProfessionalDialog: React.FC<VerifyProfessionalDialogProps> = ({
  professional,
  onClose,
  onSuccess,
  onOutdated,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const council = getCouncilInfo(professional.registry.council);
  const isRejected = professional.verificationStatus === 'RECUSADO';

  const handleConfirm = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      onSuccess(await verifyProfessional(professional.id));
    } catch (error) {
      const parsed = parseApiError(error, 'Não foi possível verificar o profissional.');
      if (parsed.status === 404) {
        onOutdated('Profissional não encontrado. O cadastro pode ter sido removido.');
      } else if (parsed.status === 409) {
        onOutdated(`${professional.name} já foi verificado(a) por outro administrador.`);
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
      title="Verificar profissional"
      maxWidth="max-w-[520px]"
    >
      <div className="flex flex-col gap-5">
        <ProfessionalSummary professional={professional} />

        <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning-soft p-4 text-sm text-warning">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <p>
              Antes de confirmar, consulte o registro{' '}
              <span className="font-semibold">
                {professional.registry.registryNumber}/{professional.registry.uf}
              </span>{' '}
              no site oficial do conselho e confira se o nome e a situação estão corretos.
            </p>
            {council ? (
              <a
                href={council.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 self-start font-semibold underline underline-offset-2 hover:text-primary-dark rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {council.name}
                <ExternalLink className="size-4" />
              </a>
            ) : (
              <p className="font-semibold">Conselho informado: {professional.registry.council}</p>
            )}
          </div>
        </div>

        {isRejected && (
          <p className="text-sm text-muted">
            Este registro foi recusado anteriormente. Ao verificar, a recusa é desfeita e o profissional passa a ter
            acesso às funções de profissional.
          </p>
        )}

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
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {isSubmitting ? 'Verificando...' : 'Registro conferido, verificar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default VerifyProfessionalDialog;
