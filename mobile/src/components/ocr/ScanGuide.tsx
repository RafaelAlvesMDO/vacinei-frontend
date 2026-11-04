import { StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Card, Icon, Screen, StepHeader, type IconName } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { SUPPORTED_MODELS } from '@/utils/ocr';

// Câmera negada: `canAskAgain` false quando o sistema não deixa perguntar de novo (só nas configurações)
export interface CameraDenied {
  canAskAgain: boolean;
}

interface Props {
  subtitle: string;
  busy: 'camera' | 'gallery' | null;
  cameraDenied: CameraDenied | null;
  // Erro ao abrir a câmera ou a galeria
  pickError: string | null;
  onCamera: () => void;
  onGallery: () => void;
  onManual: () => void;
  onOpenSettings: () => void;
  onBack: () => void;
}

const TIPS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'scan-outline', title: 'Página inteira', text: 'Fotografe a página toda (ou as duas páginas abertas), sem cortar as bordas da tabela.' },
  { icon: 'albums-outline', title: 'Caderneta plana', text: 'Apoie a caderneta numa mesa e fotografe de frente, sem inclinar.' },
  { icon: 'sunny-outline', title: 'Boa iluminação', text: 'Prefira um ambiente claro, com luz uniforme.' },
  { icon: 'contrast-outline', title: 'Sem sombra ou reflexo', text: 'Evite a sombra do celular e a luz direta sobre o papel.' },
];

/**
 * Etapa 1: orientação antes da foto (RF004). A permissão da câmera só é pedida ao tocar em "Tirar foto",
 * depois desta explicação; negada, a galeria e o cadastro manual continuam disponíveis
 */
export function ScanGuide({ subtitle, busy, cameraDenied, pickError, onCamera, onGallery, onManual, onOpenSettings, onBack }: Props) {
  return (
    <Screen
      header={<StepHeader title="Digitalizar caderneta" subtitle={subtitle} onBack={onBack} step={{ current: 1, total: 4 }} />}
      footer={
        <View style={styles.actions}>
          <Button
            label="Tirar foto"
            icon="camera-outline"
            onPress={onCamera}
            loading={busy === 'camera'}
            loadingLabel="Abrindo a câmera..."
            disabled={busy !== null}
            accessibilityHint="O app pede acesso à câmera para fotografar a caderneta"
          />
          <Button
            label="Escolher da galeria"
            icon="image-outline"
            variant="secondary"
            onPress={onGallery}
            loading={busy === 'gallery'}
            loadingLabel="Abrindo a galeria..."
            disabled={busy !== null}
          />
          <Button label="Cadastrar manualmente" icon="create-outline" variant="link" onPress={onManual} disabled={busy !== null} />
        </View>
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name="camera-outline" size={32} color={colors.primary} />
        </View>
        <Text style={[typography.title, styles.center]}>Digitalize a caderneta</Text>
        <Text style={[typography.muted, styles.center]}>
          Tire uma foto da caderneta física: o app lê as doses e você confere cada uma antes de salvar.
        </Text>
      </View>

      {cameraDenied && (
        <Banner
          tone="warning"
          title="Sem acesso à câmera"
          message={
            cameraDenied.canAskAgain
              ? 'Sem a permissão, não dá para tirar a foto pelo app. Você pode escolher uma foto da galeria ou cadastrar as doses manualmente.'
              : 'A câmera foi bloqueada para o app. Libere nas configurações do aparelho, escolha uma foto da galeria ou cadastre as doses manualmente.'
          }
        >
          {!cameraDenied.canAskAgain && (
            <Button label="Abrir configurações" icon="settings-outline" variant="link" onPress={onOpenSettings} style={styles.inlineAction} />
          )}
        </Banner>
      )}
      {pickError && <Banner tone="danger" title="Não foi possível abrir a foto" message={pickError} />}

      <Card style={styles.card}>
        <Text style={typography.subtitle} accessibilityRole="header">
          Cadernetas que o app lê
        </Text>
        {SUPPORTED_MODELS.map((model) => (
          <View key={model} style={styles.model} accessible>
            <Icon name="book-outline" color={colors.primary} />
            <Text style={[typography.body, styles.flex]}>{model}</Text>
          </View>
        ))}
        <Text style={typography.muted}>Outros modelos ainda não são reconhecidos: cadastre as doses manualmente.</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={typography.subtitle} accessibilityRole="header">
          Para uma boa foto
        </Text>
        {TIPS.map((tip) => (
          <View key={tip.title} style={styles.tip} accessible accessibilityLabel={`${tip.title}. ${tip.text}`}>
            <View style={styles.tipIcon}>
              <Icon name={tip.icon} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={typography.muted}>{tip.text}</Text>
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.privacy} accessible>
        <Icon name="shield-checkmark-outline" color={colors.primary} />
        <Text style={[typography.muted, styles.flex]}>
          A foto é usada só para a leitura: não fica salva no aparelho nem no servidor.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
  card: {
    gap: spacing.md,
  },
  model: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.primaryDark,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    marginLeft: -spacing.sm,
  },
});
