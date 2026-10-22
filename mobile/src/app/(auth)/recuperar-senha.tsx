import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Banner,
  Button,
  Card,
  CodeInput,
  Icon,
  PasswordChecklist,
  PasswordField,
  Screen,
  StepHeader,
  TextField,
} from '@/components/ui';
import { useCountdown } from '@/hooks/useCountdown';
import { forgotPassword, parseApiError, resetPassword } from '@/services/auth';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { validateEmail } from '@/utils/email';
import { formatCountdown } from '@/utils/format';
import { validatePassword } from '@/utils/password';

type Step = 'email' | 'reset' | 'blocked';
type FieldName = 'email' | 'code' | 'newPassword' | 'confirmPassword';
type FieldErrors = Partial<Record<FieldName, string>>;

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_MS = 30 * 1000;
// Validade do código e bloqueio após 3 códigos errados (D04)
const CODE_VALIDITY_MS = 10 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

/**
 * Recuperação de senha (RF011, RS007, D04) em 2 etapas: e-mail (POST /auth/forgot-password) e
 * código + nova senha (POST /auth/reset-password). O 429 abre a tela de bloqueio de 15 minutos
 */
export default function RecoverPassword() {
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [resendAt, setResendAt] = useState<number | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const resendIn = useCountdown(resendAt);
  const codeRemaining = useCountdown(codeExpiresAt);
  const blockRemaining = useCountdown(blockedUntil);

  const busy = loading || resending;

  const backToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const clearFieldError = (field: FieldName) => setFieldErrors((current) => ({ ...current, [field]: undefined }));

  const startCodeTimers = () => {
    const now = Date.now();
    setResendAt(now + RESEND_COOLDOWN_MS);
    setCodeExpiresAt(now + CODE_VALIDITY_MS);
  };

  const backToEmail = () => {
    setStep('email');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setInfo(null);
    setError(null);
  };

  const requestCode = async () => {
    const emailError = validateEmail(email);
    setError(null);
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const message = await forgotPassword(email);
      setInfo(message);
      setStep('reset');
      startCodeTimers();
    } catch (err) {
      const { message, fieldErrors: apiErrors } = parseApiError(
        err,
        'Não foi possível solicitar o código. Tente novamente mais tarde.'
      );
      if (apiErrors.email) setFieldErrors({ email: apiErrors.email });
      else setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendIn > 0 || busy) return;
    setError(null);
    setResending(true);
    try {
      const message = await forgotPassword(email);
      setCode('');
      clearFieldError('code');
      setInfo(`Novo código solicitado. ${message}`);
      startCodeTimers();
    } catch (err) {
      setError(parseApiError(err, 'Não foi possível reenviar o código. Tente novamente mais tarde.').message);
    } finally {
      setResending(false);
    }
  };

  const savePassword = async () => {
    const errors: FieldErrors = {};
    if (code.length !== CODE_LENGTH) errors.code = 'Informe os 6 dígitos enviados para o seu e-mail.';
    const passwordError = newPassword ? validatePassword(newPassword) : 'Crie a nova senha.';
    if (passwordError) errors.newPassword = passwordError;
    if (!confirmPassword) errors.confirmPassword = 'Confirme a nova senha.';
    else if (confirmPassword !== newPassword) errors.confirmPassword = 'As senhas não coincidem.';

    setFieldErrors(errors);
    setError(null);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await resetPassword({ email, code, newPassword });
      router.replace({ pathname: '/', params: { email: email.trim(), senha: 'redefinida' } });
    } catch (err) {
      setLoading(false);
      const { status, message, fieldErrors: apiErrors } = parseApiError(
        err,
        'Não foi possível redefinir a senha. Tente novamente mais tarde.'
      );

      if (status === 429) {
        // O backend invalidou o código: só um novo pedido, depois do bloqueio, destrava a recuperação
        setBlockedUntil(Date.now() + BLOCK_DURATION_MS);
        setCodeExpiresAt(null);
        setResendAt(null);
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setFieldErrors({});
        setInfo(null);
        setStep('blocked');
      } else if (status === 400 && (apiErrors.code || apiErrors.newPassword)) {
        setFieldErrors({ code: apiErrors.code, newPassword: apiErrors.newPassword });
      } else if (status === 400) {
        // Ex.: "Código inválido ou expirado."
        setFieldErrors({ code: message });
      } else {
        setError(message);
      }
    }
  };

  if (step === 'blocked') {
    const unlocked = blockRemaining === 0;
    return (
      <Screen
        header={
          <StepHeader
            title="Recuperação de senha"
            subtitle="Protegemos sua conta contra tentativas repetidas."
            onBack={backToLogin}
          />
        }
      >
        <View style={styles.blockedIntro}>
          <View style={styles.lockBox}>
            <Icon name="lock-closed-outline" size={36} color={colors.warning} />
          </View>
          <Text style={[typography.title, styles.center]} accessibilityRole="header">
            Tentativas temporariamente bloqueadas
          </Text>
          <Text style={[typography.muted, styles.center]}>
            Foram informados 3 códigos incorretos. Aguarde 15 minutos e solicite um novo código.
          </Text>
        </View>

        <View
          style={styles.countdownBox}
          accessible
          accessibilityLabel={
            unlocked
              ? 'Você já pode solicitar um novo código'
              : `Tente novamente em ${Math.ceil(blockRemaining / 60)} minutos`
          }
        >
          <Text style={styles.countdownLabel}>{unlocked ? 'Liberado' : 'Tente novamente em'}</Text>
          <Text style={styles.countdownValue}>{formatCountdown(blockRemaining)}</Text>
        </View>

        <Banner message="Se você não solicitou a recuperação, sua senha atual continua válida." />

        {unlocked ? (
          <Button label="Solicitar novo código" icon="refresh" onPress={backToEmail} />
        ) : (
          <Button label="Voltar ao login" icon="arrow-back" onPress={backToLogin} />
        )}
      </Screen>
    );
  }

  if (step === 'email') {
    return (
      <Screen
        header={
          <StepHeader
            title="Recupere sua senha"
            subtitle="Informe o e-mail da sua conta para receber o código de segurança."
            onBack={backToLogin}
            step={{ current: 1, total: 2 }}
          />
        }
      >
        {error && <Banner tone="danger" title="Não foi possível enviar" message={error} />}

        <TextField
          label="E-mail"
          required
          icon="mail-outline"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearFieldError('email');
          }}
          placeholder="nome@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={requestCode}
          editable={!loading}
          error={fieldErrors.email}
        />

        <Banner
          icon="lock-closed-outline"
          message="Se o e-mail estiver cadastrado, você receberá um código de 6 dígitos, válido por 10 minutos."
        />

        <Button label="Enviar código" icon="send-outline" loading={loading} loadingLabel="Enviando..." onPress={requestCode} />
        <Button label="Voltar ao login" variant="link" onPress={backToLogin} />
      </Screen>
    );
  }

  const codeExpired = codeRemaining === 0;

  return (
    <Screen
      header={
        <StepHeader
          title="Crie uma nova senha"
          subtitle="Digite o código recebido por e-mail e escolha a nova senha."
          onBack={backToEmail}
          step={{ current: 2, total: 2 }}
        />
      }
    >
      <View style={styles.sentTo}>
        <Text style={[typography.muted, styles.center]}>Código enviado para</Text>
        <Text style={[typography.label, styles.center]} selectable>
          {email.trim()}
        </Text>
        <Button label="Trocar e-mail" variant="link" onPress={backToEmail} disabled={busy} />
      </View>

      {error && <Banner tone="danger" title="Não foi possível concluir" message={error} />}
      {info && !error && <Banner message={info} />}

      <CodeInput
        label="Código de segurança"
        value={code}
        onChange={(value) => {
          setCode(value);
          clearFieldError('code');
        }}
        length={CODE_LENGTH}
        editable={!loading}
        error={fieldErrors.code}
      />

      <Card style={styles.validity}>
        <View style={styles.validityRow}>
          <Text style={typography.muted}>Validade</Text>
          <Text style={typography.label}>10 minutos</Text>
        </View>
        <View style={styles.validityRow}>
          <Text style={typography.muted}>Tempo restante</Text>
          <Text style={[typography.label, codeExpired && styles.expired]}>
            {codeExpired ? 'Expirado' : formatCountdown(codeRemaining)}
          </Text>
        </View>
      </Card>

      {codeExpired && (
        <Banner tone="warning" message="O código expirou. Toque em “Reenviar código” para receber outro." />
      )}

      <View style={styles.resendRow}>
        <Text style={typography.muted}>
          {resendIn > 0 ? `Reenviar em ${formatCountdown(resendIn)}` : 'Não recebeu o código?'}
        </Text>
        <Button
          label="Reenviar código"
          variant="link"
          loading={resending}
          loadingLabel="Reenviando..."
          disabled={resendIn > 0 || loading}
          onPress={resendCode}
        />
      </View>

      <PasswordField
        label="Nova senha"
        required
        value={newPassword}
        onChangeText={(text) => {
          setNewPassword(text);
          clearFieldError('newPassword');
        }}
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!loading}
        error={fieldErrors.newPassword}
      />
      <PasswordChecklist password={newPassword} />
      <PasswordField
        label="Confirmar nova senha"
        required
        hint="As duas senhas devem ser iguais."
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          clearFieldError('confirmPassword');
        }}
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!loading}
        error={fieldErrors.confirmPassword}
      />

      <Banner icon="shield-checkmark-outline" message="Ao salvar, sua sessão será encerrada em outros dispositivos." />

      <Button
        label="Salvar nova senha"
        icon="checkmark"
        loading={loading}
        loadingLabel="Salvando..."
        disabled={resending}
        onPress={savePassword}
      />
      <Button label="Cancelar" variant="link" onPress={backToLogin} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  blockedIntro: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockBox: {
    width: 88,
    height: 88,
    borderRadius: radius.lg + 4,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  countdownBox: {
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  countdownLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.warning,
  },
  countdownValue: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 48,
    color: colors.primaryDark,
  },
  sentTo: {
    alignItems: 'center',
  },
  validity: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  validityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expired: {
    color: colors.danger,
  },
  resendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -spacing.sm,
  },
});
