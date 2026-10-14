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
  - Etapa 5 concluída: administração de profissionais (RS001) em `/profissionais`.
  - Etapa 6 concluída: cadastro de profissional (RF001) no "Criar conta" do login.
  - Etapa 5d concluída: gestão de UBS (RF008 nota 8) em `/ubs`.
  - Etapa 5b concluída: catálogo de vacinas em `/vacinas`.
  - Etapa 5c concluída: gestão de usuários em `/usuarios`.
  - Etapa 5e concluída: perfil do usuário (RF003) em `/perfil`.
  - Etapa 5f concluída: busca ativa de doses atrasadas (RF009, D21) dentro de `/confirmar-vacina`.
  - Etapa final concluída: acessibilidade (WCAG 2.1 AA), LGPD (`/privacidade`) e encerramento por inatividade (RNF11). Todas as etapas do `docs/PLANO-WEB.md` estão concluídas.
- **Data da Última Atualização:** 2026-10-14

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
   - Tokens no `tailwind.config.js`: `primary`, `primary-dark`, `accent`, `surface`, `background`, `muted`, `border`, `input`, `danger`/`danger-soft`, `warning`/`warning-soft`, `success`/`success-soft`. Os valores passam no contraste AA (tabela no `DESIGN.md`): campos de formulário usam `border-input`, e não `border-border`. Novas telas devem usar os tokens, e não as cores padrão do Tailwind (`sky`, `slate` etc.).
   - Logos: `src/assets/logo-vacinei.svg` (login/sidebar) e `src/assets/icone-vacinei.svg` (favicon).

---

## 3. Roteiro para Apresentação da Pré-Banca (Até 15/Outubro/2026)

- [x] **Inicialização do Projeto Web:** Scaffold Vite React TS, Tailwind CSS, Axios, Lucide React e React Router.
- [x] **Diretrizes e Memória do Agente:** Criação de `agent.md` e `memory.md` estabelecendo padrões de código e arquitetura.
- [x] **Configuração do Cliente HTTP & Serviço de Autenticação (`src/services/api.ts` e `src/services/auth.ts`):** Chamada POST pronta para `/sessions` (com suporte e fallback para `/auth/login`), tipagens em `src/types/auth.ts` e persistência de sessão.
- [x] **Tela de Login/Autenticação (`src/pages/auth/Login.tsx`):** Componente visual responsivo baseado na referência de design, com validações de formulário, exibição dinâmica de erros, loading states e proteção RBAC contra acesso de cidadãos.
- [x] **Modais de Autenticação Complementar (`src/pages/auth/RequestAccessModal.tsx`, `ForgotPasswordModal.tsx` e `src/components/ui/Modal.tsx`):** "Criar conta" (hoje o cadastro de profissional, ver etapa 6) e "Esqueci a Senha", integrados ao login.
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
- [x] **Administração de Profissionais (`/profissionais`, RS001):** `pages/professionals/Professionals.tsx` (só ADMIN), substituindo o `UnderConstruction`, que foi mantido para as próximas etapas.
  - Filtro na URL (`?status=pendentes|verificados|recusados`, padrão Pendentes). A API só filtra por `verified`: `false` traz pendentes e recusados, separados no cliente por `verificationStatus`.
  - Serviços `verifyProfessional` e `rejectProfessional(id, reason?)` em `services/professionals.ts`. `utils/councils.ts` tem `formatRegistry` ("COREN 654321/AL") e `getCouncilInfo` (conselho federal, só a página inicial oficial).
  - `VerifyProfessionalDialog` lembra de conferir o registro no site do conselho. `RejectProfessionalModal` tem motivo opcional (3 a 500 caracteres, `trim`). Para um verificado, a ação vira "Revogar" e exige marcar a ciência da perda de acesso.
  - `404`/`409` fecham o modal com um aviso warning ("lista desatualizada") e recarregam. O sucesso mostra um banner `success-soft` por 8 s e recarrega.
- [x] **Cadastro de Profissional (etapa 6, RF001):** `RequestAccessModal` envia `POST /users` com `role: "PROFISSIONAL_SAUDE"` fixo e `professionalRegistry: { category, registryNumber, uf }`. O `council` não é enviado, porque o backend o deriva da categoria (D12). A tela mostra o conselho só como informação.
  - Categorias (D13): `MEDICO` (CRM), `ENFERMEIRO`, `TECNICO_ENFERMAGEM`, `AUXILIAR_ENFERMAGEM` (COREN) e `FARMACEUTICO` (CRF), em `utils/councils.ts` (`PROFESSIONAL_CATEGORIES`, `BRAZILIAN_UFS`). O CRO foi removido.
  - Celular com máscara (`formatPhone`/`onlyDigits` em `utils/format.ts`), enviado só com números. Nome com no mínimo duas palavras.
  - `parseApiError` achata os erros aninhados do Zod em caminhos com ponto (`professionalRegistry.uf`). `409` mostra a mensagem da API.
  - Sucesso: tela "Cadastro enviado!" e, ao fechar, o login fica com o e-mail preenchido. `/auth/request-access` foi removido.
  - Reutilizáveis novos: `components/ui/FormField` (`FormField`, `FormSelect`) e `components/ui/PasswordChecklist`, também no `ForgotPasswordModal`.
  - Login: o cartão "Controle do SUS" virou "Administração" (o sistema não é integrado ao SUS).
  - D14: o cadastro exige CPF (máscara `formatCpf`, validado por `isValidCpf` em `utils/cpf.ts`, enviado só com números) e data de nascimento (não futura). `409` de CPF marca o campo e mostra "Este CPF já está cadastrado". A busca de cidadãos aceita CPF com ou sem máscara: termos só com dígitos/pontuação são enviados só com números e exigem os 11 dígitos válidos.
  - D11 (o profissional também é cidadão): a busca mostra o badge "Profissional" (`role` no `CitizenSearchResult`). Na própria caderneta (`citizenId === user.id`), as ações de confirmar ficam ocultas (`canConfirm` no `VaccineCardItem`) e aparece o aviso RS006.
- [x] **Gestão de UBS (`/ubs`, etapa 5d, RF008 nota 8):** `pages/ubs/UbsList.tsx` (só ADMIN, link "UBS" na sidebar).
  - Lista completa via `GET /ubs?includeInactive=true` (`services/ubs.ts`: `listAllUbs`, `createUbs`, `updateUbs`, `setUbsStatus`). Busca por nome/bairro (sem acentos, `pages/ubs/utils.ts`) e filtro `?status=inativas|todas` no cliente, com contadores. Padrão: Ativas.
  - `UbsFormModal`: cadastro e edição (o `PUT` leva só o que mudou). Inclui cidade e UF (exigidos pela API, padrão Maceió/AL) e CNES opcional (7 dígitos). O CNES não pode ser apagado na edição, porque vazio não é enviado. Telefone apagado vai como `""`.
  - ViaCEP em `services/viaCep.ts` (`fetch` próprio, sem o Bearer token, timeout de 8 s, `null` em falha) preenche logradouro, bairro, cidade e UF. O CEP já salvo não é consultado ao abrir a edição.
  - `formatPhone` (`utils/format.ts`) adapta a máscara: `(DD) XXXX-XXXX` com 10 dígitos e `(DD) XXXXX-XXXX` com 11. O telefone da UBS é salvo formatado (como no seed). O cadastro de profissional continua exigindo celular. `formatCep` foi adicionado.
  - Coordenadas no padrão brasileiro (placeholders e valores exibidos com vírgula: "-9,6658"). Vírgula ou ponto são aceitos, o par colado na latitude é separado e o link do OpenStreetMap abre o ponto informado.
  - Horário de funcionamento em faixas estruturadas (`pages/ubs/openingHours.ts` + `OpeningHoursField`): dias (Seg a Dom), abertura e fechamento (fechamento depois da abertura), mínimo de uma faixa e nenhum dia em duas faixas. O texto salvo é sempre gerado, no formato "Seg a Sex: 07:00 às 17:00 · Sáb: 07:00 às 14:00": 3 ou mais dias consecutivos viram intervalo, os demais são separados por vírgula e as faixas por " · ". Na edição, `parseOpeningHours` só aceita o texto se ele for idêntico ao que seria gerado. Senão, o texto antigo aparece como referência e os horários são aproveitados, com os dias em branco. Todas as 36 UBS do seed estão nesse formato antigo ("07:00 às 17:00", sem dias).
  - Na exibição (lista e prévia), cada faixa fica em uma linha (`OpeningHoursLines`, que quebra o texto em " · "). Os horários usam `components/ui/TimeInput`: um campo de texto com máscara 24h (`formatTime` em `utils/format.ts`, "0700" → "07:00", `inputMode="numeric"`, até 5 caracteres) no lugar do `input type="time"`, que mostrava AM/PM conforme o navegador (os selects de hora e minutos também foram descartados). Horário fora de 00:00 a 23:59 mostra "Horário inválido. Use o formato 24h, ex.: 17:00".
  - `UbsStatusDialog` (`PATCH /ubs/:id/status`), com o aviso de que o histórico é mantido (D10). `404` → aviso de lista desatualizada; `409` → campo CNES.
  - `components/feedback/FeedbackBanner` (aviso de 8 s, RNF03) extraído e reutilizado em Profissionais. A UBS alterada ganha o badge "Atualizada agora".
- [x] **Catálogo de Vacinas (`/vacinas`, etapa 5b):** `pages/vaccines/VaccineList.tsx` (só ADMIN, link "Vacinas" na sidebar), no padrão da tela de UBS.
  - `listAllVaccines` (`services/vaccines.ts`) busca `isActive=true` e `isActive=false` em paralelo, porque a API filtra só um status por vez. Busca por nome ou doença (sem acentos, `normalizeSearch`, movido para `utils/format.ts`), status na URL (`?status=inativas|todas`, padrão Ativas) e público-alvo na URL (`?publico=CRIANCA...`). Os contadores de status respeitam o público.
  - Cada vacina mostra nome, doença, público, quantidade de doses e status. O botão de doses expande o `DoseSchedule` (nome, idade recomendada e intervalo desde a anterior). Formatação em `pages/vaccines/utils.ts`: `formatRecommendedAge` (0 → "Ao nascer", 15 → "1 ano e 3 meses") e `formatInterval`.
  - `VaccineFormModal`: nome, doença, público-alvo (obrigatório na tela, já que a API usaria CRIANCA como padrão) e descrição. No cadastro, editor de doses (`doseNumber` sequencial, primeira dose sem intervalo, nomes únicos e `dosesCount` = número de doses). **O `PUT /vaccines/:id` não aceita doses**: na edição, o esquema aparece só para leitura e o `dosesCount` não é enviado. O `PUT` leva só o que mudou, e a descrição apagada vai como `""`.
  - Sem exclusão (princípio da D10): o `DELETE` não é usado. `VaccineStatusDialog` desativa ou reativa com `PUT { isActive }`, avisando que a vacina sai da confirmação de dose e que os registros continuam nas cadernetas. A caderneta (`GET /citizens/:id/vaccination-records`) não filtra vacinas inativas.
  - `ConfirmDoseModal`: se a vacina do botão da caderneta estiver inativa (fora do `GET /vaccines`), mostra o aviso e bloqueia o envio. A API também responderia `404`.
  - Erros: `400` por campo (inclusive `doses.N.doseName`), `409` no nome e `404` com o aviso de lista desatualizada. O sucesso usa o `FeedbackBanner` e o badge "Atualizada agora", e a vacina cadastrada já aparece com o esquema expandido.

- [x] **Gestão de Usuários (`/usuarios`, etapa 5c):** `pages/users/UserList.tsx` (só ADMIN, link "Usuários" na sidebar), no padrão das telas de UBS e vacinas.
  - `listUsers` (`services/users.ts`) busca uma página do `GET /users` (10 por página, D22). Busca (nome, e-mail ou CPF), status (`?status=inativos|todos`, padrão Ativos, enviado como `isActive`) e perfil (`?perfil=...`) vão para a API. Os contadores vêm de `counts` (respeitam perfil e busca).
  - Cada usuário mostra nome, e-mail, badge de perfil, CPF mascarado (como vem da API), data de cadastro e status. LGPD: só dados cadastrais, nada da caderneta.
  - Profissionais: categoria, registro (`formatRegistry`), badge de verificação e o link "Ver em Profissionais" (`/profissionais?status=...`). O `professionalRegistry` do `GET /users` não traz `verificationStatus`: `getVerificationStatus` (`pages/users/utils.ts`) o deriva de `isVerified` e `rejectedAt`.
  - `UserStatusDialog` usa `PUT /users/:id { isActive }` e avisa que o usuário perde o acesso imediatamente (o backend revoga as sessões ao desativar). Sem exclusão: o `DELETE /users/:id` não é usado, porque os registros de vacinação apontam para o usuário. O próprio admin aparece com o badge "Você" e sem a ação de desativar.
  - Erros: `400`, `403` e `409` com mensagem no diálogo; `404` fecha com o aviso de lista desatualizada. O sucesso usa o `FeedbackBanner` e o badge "Atualizado agora".

- [x] **Perfil do Usuário (`/perfil`, etapa 5e, RF003):** `pages/profile/Profile.tsx` (PROFISSIONAL_SAUDE e ADMIN, sem link na sidebar). O ícone de perfil da `Topbar` abre um menu com "Meu perfil" e "Sair" (fecha com Esc ou clique fora).
  - Dados via `getOwnUser` (`GET /users/me`, `services/users.ts`), que traz o registro profissional completo. O `GET /auth/me` só tem `isVerified`/`status`.
  - `PersonalDataCard`: só o nome é editável (`updateOwnName`, `PATCH /auth/me`, D19). A regra do nome do RF001 foi extraída para `utils/name.ts` (`validateFullName`, `normalizeName`, `NAME_MAX_LENGTH`), também usada no cadastro. E-mail, celular, CPF completo (titular), nascimento e perfil são só leitura; e-mail e celular têm o aviso de verificação de identidade. Profissionais veem categoria, conselho, registro/UF e o badge de verificação. Após salvar, `refreshProfile()` atualiza o nome da barra superior.
  - `ChangePasswordCard`: senha atual, nova senha com `PasswordChecklist` e confirmação (`changePassword`, `PATCH /auth/me/password`), enviando o `refreshToken` da sessão atual. `401` marca a senha atual; `400` marca a nova senha (igual à atual ou fora da regra). No sucesso, limpa os campos e avisa que as outras sessões foram encerradas.
  - **Interceptor:** a opção `skipAuthRefresh` (augmentation do `AxiosRequestConfig`) desliga a renovação automática no `401`. A troca de senha a usa, porque o `401` pode ser a senha errada e porque a nova tentativa do interceptor reenviaria o `refreshToken` antigo, já revogado pela rotação. Com o token expirado (`401` com outra mensagem), o serviço chama `renewSession()` (exportada de `api.ts`) e reenvia com o refresh token novo.
  - Feedback (RNF03): `FeedbackBanner` de 8 s, spinner nos botões e erros por campo.

- [x] **Busca ativa de doses atrasadas (etapa 5f, RF009, D21):** sem página própria (decisão do usuário: nada de `/busca-ativa` nem item na sidebar). Fica em `/confirmar-vacina` sem `citizenId`, abaixo do card de orientação: `pages/records/components/OverdueCard.tsx`.
  - `getOverdue({ limit, search }, signal)` em `services/dashboard.ts` (`GET /dashboard/overdue`, `limit=100`, o máximo). Tipos `OverdueList`/`OverduePerson`/`OverdueVaccine` em `types/dashboard.ts`.
  - Totais (pessoas e doses), filtro por nome no servidor (debounce de 400 ms, mín. 2 caracteres, `AbortController`), ordem da API (mais atrasados primeiro). Item: nome, CPF mascarado, badge "Atrasado há X dias" e vacinas atrasadas (vacina · dose, "prevista para"). O item inteiro é um link para `?citizenId=`; a página rola ao topo quando o `citizenId` muda.
  - Sem badge "Profissional": o `/overdue` não retorna `role` (o backend não foi alterado).
  - Dashboard: `StatCard` ganhou `to`/`linkLabel` (vira `Link`, exceto no erro). "Doses atrasadas" leva o profissional a `/confirmar-vacina`; o ADMIN não tem link (D21). `RecentDosesCard`: o nome do cidadão abre a caderneta (RF009 nota 4).

- [x] **Paginação no servidor (D22):** `GET /users`, `GET /professionals` e `GET /dashboard/overdue` respondem `{ items, total, page, limit, totalPages }` (tipo `PaginatedList` em `types/pagination.ts`); users e professionals trazem `counts`. O `/professionals` usa `?status=PENDENTE|VERIFICADO|RECUSADO` (o `verified` saiu).
  - `components/ui/Pagination` (anterior/próxima, "Página X de Y", total, `nav` com `aria-label`, página anunciada por `aria-live`).
  - `hooks/useUrlPagination.ts`: `usePageParam` (`?pagina=`, cria histórico), `useClampPage` (página além da última volta para a última), `useFilterParams` (troca filtros e volta à página 1) e `useSearchParamInput` (`?busca=`, debounce de 400 ms, `minLength`).
  - Usuários: 10 por página. Profissionais: 20 por página, busca por nome nova e contadores nas abas. Busca ativa (`OverdueCard`): 10 por página, busca e página na URL de `/confirmar-vacina`. `PendingProfessionalsCard`: só `PENDENTE`, 5 itens e o total na descrição.
  - UBS e Vacinas continuam carregando tudo (catálogos pequenos).

- [x] **Tabelas de listagem padronizadas (`components/ui/DataTable`):** Profissionais, UBS, Vacinas e Usuários usam `DataTable` (cabeçalho + `ul`), `DataTableRow` (linha, `highlighted`, `details` abaixo das colunas) e `DataTableActions`. As colunas são definidas uma vez (`DataTableColumn[]`: `header`, `width`, `align`) e o cabeçalho e as linhas leem o mesmo `grid-template-columns` pela variável `--data-table-columns`, sem colunas `auto`: o título fica alinhado ao conteúdo e a largura não varia por linha. Texto em `minmax(0,Nfr)` e colunas curtas (status, doses, datas, CPF, telefone) em `rem`; tudo à esquerda, só Ações à direita com largura fixa. `TOGGLE_ACTION_CLASS` dá a mesma largura mínima aos botões de alternar estado. A tabela aparece a partir do `xl` (no `lg`, com a sidebar, as colunas não cabiam); abaixo dele, os cards empilhados. A busca ativa continua em cards.

- [x] **Reflow a partir de 320px (WCAG 1.4.10):** nenhuma tela pode ter rolagem horizontal. Regras para novas telas: grades sempre com colunas explícitas (`grid-cols-1` na base, `minmax(0,1fr)` no lugar de `1fr`), `min-w-0` em itens flex/grid que contêm texto, inputs ou gráficos (o `FormField`, o `TimeInput`, o `Card`, o `PageHeader`, o `Modal` e a coluna do `AppLayout` já trazem), `fieldset` com `min-w-0` e `break-words` em textos longos. Duas colunas de campos (texto + UF, latitude/longitude, horários) só a partir de `min-[400px]`. O `StatCard` põe o ícone acima do título abaixo do `sm`. O `RecentDosesCard` usa container query (`@container`/`@sm:`) para jogar o badge e a data para baixo quando o card é estreito. A `Pagination` mostra só as setas abaixo de 400px. O `Modal` tem padding menor abaixo de 400px.

---

- [x] **Etapa final: acessibilidade (WCAG 2.1 AA, RNF04) e LGPD (RNF10, RNF11):** detalhes em `docs/PLANO-WEB.md`.
  - Contraste: `primary` `#077A66`, `accent` `#047A80`, `warning` `#8F5B12` e o token novo `input` `#7F948D` (contorno de campos). Placeholders em `muted`, sem `opacity` em texto.
  - `hooks/useFocusTrap(ref, ativo, { onEscape, getInitialFocus })`: usado pelo `Modal` (todos os diálogos) e pela gaveta da sidebar (que fica `inert` quando fechada no celular, via `hooks/useMediaQuery`). Há uma pilha de traps: só o do topo trata o teclado. O `Modal` ganhou `role` (`alertdialog`) e `dismissible`, e o título usa `useId`.
  - Novos componentes: `components/ui/PasswordToggle` e `components/feedback/IdleWarningModal`. O `FormField` anuncia o erro (`role="alert"`) e liga a dica por `aria-describedby`. `usePageTitle` (chamado pelo `PageHeader`) define o título da aba. O `AppLayout` tem o skip link para `#conteudo`.
  - Novas telas devem usar o `Modal` e o `FormField` (que já trazem foco e anúncios) e o `PageHeader` (título da aba).
  - `MonthlyChart`: tabela `sr-only`, gráfico `aria-hidden` e `accessibilityLayer={false}`.
  - `/privacidade` (`pages/privacy/PrivacyPolicy.tsx`): rota pública fora do `PublicRoute`, acessível com ou sem sessão. Links no rodapé do login e no `Footer`; no cadastro, abre em nova aba.
  - `tokenStorage` grava só `id`, `name`, `email`, `role` e `professionalRegistry` do usuário (o `cpf` volta como `null`).
  - RNF11: `hooks/useIdleTimeout` + `utils/idleTimeout.ts` (funções puras). Configuração em `VITE_IDLE_TIMEOUT_MINUTES` (padrão 30, aceita decimais, tipada em `src/vite-env.d.ts`). O aviso aparece 1 minuto antes (metade do tempo quando ele é de até 2 min). A última atividade fica em `localStorage` (`@vacinei:lastActivity`), compartilhada entre as abas. Durante o aviso, a atividade não reinicia a contagem. O motivo `idle` vai para o `sessionStorage` e o login mostra o aviso uma vez. A lógica foi testada com relógio simulado (12 cenários).
  - Pendência no backend: falta `POST /auth/logout` para revogar o refresh token ao sair.

---

## 4. Próximos Passos Imediatos

O roteiro detalhado das etapas está em `docs/PLANO-WEB.md` (contrato da API em `docs/API.md`). Todas as etapas foram concluídas.

1. Validar manualmente com teclado e leitor de tela (NVDA) antes da Pré-Banca.
2. Backend: criar `POST /auth/logout` (revogar o refresh token) e usá-lo no `signOut`.
