import React, { useEffect, useRef, useState } from 'react';
import {
  Mail,
  ShieldQuestion,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Circle,
  RotateCw,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { forgotPassword, resetPassword, parseApiError } from '../../services/auth';
import { PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENTS, validatePassword } from '../../utils/password';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (email: string) => void;
}

type Step = 'email' | 'reset' | 'success';

type FieldName = 'email' | 'code' | 'newPassword' | 'confirmPassword';
type FieldErrors = Partial<Record<FieldName, string>>;

interface Banner {
  type: 'info' | 'error' | 'warning';
  text: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_REGEX = /^\d{6}$/;
const RESEND_COOLDOWN_SECONDS = 30;
const SUCCESS_CLOSE_DELAY_MS = 2500;

const MODAL_TITLES: Record<Step, string> = {
  email: 'Esqueci a senha',
  reset: 'Redefinir senha',
  success: 'Senha redefinida',
};

const BANNER_STYLES: Record<Banner['type'], string> = {
  info: 'bg-surface border-surface text-primary-dark',
  error: 'bg-danger-soft border-danger/20 text-danger',
  warning: 'bg-warning-soft border-warning/25 text-warning',
};

const BANNER_ICONS: Record<Banner['type'], React.ElementType> = {
  info: Info,
  error: AlertCircle,
  warning: AlertTriangle,
};

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ElementType;
  error?: string;
  trailing?: React.ReactNode;
}

// Campo de formulário no padrão visual dos modais de autenticação
const Field: React.FC<FieldProps> = ({ icon: Icon, error, trailing, ...inputProps }) => (
  <div className="w-full">
    <div
      className={`relative flex items-center rounded-xl bg-white border transition-all ${
        error
          ? 'border-danger ring-2 ring-danger/15'
          : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
      }`}
    >
      <input
        {...inputProps}
        aria-invalid={!!error}
        className="w-full py-3.5 pl-4 pr-2 text-base bg-transparent border-0 text-primary-dark placeholder:text-muted/70 focus:outline-none disabled:opacity-50"
      />
      {/* Ação à direita (ex.: exibir senha) substitui o ícone decorativo */}
      {trailing ?? (
        <div className="pr-4 text-muted flex items-center pointer-events-none">
          <Icon className="size-5" />
        </div>
      )}
    </div>

    {error && (
      <p className="mt-1.5 text-xs text-danger font-medium flex items-center gap-1 animate-in fade-in">
        <AlertCircle className="size-3.5 shrink-0" />
        <span>{error}</span>
      </p>
    )}
  </div>
);

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isBusy = isLoading || isResending;

  const resetState = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setFieldErrors({});
    setBanner(null);
    setIsLoading(false);
    setIsResending(false);
    setResendCooldown(0);
  };

  const handleClose = () => {
    if (step === 'success') onSuccess?.(email.trim());
    onClose();
    // Reseta estado após fechamento com pequeno delay para transição suave
    setTimeout(resetState, 200);
  };

  // Contagem regressiva para liberar o botão "Reenviar código"
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Mantém referência atualizada para uso no timer de fechamento automático
  const handleCloseRef = useRef(handleClose);
  useEffect(() => {
    handleCloseRef.current = handleClose;
  });

  // Fecha o modal automaticamente após a redefinição e devolve o usuário ao login
  useEffect(() => {
    if (!isOpen || step !== 'success') return;
    const timer = setTimeout(() => handleCloseRef.current(), SUCCESS_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isOpen, step]);

  const clearFieldError = (field: FieldName) => {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Etapa 1: solicitação do código de recuperação
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);

    if (!email.trim()) {
      setFieldErrors({ email: 'Por favor, informe seu e-mail de acesso.' });
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setFieldErrors({ email: 'Insira um formato de e-mail válido.' });
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const { message } = await forgotPassword(email);
      setBanner({ type: 'info', text: message });
      setStep('reset');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const { message, fieldErrors: apiFieldErrors } = parseApiError(
        err,
        'Não foi possível solicitar o código de recuperação. Tente novamente mais tarde.'
      );
      if (apiFieldErrors.email) {
        setFieldErrors({ email: apiFieldErrors.email });
      } else {
        setBanner({ type: 'error', text: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 2: reenvio do código para o mesmo e-mail
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isBusy) return;

    setBanner(null);
    setIsResending(true);

    try {
      const { message } = await forgotPassword(email);
      setCode('');
      setFieldErrors((prev) => ({ ...prev, code: undefined }));
      setBanner({ type: 'info', text: `Novo código solicitado. ${message}` });
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const { message } = parseApiError(err, 'Não foi possível reenviar o código. Tente novamente mais tarde.');
      setBanner({ type: 'error', text: message });
    } finally {
      setIsResending(false);
    }
  };

  const validateResetForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!CODE_REGEX.test(code)) {
      errors.code = 'Informe o código de 6 dígitos enviado para o seu e-mail.';
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      errors.newPassword = passwordError;
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirme a nova senha.';
    } else if (newPassword && confirmPassword !== newPassword) {
      errors.confirmPassword = 'As senhas não coincidem.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Etapa 2: redefinição da senha com o código recebido
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);

    if (!validateResetForm()) return;

    setIsLoading(true);

    try {
      await resetPassword({ email, code, newPassword });
      setStep('success');
    } catch (err) {
      const { status, message, fieldErrors: apiFieldErrors } = parseApiError(
        err,
        'Não foi possível redefinir a senha. Tente novamente mais tarde.'
      );

      if (status === 429) {
        // Código invalidado pelo backend: o usuário precisa aguardar e solicitar outro
        setStep('email');
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setFieldErrors({});
        setResendCooldown(0);
        setBanner({
          type: 'warning',
          text: `${message} Aguarde 15 minutos e solicite um novo código.`,
        });
      } else if (status === 400 && Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors({
          code: apiFieldErrors.code,
          newPassword: apiFieldErrors.newPassword,
        });
        if (apiFieldErrors.email) {
          setBanner({ type: 'error', text: apiFieldErrors.email });
        }
      } else if (status === 400) {
        // Ex.: "Código inválido ou expirado."
        setFieldErrors({ code: message });
      } else {
        setBanner({ type: 'error', text: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setStep('email');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setBanner(null);
  };

  const BannerIcon = banner ? BANNER_ICONS[banner.type] : null;

  const bannerElement = banner && BannerIcon && (
    <div
      role={banner.type === 'info' ? 'status' : 'alert'}
      className={`w-full mb-5 p-3.5 rounded-xl border text-sm flex items-start gap-2.5 animate-in fade-in duration-200 ${BANNER_STYLES[banner.type]}`}
    >
      <BannerIcon className="size-4 shrink-0 mt-0.5" />
      <span className="leading-snug">{banner.text}</span>
    </div>
  );

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      tabIndex={-1}
      disabled={isBusy}
      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
      className="pr-4 text-muted hover:text-primary-dark transition-colors focus:outline-none cursor-pointer"
    >
      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  );

  const actionButtons = (submitLabel: string, loadingLabel: string) => (
    <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3 mt-8 w-full">
      <button
        type="button"
        onClick={handleClose}
        disabled={isBusy}
        className="flex-1 py-3.5 rounded-xl border border-border bg-white text-primary-dark font-semibold text-sm hover:bg-background transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
      >
        Cancelar
      </button>

      <button
        type="submit"
        disabled={isBusy}
        className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>{loadingLabel}</span>
          </>
        ) : (
          <span>{submitLabel}</span>
        )}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={MODAL_TITLES[step]}>
      {step === 'email' && (
        <form onSubmit={handleRequestCode} noValidate className="flex flex-col items-center">
          {/* Ícone de destaque */}
          <div className="mb-4 size-20 rounded-full bg-surface text-primary flex items-center justify-center">
            <ShieldQuestion className="size-10 stroke-[1.5]" />
          </div>

          <p className="text-sm text-muted text-center max-w-[310px] leading-relaxed mb-6">
            Digite seu e-mail e clique em &quot;Enviar&quot; para receber um código de recuperação de senha.
          </p>

          {bannerElement}

          <Field
            id="forgot-password-email"
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            placeholder="Digite seu email"
            autoComplete="email"
            disabled={isBusy}
            error={fieldErrors.email}
          />

          {actionButtons('Enviar', 'Enviando...')}
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetPassword} noValidate className="flex flex-col items-center">
          <div className="mb-4 size-20 rounded-full bg-surface text-primary flex items-center justify-center">
            <KeyRound className="size-10 stroke-[1.5]" />
          </div>

          <p className="text-sm text-muted text-center max-w-[330px] leading-relaxed mb-1">
            Informe o código de 6 dígitos enviado para
          </p>
          <p className="text-sm font-semibold text-primary-dark text-center break-all mb-1">{email.trim()}</p>
          <button
            type="button"
            onClick={handleChangeEmail}
            disabled={isBusy}
            className="text-xs text-primary hover:text-primary-dark font-semibold mb-5 cursor-pointer disabled:opacity-50"
          >
            Trocar e-mail
          </button>

          {bannerElement}

          <div className="w-full space-y-4">
            <Field
              id="reset-password-code"
              icon={KeyRound}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                clearFieldError('code');
              }}
              placeholder="Código de 6 dígitos"
              disabled={isBusy}
              error={fieldErrors.code}
            />

            <Field
              id="reset-password-new"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                clearFieldError('newPassword');
              }}
              placeholder={`Nova senha (mín. ${PASSWORD_MIN_LENGTH} caracteres)`}
              disabled={isBusy}
              error={fieldErrors.newPassword}
              trailing={passwordToggle}
            />

            {/* Requisitos da senha (RF001) atualizados conforme a digitação */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 px-1" aria-label="Requisitos da senha">
              {PASSWORD_REQUIREMENTS.map(({ label, test }) => {
                const isMet = test(newPassword);
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      isMet ? 'text-success' : 'text-muted'
                    }`}
                  >
                    {isMet ? <CheckCircle2 className="size-3.5 shrink-0" /> : <Circle className="size-3.5 shrink-0" />}
                    <span>{label}</span>
                  </li>
                );
              })}
            </ul>

            <Field
              id="reset-password-confirm"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError('confirmPassword');
              }}
              placeholder="Confirme a nova senha"
              disabled={isBusy}
              error={fieldErrors.confirmPassword}
            />
          </div>

          {/* Reenvio do código */}
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || isBusy}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer disabled:text-muted/60 disabled:cursor-not-allowed"
          >
            {isResending ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />}
            <span>
              {isResending
                ? 'Reenviando...'
                : resendCooldown > 0
                ? `Reenviar código em ${resendCooldown}s`
                : 'Reenviar código'}
            </span>
          </button>

          {actionButtons('Redefinir', 'Redefinindo...')}
        </form>
      )}

      {step === 'success' && (
        /* Estado de Confirmação: Senha Redefinida */
        <div className="py-6 flex flex-col items-center text-center animate-in fade-in duration-300">
          <div className="mb-6 size-24 rounded-full bg-success-soft text-success flex items-center justify-center">
            <CheckCircle2 className="size-11 stroke-[1.5]" />
          </div>

          <p className="text-base text-primary-dark font-medium leading-relaxed max-w-[300px] mb-2">
            Senha redefinida com sucesso!
          </p>
          <p className="text-sm text-muted max-w-[300px]">
            Você será redirecionado para o login para entrar com a nova senha.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;
