import React, { useState } from 'react';
import { AlertCircle, Info, Loader2, Power, PowerOff } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { parseApiError } from '../../../services/auth';
import { setUserStatus } from '../../../services/users';
import type { ManagedUser, UpdatedUser } from '../../../types/user';
import { getRoleLabel } from '../utils';

interface UserStatusDialogProps {
  user: ManagedUser;
  onClose: () => void;
  onSuccess: (user: UpdatedUser) => void;
  // 404: o usuário não existe mais
  onOutdated: (message: string) => void;
}

// Confirmação para desativar ou reativar uma conta. Usuários nunca são excluídos: os registros de vacinação apontam para eles
export const UserStatusDialog: React.FC<UserStatusDialogProps> = ({ user, onClose, onSuccess, onOutdated }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const willDeactivate = user.isActive;

  const handleConfirm = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      onSuccess(await setUserStatus(user.id, !willDeactivate));
    } catch (error) {
      const parsed = parseApiError(
        error,
        willDeactivate ? 'Não foi possível desativar a conta.' : 'Não foi possível reativar a conta.'
      );
      if (parsed.status === 404) {
        onOutdated('O usuário não foi encontrado. A lista foi atualizada.');
      } else if (parsed.status === 403) {
        setSubmitError('Você não tem permissão para alterar esta conta. Apenas administradores podem fazer isso.');
      } else if (parsed.status === 400) {
        setSubmitError(`Os dados enviados foram recusados pela API: ${parsed.message}`);
      } else if (parsed.status === 409) {
        setSubmitError(`A conta não pôde ser alterada por um conflito: ${parsed.message}`);
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
      title={willDeactivate ? 'Desativar conta' : 'Reativar conta'}
      maxWidth="max-w-[500px]"
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="font-semibold text-primary-dark break-words">{user.name}</p>
          <p className="text-sm text-muted break-all">{user.email}</p>
          <p className="text-sm text-muted">{getRoleLabel(user.role)}</p>
        </div>

        {willDeactivate ? (
          <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning-soft p-4 text-sm text-warning">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1.5">
              <p>
                O usuário perderá o acesso imediatamente: as sessões abertas serão encerradas e ele não conseguirá
                entrar no aplicativo nem no Gerenciador Web enquanto a conta estiver desativada.
              </p>
              <p>Os dados cadastrais e os registros de vacinação são mantidos, e a conta pode ser reativada depois.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl bg-surface p-4 text-sm text-primary-dark">
            <Info className="size-4 shrink-0 mt-0.5 text-primary" />
            <p>O usuário voltará a conseguir entrar com o e-mail e a senha que já usava.</p>
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
                ? 'Desativar conta'
                : 'Reativar conta'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UserStatusDialog;
