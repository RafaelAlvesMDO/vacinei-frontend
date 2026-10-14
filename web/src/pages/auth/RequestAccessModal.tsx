import React, { useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  Hash,
  IdCard,
  Loader2,
  Lock,
  Mail,
  Phone,
  Send,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { FormField, FormSelect } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import { PasswordChecklist } from '../../components/ui/PasswordChecklist';
import { PasswordToggle } from '../../components/ui/PasswordToggle';
import { parseApiError, registerProfessional } from '../../services/auth';
import type { ProfessionalCategory } from '../../types/professional';
import { BRAZILIAN_UFS, PROFESSIONAL_CATEGORIES } from '../../utils/councils';
import { formatCpf, isValidCpf } from '../../utils/cpf';
import { formatPhone, onlyDigits } from '../../utils/format';
import { NAME_MAX_LENGTH, normalizeName, validateFullName } from '../../utils/name';
import { PASSWORD_MIN_LENGTH, validatePassword } from '../../utils/password';

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Chamado ao fechar após o cadastro, com o e-mail para preencher o login
  onSuccess?: (email: string) => void;
}

type FieldName =
  | 'name'
  | 'email'
  | 'phone'
  | 'cpf'
  | 'birthDate'
  | 'category'
  | 'registryNumber'
  | 'uf'
  | 'password'
  | 'confirmPassword';
type FieldErrors = Partial<Record<FieldName, string>>;

interface FormValues {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  category: ProfessionalCategory | '';
  registryNumber: string;
  uf: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_VALUES: FormValues = {
  name: '',
  email: '',
  phone: '',
  cpf: '',
  birthDate: '',
  category: '',
  registryNumber: '',
  uf: '',
  password: '',
  confirmPassword: '',
};

// Limites do POST /users (RF001)
const EMAIL_MAX_LENGTH = 100;
const REGISTRY_MAX_LENGTH = 20;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{2}9\d{8}$/;
const REGISTRY_REGEX = /^[A-Z0-9]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MIN_BIRTH_DATE = '1900-01-01';
const GENERIC_ERROR = 'Não foi possível concluir o cadastro. Tente novamente mais tarde.';

// Caminhos dos erros do Zod (400) → campos do formulário
const API_FIELD_MAP: Record<string, FieldName> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  cpf: 'cpf',
  birthDate: 'birthDate',
  password: 'password',
  'professionalRegistry.category': 'category',
  'professionalRegistry.registryNumber': 'registryNumber',
  'professionalRegistry.uf': 'uf',
};

const CATEGORY_OPTIONS = PROFESSIONAL_CATEGORIES.map(({ value, label }) => ({ value, label }));
const UF_OPTIONS = BRAZILIAN_UFS.map((uf) => ({ value: uf, label: uf }));

// Data de hoje no fuso local em YYYY-MM-DD (limite do campo de nascimento)
function getTodayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isExistingDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateForm(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const email = values.email.trim();

  const nameError = validateFullName(values.name);
  if (nameError) errors.name = nameError;

  if (!email) {
    errors.email = 'Informe seu e-mail.';
  } else if (!EMAIL_REGEX.test(email) || email.length > EMAIL_MAX_LENGTH) {
    errors.email = 'Insira um e-mail válido.';
  }

  if (!PHONE_REGEX.test(onlyDigits(values.phone))) {
    errors.phone = 'Informe o celular com DDD no formato (DD) 9XXXX-XXXX.';
  }

  if (!values.cpf) {
    errors.cpf = 'Informe seu CPF.';
  } else if (!isValidCpf(values.cpf)) {
    errors.cpf = 'CPF inválido. Confira os números digitados.';
  }

  if (!values.birthDate) {
    errors.birthDate = 'Informe sua data de nascimento.';
  } else if (!isExistingDate(values.birthDate) || values.birthDate < MIN_BIRTH_DATE) {
    errors.birthDate = 'Informe uma data de nascimento válida.';
  } else if (values.birthDate > getTodayIso()) {
    errors.birthDate = 'A data de nascimento não pode ser futura.';
  }

  if (!values.category) errors.category = 'Selecione sua categoria profissional.';

  if (!values.registryNumber) {
    errors.registryNumber = 'Informe o número do registro.';
  } else if (!REGISTRY_REGEX.test(values.registryNumber)) {
    errors.registryNumber = 'Use apenas letras e números.';
  }

  if (!values.uf) errors.uf = 'Selecione a UF do registro.';

  const passwordError = values.password ? validatePassword(values.password) : 'Informe uma senha.';
  if (passwordError) errors.password = passwordError;

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirme a senha.';
  } else if (values.password && values.confirmPassword !== values.password) {
    errors.confirmPassword = 'As senhas não coincidem.';
  }

  return errors;
}

// Cadastro público de profissional de saúde (RF001), pendente de verificação pelo ADMIN (RS001)
export const RequestAccessModal: React.FC<RequestAccessModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [status, setStatus] = useState<'form' | 'sent'>('form');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const council = PROFESSIONAL_CATEGORIES.find((option) => option.value === values.category)?.council;

  const handleClose = () => {
    if (status === 'sent') onSuccess?.(values.email.trim());
    onClose();
    // Reseta estado após fechamento com pequeno delay para transição suave
    setTimeout(() => {
      setValues(INITIAL_VALUES);
      setStatus('form');
      setFieldErrors({});
      setBannerError(null);
      setShowPassword(false);
      setIsLoading(false);
    }, 200);
  };

  const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError(null);

    const errors = validateForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !values.category) return;

    setIsLoading(true);

    try {
      await registerProfessional({
        name: normalizeName(values.name),
        email: values.email.trim(),
        password: values.password,
        phone: onlyDigits(values.phone),
        cpf: onlyDigits(values.cpf),
        birthDate: values.birthDate,
        role: 'PROFISSIONAL_SAUDE',
        professionalRegistry: {
          category: values.category,
          registryNumber: values.registryNumber,
          uf: values.uf,
        },
      });
      setStatus('sent');
    } catch (err) {
      const { status: httpStatus, message, fieldErrors: apiFieldErrors } = parseApiError(err, GENERIC_ERROR);

      if (httpStatus === 409) {
        // A API informa se o conflito é o e-mail, o CPF ou o registro profissional
        if (/cpf/i.test(message)) {
          setFieldErrors({ cpf: 'Este CPF já está cadastrado.' });
          setBannerError(
            'Já existe uma conta com este CPF. Se ela é sua, entre com o e-mail cadastrado ou use “Esqueci minha senha”.'
          );
          return;
        }
        const conflict = message === GENERIC_ERROR ? 'E-mail, CPF ou registro profissional já cadastrado.' : message;
        setBannerError(`${conflict} Se você já tem conta, entre com seu e-mail ou use “Esqueci minha senha”.`);
      } else if (httpStatus === 400 && Object.keys(apiFieldErrors).length > 0) {
        const mapped: FieldErrors = {};
        const unmapped: string[] = [];
        for (const [path, error] of Object.entries(apiFieldErrors)) {
          const field = API_FIELD_MAP[path];
          if (field) mapped[field] = error;
          else unmapped.push(error);
        }
        setFieldErrors(mapped);
        if (unmapped.length > 0) setBannerError(unmapped.join(' '));
      } else {
        setBannerError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordToggle = (
    <PasswordToggle isVisible={showPassword} onToggle={() => setShowPassword((prev) => !prev)} disabled={isLoading} />
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar conta" maxWidth="max-w-[560px]">
      {status === 'form' ? (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 shrink-0 rounded-full bg-surface text-primary flex items-center justify-center">
              <Stethoscope className="size-6" />
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Cadastro de profissional de saúde. Seu registro será verificado pelo administrador antes da
              liberação das funções de profissional.
            </p>
          </div>

          {bannerError && (
            <div
              role="alert"
              className="w-full mb-5 p-3.5 rounded-xl border bg-danger-soft border-danger/20 text-danger text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{bannerError}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <FormField
              id="register-name"
              label="Nome completo"
              icon={UserRound}
              type="text"
              autoComplete="name"
              maxLength={NAME_MAX_LENGTH}
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Nome e sobrenome"
              disabled={isLoading}
              error={fieldErrors.name}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="register-email"
                label="E-mail"
                icon={Mail}
                type="email"
                autoComplete="email"
                maxLength={EMAIL_MAX_LENGTH}
                value={values.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="seu.email@exemplo.com"
                disabled={isLoading}
                error={fieldErrors.email}
              />

              <FormField
                id="register-phone"
                label="Celular"
                icon={Phone}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={values.phone}
                onChange={(e) => setField('phone', formatPhone(e.target.value))}
                placeholder="(82) 99999-9999"
                disabled={isLoading}
                error={fieldErrors.phone}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="register-cpf"
                label="CPF"
                icon={IdCard}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={values.cpf}
                onChange={(e) => setField('cpf', formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                disabled={isLoading}
                error={fieldErrors.cpf}
              />

              <FormField
                id="register-birth-date"
                label="Data de nascimento"
                icon={CalendarDays}
                type="date"
                autoComplete="bday"
                min={MIN_BIRTH_DATE}
                max={getTodayIso()}
                value={values.birthDate}
                onChange={(e) => setField('birthDate', e.target.value)}
                disabled={isLoading}
                error={fieldErrors.birthDate}
                trailing={<span className="pr-2" />}
              />
            </div>

            <FormSelect
              id="register-category"
              label="Categoria profissional"
              placeholder="Selecione a categoria"
              options={CATEGORY_OPTIONS}
              value={values.category}
              onChange={(e) => setField('category', e.target.value as ProfessionalCategory)}
              disabled={isLoading}
              error={fieldErrors.category}
              hint={
                council && (
                  <span className="inline-flex items-center gap-1">
                    <BadgeCheck className="size-3.5 text-primary" />
                    Conselho: <strong className="text-primary-dark">{council}</strong>
                  </span>
                )
              }
            />

            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-[minmax(0,1fr)_7rem]">
              <FormField
                id="register-registry"
                label="Número do registro"
                icon={Hash}
                type="text"
                autoComplete="off"
                maxLength={REGISTRY_MAX_LENGTH}
                value={values.registryNumber}
                onChange={(e) => setField('registryNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="Ex.: 123456"
                disabled={isLoading}
                error={fieldErrors.registryNumber}
              />

              <FormSelect
                id="register-uf"
                label="UF"
                placeholder="UF"
                options={UF_OPTIONS}
                value={values.uf}
                onChange={(e) => setField('uf', e.target.value)}
                disabled={isLoading}
                error={fieldErrors.uf}
              />
            </div>

            <FormField
              id="register-password"
              label="Senha"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`}
              disabled={isLoading}
              error={fieldErrors.password}
              trailing={passwordToggle}
            />

            <PasswordChecklist password={values.password} />

            <FormField
              id="register-confirm-password"
              label="Confirmar senha"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              placeholder="Repita a senha"
              disabled={isLoading}
              error={fieldErrors.confirmPassword}
            />
          </div>

          {/* Transparência no momento da coleta (LGPD). Nova aba, para não perder o formulário */}
          <p className="mt-6 text-xs leading-relaxed text-muted">
            Seus dados (inclusive CPF e registro profissional) são usados para identificar você e verificar seu registro.
            Saiba mais na{' '}
            <a
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded font-semibold text-primary hover:text-primary-dark hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Política de privacidade<span className="sr-only"> (abre em nova aba)</span>
            </a>
            .
          </p>

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3 mt-6 w-full">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-xl border border-border bg-white text-primary-dark font-semibold text-sm hover:bg-background transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <span>Cadastrar</span>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Estado de Confirmação: Cadastro Enviado */
        <div role="status" className="py-6 flex flex-col items-center text-center animate-in fade-in duration-300">
          <div className="mb-6 size-24 rounded-full bg-surface text-primary flex items-center justify-center">
            <Send className="size-11 stroke-[1.5] -rotate-12" />
          </div>

          <p className="text-lg text-primary-dark font-bold mb-2">Cadastro enviado!</p>
          <p className="text-sm text-muted leading-relaxed max-w-[360px] mb-6">
            Seu registro profissional será verificado pelo administrador. Você já pode entrar, mas as funções de
            profissional serão liberadas após a verificação.
          </p>

          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
          >
            Ir para o login
          </button>
        </div>
      )}
    </Modal>
  );
};

export default RequestAccessModal;
