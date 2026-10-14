import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Clock,
  Lock,
  LogIn,
  ShieldCheck,
  Syringe,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Stethoscope,
} from 'lucide-react';
import logoVacinei from '../../assets/logo-vacinei.svg';
import { CitizenAccessError } from '../../contexts/auth-context';
import { FormField } from '../../components/ui/FormField';
import { PasswordToggle } from '../../components/ui/PasswordToggle';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { IDLE_TIMEOUT_MINUTES } from '../../hooks/useIdleTimeout';
import { parseApiError } from '../../services/auth';
import { clearLogoutReason, getLogoutReason } from '../../services/tokenStorage';
import { formatIdleDuration } from '../../utils/idleTimeout';
import { RequestAccessModal } from './RequestAccessModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface FormErrors {
  email?: string;
  password?: string;
}

const LOGIN_ERROR_FALLBACKS: Record<number, string> = {
  0: 'Ocorreu um erro ao realizar login. Tente novamente.',
  401: 'Credenciais inválidas.',
  403: 'Esta conta está desativada. Procure a administração do Vacinei!? para reativá-la.',
  429: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
};

export const Login: React.FC = () => {
  const { signIn } = useAuth();
  usePageTitle('Entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estados dos modais complementares
  const [isRequestAccessOpen, setIsRequestAccessOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Sessão encerrada por inatividade (RNF11): o aviso aparece uma vez, até o próximo envio
  const [noticeMessage, setNoticeMessage] = useState<string | null>(() =>
    getLogoutReason() === 'idle'
      ? `Sua sessão foi encerrada após ${formatIdleDuration(IDLE_TIMEOUT_MINUTES)} sem uso. Entre novamente para continuar.`
      : null
  );
  useEffect(() => {
    clearLogoutReason();
  }, []);

  // Validação básica de campos
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Por favor, insira um endereço de e-mail válido.';
      }
    }

    if (!password) {
      newErrors.password = 'A senha de acesso é obrigatória.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);
    setNoticeMessage(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // Após o login, o PublicRoute redireciona para o dashboard (ou para a página de origem)
      await signIn({
        email: email.trim(),
        password,
        rememberMe,
      });
    } catch (err) {
      // Validação de RBAC: cidadãos não acessam o gerenciador web
      if (err instanceof CitizenAccessError) {
        setApiError(err.message);
      } else {
        // 401 é genérico (e-mail inexistente ou senha errada) e o 403 de conta desativada só vem
        // com a senha correta (D17). Vale a mensagem da API; os textos abaixo são a reserva
        const { status, message } = parseApiError(err, '');
        setApiError(message || LOGIN_ERROR_FALLBACKS[status ?? 0] || LOGIN_ERROR_FALLBACKS[0]);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background font-sans text-primary-dark antialiased">
      {/* PAINEL ESQUERDO: Branding institucional (apenas desktop) */}
      <div className="hidden lg:flex lg:w-1/2 p-8">
        <div className="relative w-full rounded-3xl bg-surface p-12 flex items-center justify-center overflow-hidden">
          <div className="relative z-10 max-w-lg flex flex-col items-center text-center">
            {/* Badge institucional */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-primary text-xs font-semibold shadow-sm mb-10">
              <ShieldCheck className="size-4" />
              <span>Sistema seguro de imunização • Maceió</span>
            </div>

            {/* Logo em destaque sobre círculo, no estilo do onboarding */}
            <div className="relative w-80 h-80 flex items-center justify-center">
              <div className="absolute inset-6 rounded-full bg-white/70" />
              <img
                src={logoVacinei}
                alt=""
                className="relative size-36 rounded-[2rem] shadow-lg shadow-primary/15"
              />

              {/* Card flutuante 1: Profissional de Saúde */}
              <div className="absolute bottom-6 -left-6 bg-white px-4 py-2.5 rounded-2xl shadow-md flex items-center gap-3">
                <div className="p-2 rounded-full bg-surface text-primary">
                  <Stethoscope className="size-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-primary-dark">Profissional da Saúde</p>
                  <p className="text-[11px] text-muted">Validação e aplicação de doses</p>
                </div>
              </div>

              {/* Card flutuante 2: Gestão Administrativa */}
              <div className="absolute top-6 -right-6 bg-white px-4 py-2.5 rounded-2xl shadow-md flex items-center gap-3">
                <div className="p-2 rounded-full bg-surface text-primary">
                  <Syringe className="size-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-primary-dark">Administração</p>
                  <p className="text-[11px] text-muted">Gestão de UBSs e catálogo vacinal</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-primary-dark mt-8 tracking-tight">
              Gestão inteligente de vacinas
            </h2>
            <p className="text-sm text-muted mt-2 max-w-sm leading-relaxed">
              Painel para registro presencial de doses, controle de UBSs de Maceió e administração do catálogo vacinal.
            </p>
          </div>
        </div>
      </div>

      {/* PAINEL DIREITO: Formulário de autenticação */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-[420px]">
          {/* Marca */}
          <div className="flex items-center gap-3 mb-8">
            <img
              src={logoVacinei}
              alt="Logo Vacinei!?"
              className="size-12 rounded-xl shadow-sm"
            />
            <div>
              <p className="text-xl font-bold text-primary-dark leading-tight">Vacinei!?</p>
              <p className="text-xs text-muted">Gerenciador Web</p>
            </div>
          </div>

          {/* Header do Formulário */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary-dark tracking-tight">
              Boas-vindas
            </h1>
            <p className="text-muted text-base mt-2 leading-relaxed">
              Acesso exclusivo para profissionais de saúde e administradores.
            </p>
          </div>

          {/* Banner de Feedback de Erro da API */}
          {apiError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-danger-soft border border-danger/20 text-danger text-sm flex items-start gap-3 animate-in fade-in duration-200"
            >
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <div className="leading-snug">{apiError}</div>
            </div>
          )}

          {/* Aviso de sessão encerrada por inatividade */}
          {noticeMessage && (
            <div
              role="status"
              className="mb-6 p-4 rounded-xl border border-border bg-surface text-primary-dark text-sm flex items-start gap-3"
            >
              <Clock className="size-5 shrink-0 mt-0.5 text-primary" />
              <div className="leading-snug">{noticeMessage}</div>
            </div>
          )}

          {/* Banner de Sucesso */}
          {successMessage && (
            <div
              role="status"
              className="mb-6 p-4 rounded-xl bg-success-soft text-success text-sm font-medium flex items-center gap-3"
            >
              <CheckCircle2 className="size-5 shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormField
              id="email"
              type="email"
              label="E-mail"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="seu.email@saude.gov.br"
              autoComplete="email"
              disabled={isLoading}
              error={errors.email}
            />

            <FormField
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Senha"
              icon={Lock}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Sua senha de acesso"
              autoComplete="current-password"
              disabled={isLoading}
              error={errors.password}
              trailing={
                <PasswordToggle
                  isVisible={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                />
              }
            />

            {/* Opções: Lembrar de mim & Esqueci minha senha */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none text-muted hover:text-primary-dark">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="size-4 rounded border-input accent-primary focus:ring-2 focus:ring-primary/30"
                />
                <span>Lembrar de mim</span>
              </label>

              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="rounded text-primary hover:text-primary-dark font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl text-base font-semibold text-white bg-primary hover:bg-primary-dark active:bg-primary-dark transition-colors flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <LogIn className="size-5" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Link para solicitar acesso */}
          <p className="mt-6 text-sm text-muted text-center">
            Ainda não tem acesso?{' '}
            <button
              type="button"
              onClick={() => setIsRequestAccessOpen(true)}
              className="rounded text-primary hover:text-primary-dark font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Criar conta
            </button>
          </p>

          {/* Caixa de aviso de segurança */}
          <div className="mt-6 p-4 rounded-xl bg-surface text-sm text-muted flex items-start gap-3">
            <ShieldCheck className="size-5 text-primary shrink-0" />
            <p className="leading-snug">
              Nunca compartilhe sua senha. O acesso é pessoal e protegido. Cidadãos devem usar o aplicativo móvel{' '}
              <strong className="text-primary-dark">Vacinei!?</strong>.
            </p>
          </div>

          <footer className="mt-8 text-center text-xs text-muted">
            <p>© 2026 Vacinei!? — Centro Universitário CESMAC</p>
            <Link
              to="/privacidade"
              className="mt-1 inline-block rounded font-semibold text-primary hover:text-primary-dark hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Política de privacidade
            </Link>
          </footer>
        </div>
      </div>

      {/* Modais Complementares de Autenticação */}
      <RequestAccessModal
        isOpen={isRequestAccessOpen}
        onClose={() => setIsRequestAccessOpen(false)}
        onSuccess={(registeredEmail) => {
          setEmail(registeredEmail);
          setPassword('');
          setErrors({});
          setApiError(null);
          setSuccessMessage('Cadastro enviado! Entre com o e-mail e a senha cadastrados.');
        }}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={(resetEmail) => {
          setEmail(resetEmail);
          setPassword('');
          setErrors({});
          setApiError(null);
          setSuccessMessage('Senha redefinida com sucesso! Entre com sua nova senha.');
        }}
      />
    </div>
  );
};

export default Login;
