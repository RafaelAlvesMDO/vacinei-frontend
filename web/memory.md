# Memória Contínua do Projeto - VACINEI!? Front-end Web

Este documento registra o status atual, decisões de arquitetura e próximos passos do desenvolvimento do Gerenciador Web da plataforma **VACINEI!?** (TCC CESMAC). Ele deve ser consultado no início de cada sessão ou tarefa e atualizado a cada entrega ou decisão relevante.

---

## 1. Status Atual da Fase do Projeto

- **Início do Projeto Web:** 07 de Outubro de 2026
- **Fase Atual:** Fase 1 - Setup da Base Web & Estruturação do Gerenciador Administrativo
- **Meta Crítica:** Apresentação da **Pré-Banca** em **15 de Outubro de 2026**
- **Estado Atual:**
  - Projeto base inicializado com Vite (`react-ts`), React 19 e TypeScript.
  - Tailwind CSS (v4) configurado com `tailwind.config.js`, PostCSS, Autoprefixer e integrado com `@tailwindcss/vite` e `src/index.css`.
  - Dependências visuais e de comunicação instaladas e validadas: `react-router-dom`, `axios`, `lucide-react`.
  - Build de produção testado e validado (`npm run build`).
  - Skill `git_commit` em `.claude/skills/git_commit` (fluxo na branch `dev`) e `CLAUDE.md` na raiz do repositório.
  - Identidade visual oficial registrada em `docs/DESIGN.md` e aplicada via tokens do Tailwind.
  - Diretrizes do front-end formalizadas em `agent.md` (arquitetura de componentes, Tailwind CSS, rotas protegidas JWT/RBAC e consumo de API).
  - Repositório Git sincronizado na branch `main` no GitHub (`https://github.com/RafaelAlvesMDO/vacinei-frontend.git`).
  - Desenvolvimento ocorre na branch `dev`; PRs para `main` apenas sob solicitação.
  - Etapa 3 concluída: `AppLayout` reutilizável e dashboard por perfil (`recharts` instalado).
  - Etapa 4 concluída: confirmação de vacina (RF010) em `/confirmar-vacina`.
- **Data da Última Atualização:** 2026-10-12

---

## 2. Histórico de Decisões de Arquitetura

1. **Stack Base & Ferramental:**
   - **Vite + React (v19) + TypeScript:** Setup moderno com compilação ultra-rápida e tipagem estática rigorosa.
   - **Tailwind CSS (v4):** Estilização utilitária de alta performance para um layout corporativo e responsivo.
   - **React Router DOM (v7):** Roteamento declarativo com separação entre rotas públicas e rotas protegidas por papéis (RBAC).
   - **Lucide React:** Conjunto consistente de ícones para ações de saúde e navegação administrativa.

2. **Público-Alvo do Painel Web:**
   - Focado exclusivamente em **Profissionais de Saúde** (`PROFISSIONAL_SAUDE`) e **Administradores** (`ADMIN`), alinhado com o backend na porta `3333`. Cidadãos comuns utilizam o aplicativo mobile.

3. **Comunicação com o Backend:**
   - Cliente Axios centralizado em `src/services/api.ts` com `baseURL: http://localhost:3333`.
   - Gerenciamento de tokens JWT (Access Token de 15 min + Refresh Token) com interceptor automático para renovação de sessão e autorização Bearer.

4. **Controle de Acesso e Segurança (RBAC):**
   - Middleware/componente `ProtectedRoute` para bloquear acessos não autorizados e redirecionar perfis incompatíveis.

5. **Identidade Visual (`docs/DESIGN.md`):**
   - O web segue a identidade do app mobile: nome **Vacinei!?**, primária `#087F6B`, fonte Inter (Google Fonts no `index.html`).
   - Tokens no `tailwind.config.js`: `primary`, `primary-dark`, `accent`, `surface`, `background`, `muted`, `border`, `danger`/`danger-soft`, `warning`/`warning-soft`, `success`/`success-soft`. Novas telas devem usar os tokens, e não as cores padrão do Tailwind (`sky`, `slate` etc.).
   - Logos: `src/assets/logo-vacinei.svg` (login/sidebar) e `src/assets/icone-vacinei.svg` (favicon).

---

## 3. Roteiro para Apresentação da Pré-Banca (Até 15/Outubro/2026)

- [x] **Inicialização do Projeto Web:** Scaffold Vite React TS, Tailwind CSS, Axios, Lucide React e React Router.
- [x] **Diretrizes e Memória do Agente:** Criação de `agent.md` e `memory.md` estabelecendo padrões de código e arquitetura.
- [x] **Configuração do Cliente HTTP & Serviço de Autenticação (`src/services/api.ts` e `src/services/auth.ts`):** Chamada POST pronta para `/sessions` (com suporte e fallback para `/auth/login`), tipagens em `src/types/auth.ts` e persistência de sessão.
- [x] **Tela de Login/Autenticação (`src/pages/auth/Login.tsx`):** Componente visual responsivo baseado na referência de design, com validações de formulário, exibição dinâmica de erros, loading states e proteção RBAC contra acesso de cidadãos.
- [x] **Modais de Autenticação Complementar (`src/pages/auth/RequestAccessModal.tsx`, `ForgotPasswordModal.tsx` e `src/components/ui/Modal.tsx`):** Fluxos fiéis ao design do "Criar conta" / "Solicitar Acesso", estado de confirmação "Solicitação Enviada" com ícone de envio e modal "Esqueci a Senha", integrados ao login e com métodos de API preparados em `src/services/auth.ts`.
- [x] **Recuperação de Senha Integrada ao Backend (`ForgotPasswordModal.tsx`):** Fluxo em etapas conectado a `POST /auth/forgot-password` e `POST /auth/reset-password` (código de 6 dígitos + nova senha), com reenvio de código (cooldown de 30s), erros de validação por campo (`issues` do Zod), tratamento de `429` (aguardar 15 min e solicitar novo código) e retorno ao login após sucesso. Helper `parseApiError` em `src/services/auth.ts` normaliza erros da API.
- [x] **Regra de Senha RF001 (`src/utils/password.ts`):** `validatePassword()` e `PASSWORD_REQUIREMENTS` (mín. 8 caracteres, maiúscula, minúscula, número e símbolo) aplicados na redefinição de senha, com checklist visual. O login só exige a senha preenchida.
- [x] **Base de Sessão (Contexto Global de Autenticação):**
  - Tipos alinhados ao contrato: `professionalRegistry: { isVerified, status } | null` (login e `/auth/me`) e `UserProfile` para o `/auth/me`.
  - `src/services/tokenStorage.ts` centraliza tokens e usuário (localStorage com "Lembrar de mim", senão sessionStorage).
  - `src/services/api.ts` renova o token no `401` via `POST /auth/refresh` (requisição única compartilhada e nova tentativa). Se falhar, limpa a sessão e chama o callback `onSessionExpired`.
  - O login usa apenas `POST /auth/login`; a chamada a `/sessions` foi removida.
  - `src/contexts/AuthContext.tsx` + `src/hooks/useAuth.ts` expõem `signIn`, `signOut` e `refreshProfile` e restauram a sessão via `/auth/me`. Cidadãos são barrados (`CitizenAccessError`).
  - `ProtectedRoute` (`allowedRoles`), `PublicRoute`, `React.lazy` + `Suspense` e um dashboard provisório com aviso de registro pendente ou recusado.
- [x] **Identidade Visual Vacinei!?:** `docs/DESIGN.md`, tokens de cor e fonte Inter no Tailwind, login redesenhado no estilo do app (logo oficial, "Boas-vindas", inputs arredondados, botão primário largo, caixa de aviso verde-clara), modais, dashboard provisório e spinner na paleta nova. Favicon e título "Vacinei!? | Gerenciador Web".
- [x] **Layout do Gerenciador Web (`src/layouts/AppLayout.tsx`):** rota-layout com `<Outlet />` dentro do `ProtectedRoute`. `components/layout/`: `Sidebar` (menu filtrado por perfil, drawer no mobile e "Sair" no rodapé), `Topbar` ("Vacinei!?" + nome/perfil), `PageHeader` (título, subtítulo e slot de ações) e `Footer`.
- [x] **Dashboard (`/dashboard`, RF009):** 4 `StatCard`s (`/dashboard/summary` + último mês do `/dashboard/monthly`), gráfico de linha mensal com `recharts`, atalhos rápidos e card direito por perfil (LGPD): `RecentDosesCard` para o profissional e `PendingProfessionalsCard` (`GET /professionals?verified=false`) para o ADMIN. Busca de cidadãos (`GET /citizens`, debounce, mín. 2 caracteres) só para o profissional, levando a `/confirmar-vacina?citizenId=<id>`. Profissional não verificado (ou `403` da API) vê apenas o `VerificationNotice`.
  - Reutilizáveis: `hooks/useAsync` (dados, erro normalizado por `parseApiError`, `reload`), `hooks/useDebounce`, `utils/format` (`formatMonthLabel` → "nov/25", datas pt-BR), `utils/roles`, `components/ui/{Card,StatCard,CardState,Badge}`.
  - Doses recentes: `CONFIRMADO` mostra badge accent "Confirmado"; qualquer outro status mostra "Aguardando confirmação" (warning), pois é registro do cidadão ainda não confirmado (RF007 nota 7). O `/dashboard/recent-doses` não retorna `origin`.
  - `/profissionais` (só ADMIN) usa `pages/UnderConstruction.tsx` até a etapa 5.
- [x] **Confirmação de Vacina (`/confirmar-vacina`, RF010/RS006):** `pages/records/ConfirmVaccination.tsx` (só PROF verificado; senão `VerificationNotice`). `?citizenId=` abre `CitizenVaccinationCard` (com `key` por cidadão); sem ele, a busca do cabeçalho.
  - `CitizenSearch` e `VerificationNotice` foram movidos para `components/citizens/` e `components/feedback/` (usados pelo dashboard e pela confirmação).
  - Serviços: `getVaccinationCard` (`services/citizens.ts`), `listVaccines` (`services/vaccines.ts`) e `confirmDose` (`services/vaccinationRecords.ts`). Tipos em `types/vaccination.ts`.
  - A caderneta da API não traz o esquema de doses da vacina, então o modal usa o `GET /vaccines` para listar as doses. Doses já `CONFIRMADO` ficam desabilitadas e doses registradas pelo cidadão aparecem marcadas.
  - Sugestão (RF010 notas 2 e 3): a vacina vem do botão clicado (ou o profissional escolhe, com as pendentes primeiro) e a dose vem do `nextDose` ou é a primeira não confirmada. As duas são editáveis.
  - Lote convertido para maiúsculas ao digitar e validado por `^[A-Z0-9]{1,20}$`. Data e profissional (usuário logado) somente leitura.
  - Feedback (RNF03): banner `success-soft` por 8 s ("Dose registrada" / "Registro do cidadão confirmado"), badge "Atualizada agora" na vacina e recarga da caderneta mantendo os dados na tela. `409` → "Esta dose já foi confirmada" no modal e recarga da caderneta.
  - `Modal` ganhou `max-h` e rolagem interna para formulários longos no celular.
- [ ] **Módulo de Vacinas (`/vaccines`):** Listagem com busca e filtros por público-alvo, detalhes da vacina e suas doses.
- [ ] **Módulo de Unidades Básicas de Saúde (`/ubs`):** Listagem das 36 UBSs de Maceió/AL cadastradas no backend, busca por nome/bairro e visualização de dados de contato/coordenadas.
- [ ] **Registro e Confirmação de Doses (`/records`):** Interface para profissionais de saúde confirmarem a aplicação presencial de doses (RS006/RF010).

---

## 4. Próximos Passos Imediatos

O roteiro detalhado das etapas está em `docs/PLANO-WEB.md` (contrato da API em `docs/API.md`).

1. **Etapa 5:** Administração de profissionais pendentes (verificar/recusar) em `/profissionais`, exclusiva para `ADMIN`; ampliar `services/professionals.ts`.
2. **Etapa 6 (aguardando o orientador):** `RequestAccessModal` vira cadastro de profissional via `POST /users`, com as regras do RF001: nome com duas palavras, celular obrigatório e categoria profissional que define o conselho. Depende do campo `category` no backend.
3. **Etapas 5b a 5f:** catálogo de vacinas, usuários e UBS (só ADMIN), perfil (RF003) e lista de cidadãos com doses atrasadas. A 5e e a 5f dependem de rotas novas no backend.
