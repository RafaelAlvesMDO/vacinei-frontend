import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type TextInput } from 'react-native';
import { BrandHeader } from '@/components/BrandHeader';
import { Banner, Button, PasswordField, Screen, TextField, type BannerTone } from '@/components/ui';
import { AdminAccessError } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/services/api';
import { parseApiError } from '@/services/auth';
import { colors, spacing, typography } from '@/theme';
import { validateEmail } from '@/utils/email';

type LoginParams = {
  email?: string;
  // Volta do cadastro ("cidadao" | "profissional") ou da recuperação de senha ("redefinida")
  cadastro?: string;
  senha?: string;
};

interface Notice {
  tone: BannerTone;
  title: string;
  message: string;
}

type FieldErrors = Partial<Record<'email' | 'password', string>>;

function getReturnNotice({ cadastro, senha }: LoginParams): Notice | null {
  if (cadastro === 'profissional') {
    return {
      tone: 'success',
      title: 'Cadastro enviado',
      message:
        'Entre com seu e-mail e senha. Seu registro profissional ficará em análise; enquanto isso, você já pode usar a ala Cidadão.',
    };
  }
  if (cadastro === 'cidadao') {
    return { tone: 'success', title: 'Conta criada', message: 'Entre com seu e-mail e senha para começar.' };
  }
  if (senha === 'redefinida') {
    return { tone: 'success', title: 'Senha redefinida', message: 'Entre com a nova senha.' };
  }
  return null;
}

/**
 * Login único por e-mail e senha (RF002, D23). Mensagens do D17: 401 genérico e 403 só para conta desativada
 */
export default function Login() {
  const params = useLocalSearchParams<LoginParams>();
  const { signIn, sessionExpired } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);

  // O login pode já estar montado quando o cadastro ou a recuperação devolvem o e-mail
  const [paramEmail, setParamEmail] = useState(params.email);
  if (params.email !== paramEmail) {
    setParamEmail(params.email);
    if (params.email) setEmail(params.email);
  }

  const returnNotice = getReturnNotice(params);
  const notice: Notice | null =
    error ??
    (!API_URL
      ? {
          tone: 'danger',
          title: 'API não configurada',
          message: 'EXPO_PUBLIC_API_URL não está definida. Crie o mobile/.env a partir do .env.example e reinicie o Expo.',
        }
      : sessionExpired
        ? { tone: 'warning', title: 'Sessão encerrada', message: 'Sua sessão expirou. Entre novamente.' }
        : returnNotice);

  const handleSubmit = async () => {
    const errors: FieldErrors = {
      email: validateEmail(email) ?? undefined,
      password: password ? undefined : 'Informe sua senha.',
    };
    setFieldErrors(errors);
    setError(null);
    if (errors.email || errors.password) return;

    setLoading(true);
    try {
      // No sucesso, o layout raiz troca a rota (ala Cidadão, ala Profissional ou escolha da ala)
      await signIn({ email, password });
    } catch (err) {
      setLoading(false);
      if (err instanceof AdminAccessError) {
        setError({ tone: 'warning', title: 'Use o Gerenciador Web', message: err.message });
        return;
      }
      const { status, message, fieldErrors: apiErrors } = parseApiError(err, 'Não foi possível entrar. Tente novamente.');
      if (status === 401) {
        setError({ tone: 'danger', title: 'Não foi possível entrar', message: 'E-mail ou senha inválidos.' });
        setFieldErrors({ password: 'Revise suas credenciais e tente novamente.' });
      } else if (status === 403) {
        setError({ tone: 'danger', title: 'Conta desativada', message });
      } else if (status === 400 && (apiErrors.email || apiErrors.password)) {
        setFieldErrors({ email: apiErrors.email, password: apiErrors.password });
      } else {
        setError({ tone: 'danger', title: 'Não foi possível entrar', message });
      }
    }
  };

  return (
    <Screen>
      <BrandHeader />

      <View style={styles.intro}>
        <Text style={styles.title} accessibilityRole="header">
          Boas-vindas
        </Text>
        <Text style={[typography.body, styles.subtitle]}>
          Entre para acompanhar sua caderneta de vacinação com segurança.
        </Text>
      </View>

      {notice && <Banner tone={notice.tone} title={notice.title} message={notice.message} />}

      <TextField
        label="E-mail"
        icon="mail-outline"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setFieldErrors((current) => ({ ...current, email: undefined }));
        }}
        placeholder="nome@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!loading}
        error={fieldErrors.email}
      />

      <PasswordField
        ref={passwordRef}
        label="Senha"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setFieldErrors((current) => ({ ...current, password: undefined }));
        }}
        placeholder="Sua senha"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        editable={!loading}
        error={fieldErrors.password}
      />

      <Button
        label="Esqueci minha senha"
        variant="link"
        onPress={() => router.push({ pathname: '/recuperar-senha', params: { email: email.trim() } })}
        style={styles.forgot}
      />

      <Button label="Entrar" icon="log-in-outline" loading={loading} loadingLabel="Entrando..." onPress={handleSubmit} />

      <View style={styles.signUp}>
        <Text style={typography.muted}>Ainda não tem acesso?</Text>
        <Button label="Criar conta" variant="link" onPress={() => router.push('/cadastro')} />
      </View>

      <Banner icon="shield-checkmark-outline" message="Nunca compartilhe sua senha. O acesso é pessoal e protegido." />

      <View style={styles.footer}>
        <Button label="Política de privacidade" variant="link" onPress={() => router.push('/privacidade')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 30,
    lineHeight: 38,
  },
  subtitle: {
    color: colors.muted,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
  },
  signUp: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
