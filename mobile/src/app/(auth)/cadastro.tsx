import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import {
  Banner,
  Button,
  Checkbox,
  PasswordChecklist,
  PasswordField,
  RadioCard,
  Screen,
  SelectField,
  StepHeader,
  TextField,
  type SelectOption,
} from '@/components/ui';
import { parseApiError, registerUser } from '@/services/auth';
import { colors, radius, spacing, typography } from '@/theme';
import type { RegisterPayload, RegisterRole } from '@/types/auth';
import type { ProfessionalCategory } from '@/types/professional';
import { BRAZILIAN_UFS, PROFESSIONAL_CATEGORIES } from '@/utils/councils';
import { formatCpf, isValidCpf } from '@/utils/cpf';
import { validateEmail, EMAIL_MAX_LENGTH } from '@/utils/email';
import { formatDateInput, formatPhone, onlyDigits, parseDateInput } from '@/utils/format';
import { NAME_MAX_LENGTH, normalizeName, validateFullName } from '@/utils/name';
import { validatePassword } from '@/utils/password';

type Step = 1 | 2;

interface FormValues {
  name: string;
  phone: string;
  email: string;
  cpf: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
  category: ProfessionalCategory | null;
  registryNumber: string;
  uf: string | null;
}

type FieldName = keyof FormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const INITIAL_VALUES: FormValues = {
  name: '',
  phone: '',
  email: '',
  cpf: '',
  birthDate: '',
  password: '',
  confirmPassword: '',
  category: null,
  registryNumber: '',
  uf: null,
};

const STEP_ONE_FIELDS: FieldName[] = ['name', 'phone', 'email', 'cpf', 'birthDate', 'password', 'confirmPassword'];

// Erros do Zod (caminhos com ponto) → campos da tela
const API_FIELD_MAP: Record<string, FieldName> = {
  name: 'name',
  email: 'email',
  password: 'password',
  phone: 'phone',
  cpf: 'cpf',
  birthDate: 'birthDate',
  'professionalRegistry.category': 'category',
  'professionalRegistry.registryNumber': 'registryNumber',
  'professionalRegistry.uf': 'uf',
  professionalRegistry: 'registryNumber',
};

const REGISTRY_MAX_LENGTH = 20;
const REGISTRY_REGEX = /^[A-Z0-9]+$/;
// Celular: DDD + 9 + 8 dígitos (como no web)
const PHONE_REGEX = /^\d{2}9\d{8}$/;
const MIN_BIRTH_YEAR = 1900;

const CATEGORY_OPTIONS: SelectOption<ProfessionalCategory>[] = PROFESSIONAL_CATEGORIES.map((category) => ({
  value: category.value,
  label: category.label,
  description: `Conselho: ${category.council}`,
}));

const UF_OPTIONS: SelectOption<string>[] = BRAZILIAN_UFS.map((uf) => ({ value: uf, label: uf }));

// Data de hoje no fuso do aparelho, no formato da API (YYYY-MM-DD)
function getTodayIso(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function validateStepOne(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  const nameError = validateFullName(values.name);
  if (nameError) errors.name = nameError;

  if (!PHONE_REGEX.test(onlyDigits(values.phone)))
    errors.phone = 'Informe o celular com DDD no formato (DDD) 9XXXX-XXXX.';

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  if (!values.cpf) errors.cpf = 'Informe seu CPF.';
  else if (!isValidCpf(values.cpf)) errors.cpf = 'CPF inválido. Confira os números.';

  const birthDate = parseDateInput(values.birthDate);
  if (!values.birthDate) errors.birthDate = 'Informe sua data de nascimento.';
  else if (!birthDate || Number(birthDate.slice(0, 4)) < MIN_BIRTH_YEAR)
    errors.birthDate = 'Informe uma data válida no formato DD/MM/AAAA.';
  else if (birthDate > getTodayIso()) errors.birthDate = 'A data de nascimento não pode ser futura.';

  if (!values.password) errors.password = 'Crie uma senha.';
  else {
    const passwordError = validatePassword(values.password);
    if (passwordError) errors.password = passwordError;
  }

  if (!values.confirmPassword) errors.confirmPassword = 'Confirme a senha.';
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'As senhas não coincidem.';

  return errors;
}

function validateStepTwo(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.category) errors.category = 'Selecione a categoria profissional.';
  if (!values.registryNumber) errors.registryNumber = 'Informe o número do registro.';
  else if (!REGISTRY_REGEX.test(values.registryNumber)) errors.registryNumber = 'Use apenas letras e números.';
  if (!values.uf) errors.uf = 'Selecione a UF do registro.';
  return errors;
}

// O 409 traz só a mensagem: o campo é deduzido do texto (e-mail, CPF ou registro)
function getConflictField(message: string): FieldName | null {
  const text = message.toLowerCase();
  if (text.includes('cpf')) return 'cpf';
  if (text.includes('e-mail') || text.includes('email')) return 'email';
  if (text.includes('registro')) return 'registryNumber';
  return null;
}

/**
 * Cadastro público (RF001, D14): cidadão em uma etapa; profissional com a etapa 2 de dados do conselho (D12, D13),
 * que nasce pendente de verificação (RS001). Exige o consentimento destacado para dados de saúde (LGPD, art. 11, I)
 */
export default function SignUp() {
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<RegisterRole>('CIDADAO');
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isProfessional = role === 'PROFISSIONAL_SAUDE';
  const totalSteps = isProfessional ? 2 : 1;

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setError(null);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  // Botão voltar do Android na etapa 2 volta para a etapa 1, sem sair do cadastro
  useEffect(() => {
    if (step !== 2) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep(1);
      return true;
    });
    return () => subscription.remove();
  }, [step]);

  const setField = <K extends FieldName>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async () => {
    setLoading(true);
    setError(null);

    const payload: RegisterPayload = {
      name: normalizeName(values.name),
      email: values.email.trim(),
      password: values.password,
      phone: onlyDigits(values.phone),
      cpf: onlyDigits(values.cpf),
      birthDate: parseDateInput(values.birthDate) ?? '',
      acceptedPrivacyPolicy: true,
      role,
      ...(isProfessional &&
        values.category &&
        values.uf && {
          professionalRegistry: { category: values.category, registryNumber: values.registryNumber, uf: values.uf },
        }),
    };

    try {
      await registerUser(payload);
      router.replace({
        pathname: '/',
        params: { email: payload.email, cadastro: isProfessional ? 'profissional' : 'cidadao' },
      });
    } catch (err) {
      setLoading(false);
      const { status, message, fieldErrors: apiErrors } = parseApiError(
        err,
        'Não foi possível concluir o cadastro. Tente novamente.'
      );

      const errors: FieldErrors = {};
      // Erros de campos que a tela não tem vão para o aviso do topo, como no web
      const unmapped: string[] = [];
      for (const [path, fieldMessage] of Object.entries(apiErrors)) {
        const field = API_FIELD_MAP[path];
        if (!field) unmapped.push(fieldMessage);
        else if (!errors[field]) errors[field] = fieldMessage;
      }
      if (status === 409) {
        const field = getConflictField(message);
        if (field) errors[field] = field === 'cpf' ? 'Este CPF já está cadastrado.' : message;
      }

      const fields = Object.keys(errors) as FieldName[];
      if (unmapped.length > 0) setError(unmapped.join(' '));
      else if (fields.length === 0) setError(message);
      if (fields.length === 0) return;
      setFieldErrors(errors);
      // Erro em campo da etapa 1 com a etapa 2 aberta: volta para mostrar o campo
      if (step === 2 && fields.some((field) => STEP_ONE_FIELDS.includes(field))) setStep(1);
    }
  };

  const handleStepOne = () => {
    const errors = validateStepOne(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Revise os campos destacados.');
      return;
    }
    setError(null);
    if (isProfessional) setStep(2);
    else void submit();
  };

  const handleStepTwo = () => {
    const errors = validateStepTwo(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    void submit();
  };

  const header =
    step === 1 ? (
      <StepHeader
        title="Crie sua conta"
        subtitle="Informe seus dados e escolha como você vai usar o Vacinei!?."
        onBack={goBack}
        step={isProfessional ? { current: 1, total: totalSteps } : undefined}
      />
    ) : (
      <StepHeader
        title="Dados profissionais"
        subtitle="Estas informações serão conferidas antes de liberar a ala Profissional."
        onBack={goBack}
        step={{ current: 2, total: totalSteps }}
      />
    );

  return (
    <Screen header={header}>
      {error && <Banner tone="danger" title="Não foi possível continuar" message={error} />}

      {step === 1 ? (
        <>
          <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel="Como você usará o aplicativo?">
            <Text style={typography.label}>Como você usará o aplicativo?</Text>
            <RadioCard
              icon="person-outline"
              title="Cidadão"
              description="Acompanhar minha caderneta"
              selected={role === 'CIDADAO'}
              onPress={() => setRole('CIDADAO')}
            />
            <RadioCard
              icon="stethoscope"
              title="Profissional da Saúde"
              description="Atender e confirmar doses"
              selected={isProfessional}
              onPress={() => setRole('PROFISSIONAL_SAUDE')}
            />
          </View>

          <TextField
            label="Nome completo"
            required
            hint={`Nome e sobrenome, com até ${NAME_MAX_LENGTH} caracteres.`}
            value={values.name}
            onChangeText={(text) => setField('name', text)}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={NAME_MAX_LENGTH}
            editable={!loading}
            error={fieldErrors.name}
          />
          <TextField
            label="Celular"
            required
            icon="phone-portrait-outline"
            hint="Formato: (DDD) 9XXXX-XXXX"
            value={values.phone}
            onChangeText={(text) => setField('phone', formatPhone(text))}
            placeholder="(82) 99999-0002"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={15}
            editable={!loading}
            error={fieldErrors.phone}
          />
          <TextField
            label="E-mail"
            required
            icon="mail-outline"
            hint={`Será o seu acesso. Até ${EMAIL_MAX_LENGTH} caracteres.`}
            value={values.email}
            onChangeText={(text) => setField('email', text)}
            placeholder="nome@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            maxLength={EMAIL_MAX_LENGTH}
            editable={!loading}
            error={fieldErrors.email}
          />
          <TextField
            label="CPF"
            required
            icon="card-outline"
            hint="Identifica você no atendimento. Só você vê o número completo."
            value={values.cpf}
            onChangeText={(text) => setField('cpf', formatCpf(text))}
            placeholder="000.000.000-00"
            keyboardType="number-pad"
            maxLength={14}
            editable={!loading}
            error={fieldErrors.cpf}
          />
          <TextField
            label="Data de nascimento"
            required
            icon="calendar-outline"
            hint="DD/MM/AAAA. Base do seu calendário vacinal."
            value={values.birthDate}
            onChangeText={(text) => setField('birthDate', formatDateInput(text))}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            autoComplete="birthdate-full"
            maxLength={10}
            editable={!loading}
            error={fieldErrors.birthDate}
          />
          <PasswordField
            label="Senha"
            required
            hint="Não reutilize a senha de outro serviço."
            value={values.password}
            onChangeText={(text) => setField('password', text)}
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!loading}
            error={fieldErrors.password}
          />
          <PasswordChecklist password={values.password} />
          <PasswordField
            label="Confirmar senha"
            required
            value={values.confirmPassword}
            onChangeText={(text) => setField('confirmPassword', text)}
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!loading}
            error={fieldErrors.confirmPassword}
          />

          <View style={styles.consent}>
            <Checkbox
              label="Li e concordo com a Política de Privacidade e autorizo o tratamento dos meus dados de saúde."
              checked={consent}
              onChange={setConsent}
            />
            <Button
              label="Ler a Política de Privacidade"
              variant="link"
              icon="document-text-outline"
              onPress={() => router.push('/privacidade')}
              style={styles.consentLink}
            />
            <Text style={typography.muted}>
              Seus registros de vacinação são dados de saúde. Pela LGPD (art. 11, I), eles só são tratados com o seu
              consentimento específico, para manter sua caderneta e permitir a confirmação das doses por profissionais.
            </Text>
          </View>

          <Button
            label={isProfessional ? 'Continuar' : 'Criar conta'}
            icon={isProfessional ? 'arrow-forward' : 'checkmark'}
            loading={loading}
            loadingLabel="Criando conta..."
            disabled={!consent}
            accessibilityHint={consent ? undefined : 'Marque o consentimento para continuar'}
            onPress={handleStepOne}
          />
          <Text style={[typography.muted, styles.center]}>* Campos obrigatórios</Text>
        </>
      ) : (
        <>
          <Banner
            icon="checkmark-circle-outline"
            title="Perfil profissional"
            message="Esta etapa aparece somente para quem escolheu Profissional da Saúde."
          />

          <SelectField
            label="Categoria profissional"
            required
            value={values.category}
            options={CATEGORY_OPTIONS}
            onChange={(value) => setField('category', value)}
            placeholder="Selecione a categoria"
            hint="O conselho (CRM, COREN ou CRF) é definido pela categoria."
            disabled={loading}
            error={fieldErrors.category}
          />
          <TextField
            label="Número do registro"
            required
            icon="id-card-outline"
            hint={`Somente letras e números, sem a UF. Até ${REGISTRY_MAX_LENGTH} caracteres.`}
            value={values.registryNumber}
            onChangeText={(text) => setField('registryNumber', text.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="123456"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={REGISTRY_MAX_LENGTH}
            editable={!loading}
            error={fieldErrors.registryNumber}
          />
          <SelectField
            label="UF do registro"
            required
            value={values.uf}
            options={UF_OPTIONS}
            onChange={(value) => setField('uf', value)}
            placeholder="Selecione a UF"
            disabled={loading}
            error={fieldErrors.uf}
          />

          <Banner
            tone="warning"
            icon="document-lock-outline"
            title="Validação necessária"
            message="Seu registro será analisado pela administração. Enquanto isso, você já pode usar a ala Cidadão."
          />

          <Button
            label="Enviar para verificação"
            icon="shield-checkmark-outline"
            loading={loading}
            loadingLabel="Enviando..."
            onPress={handleStepTwo}
          />
          <Button label="Voltar" variant="link" icon="arrow-back" onPress={goBack} disabled={loading} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.md,
  },
  consent: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  consentLink: {
    alignSelf: 'flex-start',
    marginLeft: -spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
});
