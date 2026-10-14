import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import logoVacinei from '../../assets/logo-vacinei.svg';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { IDLE_TIMEOUT_MINUTES } from '../../hooks/useIdleTimeout';
import { formatIdleDuration } from '../../utils/idleTimeout';

const LAST_UPDATE = '13 de outubro de 2026';

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, title, children }) => (
  <section aria-labelledby={id} className="flex flex-col gap-3">
    <h2 id={id} className="text-lg font-semibold text-primary-dark">
      {title}
    </h2>
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted">{children}</div>
  </section>
);

const List: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-primary">{children}</ul>
);

const Term: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <strong className="font-semibold text-primary-dark">{children}</strong>
);

/**
 * Política de privacidade (LGPD, RNF10). Pública: acessível pelo login e pelo rodapé do painel.
 * O conteúdo segue as decisões registradas em docs/DECISOES.md
 */
export const PrivacyPolicy: React.FC = () => {
  usePageTitle('Política de privacidade');
  const { user } = useAuth();
  const backTo = user ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={logoVacinei} alt="" className="size-10 rounded-xl" />
            <div>
              <p className="text-base font-bold leading-tight text-primary-dark">Vacinei!?</p>
              <p className="text-xs text-muted">Gerenciador Web</p>
            </div>
          </div>
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <ArrowLeft className="size-4" />
            {user ? 'Voltar ao painel' : 'Voltar ao login'}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface text-primary">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-primary-dark">Política de privacidade</h1>
          <p className="text-sm text-muted">Última atualização: {LAST_UPDATE}</p>
          <p className="text-base leading-relaxed text-muted">
            O Vacinei!? é uma caderneta de vacinação digital desenvolvida como Trabalho de Conclusão de Curso no Centro
            Universitário CESMAC. Este gerenciador web é usado por profissionais de saúde e administradores; os cidadãos
            usam o aplicativo móvel. Aqui explicamos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018),
            quais dados tratamos, para quê, quem tem acesso, por quanto tempo e quais são os seus direitos.
          </p>
        </div>

        <div className="flex flex-col gap-8 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-8">
          <Section id="dados-coletados" title="1. Quais dados coletamos">
            <List>
              <li>
                <Term>Cadastro:</Term> nome completo, e-mail, celular, CPF, data de nascimento e senha. A senha é
                guardada apenas como hash (bcrypt), nunca em texto.
              </li>
              <li>
                <Term>Profissionais de saúde:</Term> categoria profissional, número do registro e UF. O conselho (CRM,
                COREN ou CRF) é deduzido da categoria.
              </li>
              <li>
                <Term>Dados de saúde:</Term> os registros da caderneta de vacinação: vacina, dose, data de aplicação,
                lote, situação (aguardando confirmação ou confirmado) e o profissional que confirmou a dose.
              </li>
              <li>
                <Term>Dados técnicos de sessão:</Term> os tokens de acesso ficam no navegador. Com “Lembrar de mim”,
                eles permanecem após fechar o navegador; sem a opção, são apagados ao fechar a aba. O navegador não
                guarda CPF, celular nem data de nascimento.
              </li>
            </List>
          </Section>

          <Section id="finalidades" title="2. Para que usamos os dados">
            <List>
              <li>
                <Term>CPF:</Term> identificar a pessoa de forma inequívoca no atendimento, evitando confusão entre
                homônimos e cadastros duplicados.
              </li>
              <li>
                <Term>Data de nascimento:</Term> calcular o calendário vacinal e as doses em atraso.
              </li>
              <li>
                <Term>Registro profissional:</Term> permitir que a administração confira o registro no conselho antes
                de liberar a confirmação de doses.
              </li>
              <li>
                <Term>Registros de vacinação:</Term> manter o histórico de vacinas do titular e permitir que um
                profissional confirme presencialmente as doses registradas pelo cidadão.
              </li>
              <li>
                <Term>E-mail:</Term> acesso à conta e envio do código de recuperação de senha.
              </li>
              <li>
                <Term>Indicadores:</Term> totais agregados (cadernetas, doses registradas e doses em atraso), sem
                identificar pessoas, para acompanhar a cobertura vacinal.
              </li>
            </List>
            <p>
              Os dados de saúde são tratados para a tutela da saúde, em procedimentos realizados por profissionais de
              saúde (art. 11, II, “f”, da LGPD), e só na medida necessária para cada finalidade.
            </p>
          </Section>

          <Section id="acesso" title="3. Quem tem acesso">
            <List>
              <li>
                <Term>O titular</Term> vê todos os próprios dados, inclusive o CPF completo.
              </li>
              <li>
                <Term>Profissional de saúde verificado:</Term> encontra um cidadão pelo nome ou pelo CPF completo e
                recebe de volta o CPF mascarado (ex.: ***.123.456-**). Acessa a caderneta para confirmar doses, com o
                próprio nome registrado em cada confirmação, e não pode confirmar a própria vacinação. Profissionais
                ainda não verificados ou recusados não acessam dados de cidadãos.
              </li>
              <li>
                <Term>Busca ativa de doses atrasadas:</Term> o profissional verificado vê a lista de pessoas com vacina
                em atraso (nome, CPF mascarado e as vacinas atrasadas), para procurá-las e completar o esquema
                vacinal. A lista é paginada e limitada a 100 pessoas por consulta.
              </li>
              <li>
                <Term>Administrador:</Term> vê apenas números agregados de vacinação e nunca a caderneta individual de
                um cidadão, nem a lista da busca ativa. Gerencia vacinas, UBS e contas (com CPF mascarado) e verifica
                os registros profissionais.
              </li>
            </List>
            <p>
              Os dados não são vendidos nem compartilhados com terceiros. A consulta de CEP (ViaCEP), usada no cadastro
              de UBS, envia apenas o CEP da unidade, sem dados pessoais.
            </p>
          </Section>

          <Section id="seguranca" title="4. Como protegemos os dados">
            <List>
              <li>Senhas e códigos de recuperação guardados só como hash. O código vale 10 minutos e é bloqueado após 3 tentativas erradas.</li>
              <li>
                O login responde com a mesma mensagem para e-mail inexistente e senha errada, para não revelar quem
                tem conta.
              </li>
              <li>Uma conta desativada perde o acesso imediatamente, e a troca de senha encerra as outras sessões.</li>
              <li>
                A sessão no gerenciador web é encerrada após {formatIdleDuration(IDLE_TIMEOUT_MINUTES)} sem uso, com
                um aviso antes, que permite continuar conectado.
              </li>
              <li>Cada perfil acessa apenas as telas e os dados necessários à sua função.</li>
            </List>
          </Section>

          <Section id="retencao" title="5. Por quanto tempo guardamos">
            <List>
              <li>
                Os dados de cadastro e os registros de vacinação são mantidos enquanto a conta existir, porque formam o
                histórico de saúde do titular.
              </li>
              <li>
                Uma conta desativada deixa de acessar o sistema, mas os registros de vacinação são preservados, pois
                fazem parte do histórico vacinal e das confirmações feitas pelos profissionais. Pelo mesmo motivo,
                vacinas e UBS são desativadas, e não excluídas.
              </li>
              <li>O código de recuperação de senha expira em 10 minutos, e o token de acesso, em 15 minutos.</li>
            </List>
          </Section>

          <Section id="direitos" title="6. Seus direitos como titular">
            <p>Pelo art. 18 da LGPD, você pode solicitar:</p>
            <List>
              <li>confirmação de que tratamos seus dados e acesso a eles;</li>
              <li>correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
              <li>portabilidade dos dados;</li>
              <li>informação sobre com quem os dados foram compartilhados.</li>
            </List>
            <p>
              Você pode alterar o próprio nome e a senha em <Term>Meu perfil</Term>. E-mail, celular, CPF e data de
              nascimento não são alterados pelo próprio usuário, para evitar o sequestro da conta. Para esses casos e
              para os demais pedidos, procure a administração do Vacinei!?.
            </p>
          </Section>
        </div>
      </main>

      <footer className="px-4 pb-8 text-center text-sm text-muted">© 2026 Vacinei!? — Centro Universitário CESMAC</footer>
    </div>
  );
};

export default PrivacyPolicy;
