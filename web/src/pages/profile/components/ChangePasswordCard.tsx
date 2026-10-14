import React, { useState } from 'react';
import { AlertCircle, KeyRound, Loader2, Lock } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { PasswordChecklist } from '../../../components/ui/PasswordChecklist';
import { PasswordToggle } from '../../../components/ui/PasswordToggle';
import { changePassword, parseApiError } from '../../../services/auth';
import { validatePassword } from '../../../utils/password';

type FieldName = 'currentPassword' | 'newPassword' | 'confirmPassword';
type FieldErrors = Partial<Record<FieldName, string>>;
type FormValues = Record<FieldName, string>;

const INITIAL_VALUES: FormValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

function validateForm(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.currentPassword) errors.currentPassword = 'Informe a senha atual.';

  const passwordError = validatePassword(values.newPassword);
  if (passwordError) {
    errors.newPassword = passwordError;
  } else if (values.newPassword === values.currentPassword) {
    errors.newPassword = 'A nova senha deve ser diferente da atual.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirme a nova senha.';
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = 'As senhas não coincidem.';
  }

  return errors;
}

interface ChangePasswordCardProps {
  onPasswordChanged: () => void;
}

export const ChangePasswordCard: React.FC<ChangePasswordCardProps> = ({ onPasswordChanged }) => {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const setField = (field: FieldName, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const errors = validateForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      setValues(INITIAL_VALUES);
      setShowPasswords(false);
      onPasswordChanged();
    } catch (error) {
      const parsed = parseApiError(error, 'Não foi possível alterar a senha. Tente novamente.');

      if (parsed.status === 401) {
        setFieldErrors({ currentPassword: parsed.message });
      } else if (parsed.status === 400) {
        const apiErrors: FieldErrors = {
          currentPassword: parsed.fieldErrors.currentPassword,
          // Sem `issues`, o 400 é a nova senha igual à atual
          newPassword: parsed.fieldErrors.newPassword ?? (parsed.fieldErrors.currentPassword ? undefined : parsed.message),
        };
        setFieldErrors(apiErrors);
      } else {
        setSubmitError(parsed.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const passwordToggle = (
    <PasswordToggle isVisible={showPasswords} onToggle={() => setShowPasswords((prev) => !prev)} disabled={isSaving} noun="senhas" />
  );
  const inputType = showPasswords ? 'text' : 'password';

  return (
    <Card
      title="Alterar senha"
      description="Por segurança, as outras sessões abertas serão encerradas. Esta continua conectada."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {submitError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm text-danger"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </p>
        )}

        <FormField
          id="current-password"
          label="Senha atual"
          icon={Lock}
          type={inputType}
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={(event) => setField('currentPassword', event.target.value)}
          disabled={isSaving}
          error={fieldErrors.currentPassword}
          trailing={passwordToggle}
        />

        <div className="flex flex-col gap-2">
          <FormField
            id="new-password"
            label="Nova senha"
            icon={KeyRound}
            type={inputType}
            autoComplete="new-password"
            value={values.newPassword}
            onChange={(event) => setField('newPassword', event.target.value)}
            disabled={isSaving}
            error={fieldErrors.newPassword}
            trailing={passwordToggle}
          />
          <PasswordChecklist password={values.newPassword} />
        </div>

        <FormField
          id="confirm-password"
          label="Confirmar nova senha"
          icon={Lock}
          type={inputType}
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(event) => setField('confirmPassword', event.target.value)}
          disabled={isSaving}
          error={fieldErrors.confirmPassword}
        />

        <button
          type="submit"
          disabled={isSaving}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          {isSaving ? 'Alterando...' : 'Alterar senha'}
        </button>
      </form>
    </Card>
  );
};

export default ChangePasswordCard;
