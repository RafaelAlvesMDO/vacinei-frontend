import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  ShieldCheck,
  Syringe,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Stethoscope,
} from 'lucide-react';
import { authenticate } from '../../services/auth';
import type { UserRole } from '../../types/auth';

interface FormErrors {
  email?: string;
  password?: string;
}

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve conter no mínimo 6 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authenticate({
        email: email.trim(),
        password,
        rememberMe,
      });

      const userRole: UserRole = response.user.role;

      // Validação de RBAC para acesso ao gerenciador web
      if (userRole === 'CIDADAO') {
        setApiError(
          'Acesso exclusivo: Este gerenciador web é destinado apenas a Profissionais de Saúde e Administradores. Por favor, utilize o aplicativo móvel VACINEI!?'
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage(`Bem-vindo(a), ${response.user.name}! Redirecionando...`);

      // Se houver navegação ou reload
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1200);
    } catch (err: any) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.status === 401
          ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
          : err.response?.status === 403
          ? 'Sua conta de usuário está inativa no sistema.'
          : !err.response
          ? 'Não foi possível conectar ao servidor da API. Verifique se o backend está em execução.'
          : 'Ocorreu um erro ao realizar login. Tente novamente.');

      setApiError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 font-sans text-slate-800 antialiased">
      {/* PAINEL ESQUERDO: Ilustração e Branding Institucional (adaptado do design base) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-sky-50 via-slate-100 to-sky-100/70 p-12 items-center justify-center overflow-hidden border-r border-slate-200/80">
        {/* Elementos decorativos de fundo */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg flex flex-col items-center text-center">
          {/* Badge institucional */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/90 text-sky-800 text-xs font-semibold tracking-wide uppercase mb-8 shadow-xs border border-sky-200/60">
            <ShieldCheck className="size-4 text-sky-600" />
            <span>Sistema Seguro de Imunização • SUS Maceió</span>
          </div>

          {/* Composição visual / Ilustração inspirada na referência de segurança e chave de acesso */}
          <div className="relative w-80 h-80 my-4 flex items-center justify-center">
            {/* Círculo central iluminado */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-sky-400/20 to-blue-500/20 border border-sky-300/40 animate-pulse" />

            {/* Ilustração SVG de Saúde e Segurança */}
            <svg
              viewBox="0 0 320 320"
              className="w-full h-full drop-shadow-lg"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Cadeado de Segurança (alusão ao protótipo) */}
              <rect
                x="60"
                y="90"
                width="70"
                height="80"
                rx="16"
                className="fill-sky-500/90 stroke-sky-700 stroke-2"
              />
              <path
                d="M75 90V65C75 51.1929 86.1929 40 100 40C113.807 40 125 51.1929 125 65V90"
                stroke="#0369a1"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <circle cx="95" cy="125" r="7" fill="white" />
              <path d="M95 132V148" stroke="white" strokeWidth="6" strokeLinecap="round" />

              {/* Chave de Acesso Digital estilizada */}
              <circle cx="210" cy="180" r="32" stroke="#0284c7" strokeWidth="12" fill="white" />
              <path
                d="M182 180L100 180"
                stroke="#0284c7"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path d="M120 180V198" stroke="#0284c7" strokeWidth="10" strokeLinecap="round" />
              <path d="M140 180V194" stroke="#0284c7" strokeWidth="10" strokeLinecap="round" />

              {/* Elementos orgânicos da identidade médica */}
              <circle cx="240" cy="90" r="14" fill="#38bdf8" fillOpacity="0.4" />
              <circle cx="80" cy="230" r="8" fill="#0284c7" fillOpacity="0.3" />
              <path
                d="M200 240C220 260 250 250 260 230"
                stroke="#0284c7"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="4 6"
              />
            </svg>

            {/* Card flutuante 1: Profissional de Saúde */}
            <div className="absolute -bottom-2 -left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-slate-200/80 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                <Stethoscope className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800">Profissional da Saúde</p>
                <p className="text-[11px] text-slate-500">Validação e aplicação de doses</p>
              </div>
            </div>

            {/* Card flutuante 2: Gestão Administrativa */}
            <div className="absolute -top-3 -right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-slate-200/80 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Syringe className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800">Controle do SUS</p>
                <p className="text-[11px] text-slate-500">Gestão de UBSs e estoque</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mt-6 tracking-tight">
            Gestão Inteligente de Vacinas
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-sm leading-relaxed">
            Painel corporativo e operacional para registro presencial de doses, controle de UBSs de Maceió e administração do catálogo vacinal.
          </p>
        </div>
      </div>

      {/* PAINEL DIREITO: Formulário de Autenticação (Fiel ao alinhamento da referência) */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 bg-white">
        <div className="w-full max-w-[420px]">
          {/* Header do Formulário */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/30 mb-4">
              <Syringe className="size-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Entrar
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Acesso exclusivo para Profissionais de Saúde e Administradores
            </p>
          </div>

          {/* Banner de Feedback de Erro da API */}
          {apiError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200"
            >
              <AlertCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{apiError}</div>
            </div>
          )}

          {/* Banner de Sucesso */}
          {successMessage && (
            <div
              role="status"
              className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 shadow-xs"
            >
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Campo E-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                E-mail
              </label>
              <div
                className={`relative flex items-center rounded-xl bg-slate-50 border transition-all ${
                  errors.email
                    ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20'
                    : 'border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 focus-within:bg-white'
                }`}
              >
                <div className="pl-3.5 pr-2 text-slate-400 flex items-center pointer-events-none">
                  <Mail className="size-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="seu.email@saude.gov.br"
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full py-3 pr-3.5 text-sm bg-transparent border-0 text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="size-3.5" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Senha
              </label>
              <div
                className={`relative flex items-center rounded-xl bg-slate-50 border transition-all ${
                  errors.password
                    ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20'
                    : 'border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 focus-within:bg-white'
                }`}
              >
                <div className="pl-3.5 pr-2 text-slate-400 flex items-center pointer-events-none">
                  <Lock className="size-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Sua senha de acesso"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full py-3 pr-2 text-sm bg-transparent border-0 text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  disabled={isLoading}
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="pr-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="size-3.5" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Opções: Esqueci minha senha & Lembrar de mim (referência exata do layout) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Para recuperação de senha institucional, contate o administrador do sistema.');
                }}
                className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                <HelpCircle className="size-3.5 text-indigo-500" />
                <span>Esqueci minha senha</span>
              </a>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-800">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="size-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Lembrar de mim</span>
              </label>
            </div>

            {/* Botão de Envio (Pill button azul da referência) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-4 rounded-xl font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>

          {/* Rodapé institucional com link para suporte/administrador */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Não tem acesso?{' '}
              <a
                href="mailto:suporte.vacinei@saude.maceio.br"
                className="text-sky-600 hover:text-sky-700 font-medium hover:underline transition-colors"
              >
                Entre em contato com a administração
              </a>
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Cidadãos devem acessar sua caderneta pelo aplicativo móvel <strong>VACINEI!?</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
