import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Card, Screen, StepHeader } from '@/components/ui';
import { colors, fonts, spacing, typography } from '@/theme';

// Versão do app.json (expo.version)
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const LOGOS = [
  {
    source: require('@/assets/images/sobre/logo-citec.png'),
    label: 'Logo do CITEC – CESMAC',
    aspectRatio: 199 / 186,
  },
  {
    source: require('@/assets/images/sobre/logo-medicina-cesmac.png'),
    label: 'Logo da Medicina CESMAC',
    aspectRatio: 258 / 195,
  },
] as const;

const CREDITS: { title: string; names: string[] }[] = [
  { title: 'Professores', names: ['Alessandra Nascimento Pontes', 'Jandson de Oliveira Soares'] },
  { title: 'Orientador', names: ['Wagner Palmeira'] },
  { title: 'Desenvolvedor responsável', names: ['Rafael Alves Mata de Oliveira'] },
  { title: 'Designers', names: ['Dayane Pontes', 'CITEC'] },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={typography.subtitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

/**
 * Sobre o aplicativo: instituições, equipe do TCC, aviso de uso educacional, versão e créditos.
 * Pública como a Política de privacidade, aberta pelo Perfil das duas alas
 */
export default function About() {
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen header={<StepHeader title="Sobre o aplicativo" onBack={goBack} />}>
      <Card style={styles.card}>
        <Section title="Desenvolvido por">
          <View style={styles.logos}>
            {LOGOS.map((logo) => (
              <View key={logo.label} style={styles.logoBox}>
                <Image
                  source={logo.source}
                  style={[styles.logo, { aspectRatio: logo.aspectRatio }]}
                  contentFit="contain"
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={logo.label}
                  accessibilityIgnoresInvertColors
                />
              </View>
            ))}
          </View>
        </Section>

        {CREDITS.map((group) => (
          <Section key={group.title} title={group.title}>
            <View style={styles.names}>
              {group.names.map((name) => (
                <Text key={name} style={typography.body}>
                  {name}
                </Text>
              ))}
            </View>
          </Section>
        ))}
      </Card>

      <Banner
        tone="warning"
        icon="school-outline"
        title="Projeto educacional"
        message="Projeto desenvolvido para fins educacionais, como Trabalho de Conclusão de Curso de Sistemas de Informação do Centro Universitário CESMAC. Não substitui a caderneta de vacinação oficial nem orientação profissional de saúde."
      />

      <View style={styles.footer}>
        <Text style={styles.version}>Vacinei!? · Versão {APP_VERSION}</Text>
        <Button
          label="Política de privacidade"
          variant="link"
          icon="document-text-outline"
          onPress={() => router.push('/privacidade')}
        />
        <Text style={[typography.muted, styles.center]}>Mapas © colaboradores do OpenStreetMap</Text>
        <Text style={[typography.muted, styles.center]}>Leitura de cadernetas com Tesseract OCR</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  logos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  logoBox: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  logo: {
    width: '100%',
    maxWidth: 140,
  },
  names: {
    gap: spacing.xs,
    paddingLeft: spacing.lg,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  version: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
