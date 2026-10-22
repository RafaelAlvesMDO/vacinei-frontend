import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Icon, Screen, StepHeader } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';

const LAST_UPDATE = '21 de outubro de 2026';

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

function Paragraph({ children }: { children: ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function Item({ term, children }: { term?: string; children: ReactNode }) {
  return (
    <View style={styles.item}>
      <Text style={styles.bullet} importantForAccessibility="no" accessibilityElementsHidden>
        •
      </Text>
      <Text style={[styles.paragraph, styles.itemText]}>
        {term &&<Text style={styles.term}>{term} </Text>}
        {children}
      </Text>
    </View>
  );
}

/**
 * Política de privacidade (LGPD, RNF10). Mesmo conteúdo da página /privacidade do web, adaptado ao app:
 * consentimento no cadastro (art. 11, I) e sessão guardada no armazenamento seguro do aparelho
 */
export default function PrivacyPolicy() {
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen header={<StepHeader title="Política de privacidade" subtitle={`Última atualização: ${LAST_UPDATE}`} onBack={goBack} />}>
      <View style={styles.intro}>
        <View style={styles.iconBox}>
          <Icon name="shield-checkmark-outline" size={24} />
        </View>
        <Paragraph>
          O Vacinei!? é uma caderneta de vacinação digital desenvolvida como Trabalho de Conclusão de Curso no Centro
          Universitário CESMAC. Aqui explicamos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), quais
          dados tratamos, para quê, quem tem acesso, por quanto tempo e quais são os seus direitos.
        </Paragraph>
      </View>

      <Card style={styles.card}>
        <Section title="1. Quais dados coletamos">
          <Item term="Cadastro:">
            nome completo, e-mail, celular, CPF, data de nascimento e senha. A senha é guardada apenas como hash
            (bcrypt), nunca em texto.
          </Item>
          <Item term="Profissionais de saúde:">
            categoria profissional, número do registro e UF. O conselho (CRM, COREN ou CRF) é deduzido da categoria.
          </Item>
          <Item term="Dados de saúde:">
            os registros da caderneta de vacinação: vacina, dose, data de aplicação, lote, situação (aguardando
            confirmação ou confirmado) e o profissional que confirmou a dose.
          </Item>
          <Item term="Dados de sessão no aparelho:">
            os tokens de acesso e o mínimo do usuário (nome, e-mail e perfil) ficam no armazenamento seguro do
            celular até você sair. O app não guarda CPF, celular nem data de nascimento no aparelho.
          </Item>
        </Section>

        <Section title="2. Para que usamos os dados">
          <Item term="CPF:">
            identificar a pessoa de forma inequívoca no atendimento, evitando confusão entre homônimos e cadastros
            duplicados.
          </Item>
          <Item term="Data de nascimento:">calcular o calendário vacinal e as doses em atraso.</Item>
          <Item term="Registro profissional:">
            permitir que a administração confira o registro no conselho antes de liberar a confirmação de doses.
          </Item>
          <Item term="Registros de vacinação:">
            manter o histórico de vacinas do titular e permitir que um profissional confirme presencialmente as doses
            registradas pelo cidadão.
          </Item>
          <Item term="E-mail:">acesso à conta e envio do código de recuperação de senha.</Item>
          <Item term="Indicadores:">
            totais agregados (cadernetas, doses registradas e doses em atraso), sem identificar pessoas, para
            acompanhar a cobertura vacinal.
          </Item>
        </Section>

        <Section title="3. Seu consentimento">
          <Paragraph>
            Registros de vacinação são dados pessoais sensíveis. No cadastro pelo app, você dá o consentimento
            específico e destacado para o tratamento dos seus dados de saúde (art. 11, I, da LGPD), para as
            finalidades acima. Sem ele, a conta não é criada.
          </Paragraph>
          <Paragraph>
            A confirmação presencial das doses por profissionais de saúde também se apoia na tutela da saúde (art. 11,
            II, “f”). Os dados são tratados só na medida necessária para cada finalidade.
          </Paragraph>
        </Section>

        <Section title="4. Quem tem acesso">
          <Item term="O titular">vê todos os próprios dados, inclusive o CPF completo.</Item>
          <Item term="Profissional de saúde verificado:">
            encontra um cidadão pelo nome ou pelo CPF completo e recebe de volta o CPF mascarado (ex.: ***.123.456-**).
            Acessa a caderneta para confirmar doses, com o próprio nome registrado em cada confirmação, e não pode
            confirmar a própria vacinação. Profissionais ainda não verificados ou recusados não acessam dados de
            cidadãos.
          </Item>
          <Item term="Busca ativa de doses atrasadas:">
            o profissional verificado vê a lista de pessoas com vacina em atraso (nome, CPF mascarado e as vacinas
            atrasadas), para procurá-las e completar o esquema vacinal. A lista é paginada e limitada a 100 pessoas por
            consulta.
          </Item>
          <Item term="Administrador:">
            vê apenas números agregados de vacinação e nunca a caderneta individual de um cidadão, nem a lista da busca
            ativa.
          </Item>
          <Paragraph>Os dados não são vendidos nem compartilhados com terceiros.</Paragraph>
        </Section>

        <Section title="5. Como protegemos os dados">
          <Item>
            Senhas e códigos de recuperação guardados só como hash. O código vale 10 minutos e é bloqueado após 3
            tentativas erradas.
          </Item>
          <Item>
            O login responde com a mesma mensagem para e-mail inexistente e senha errada, para não revelar quem tem
            conta.
          </Item>
          <Item>Uma conta desativada perde o acesso imediatamente, e a troca de senha encerra as outras sessões.</Item>
          <Item>
            No app, as alas Cidadão e Profissional são só navegação: cada perfil acessa apenas os dados necessários à
            sua função, conferidos pelo servidor a cada pedido.
          </Item>
        </Section>

        <Section title="6. Por quanto tempo guardamos">
          <Item>
            Os dados de cadastro e os registros de vacinação são mantidos enquanto a conta existir, porque formam o
            histórico de saúde do titular.
          </Item>
          <Item>
            Uma conta desativada deixa de acessar o sistema, mas os registros de vacinação são preservados, pois fazem
            parte do histórico vacinal e das confirmações feitas pelos profissionais.
          </Item>
          <Item>O código de recuperação de senha expira em 10 minutos, e o token de acesso, em 15 minutos.</Item>
        </Section>

        <Section title="7. Seus direitos como titular">
          <Paragraph>Pelo art. 18 da LGPD, você pode solicitar:</Paragraph>
          <Item>confirmação de que tratamos seus dados e acesso a eles;</Item>
          <Item>correção de dados incompletos, inexatos ou desatualizados;</Item>
          <Item>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</Item>
          <Item>portabilidade dos dados;</Item>
          <Item>informação sobre com quem os dados foram compartilhados;</Item>
          <Item>revogação do consentimento, a qualquer momento.</Item>
          <Paragraph>
            E-mail, celular, CPF e data de nascimento não são alterados pelo próprio usuário, para evitar o sequestro
            da conta. Para esses casos e para os demais pedidos, procure a administração do Vacinei!?.
          </Paragraph>
        </Section>
      </Card>

      <Text style={[typography.muted, styles.footer]}>© 2026 Vacinei!? — Centro Universitário CESMAC</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  paragraph: {
    ...typography.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  itemText: {
    flex: 1,
  },
  term: {
    fontFamily: fonts.semibold,
    color: colors.primaryDark,
  },
  item: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    ...typography.muted,
    color: colors.primary,
    fontSize: 15,
    lineHeight: 23,
  },
  footer: {
    textAlign: 'center',
  },
});
