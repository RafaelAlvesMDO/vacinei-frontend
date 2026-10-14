# VACINEI!? — Plano do Gerenciador Web

Roteiro das etapas do front-end web (`web/`). O contrato da API está em [`API.md`](./API.md).

Legenda: `[x]` concluída · `[ ]` pendente

Todas as etapas do roteiro estão concluídas.

---

## [x] Etapa 1: Regra de senha (RF001) na redefinição

- `src/utils/password.ts` com `validatePassword()`: mínimo de 8 caracteres, com ao menos 1 maiúscula, 1 minúscula, 1 número e 1 símbolo.
- `ForgotPasswordModal.tsx` valida a nova senha com essa regra e mostra os requisitos ao usuário.
- O login só exige a senha preenchida, porque a regra se aplica à criação e à troca de senha.

## [x] Etapa 2: Base de sessão

- Tipos alinhados ao contrato: `professionalRegistry: { isVerified, status: "PENDENTE" | "VERIFICADO" | "RECUSADO" } | null` no login e no `/auth/me`.
- `services/tokenStorage.ts`: tokens e usuário em `localStorage` ou `sessionStorage`, conforme a opção "Lembrar de mim".
- `services/api.ts`: injeção do Bearer token e, no `401`, renovação única via `POST /auth/refresh` com nova tentativa da requisição. Se a renovação falhar, a sessão é limpa e o usuário volta para o login.
- `services/auth.ts`: login apenas por `POST /auth/login` (sem `/sessions`) e perfil por `GET /auth/me`.
- `AuthContext` + `useAuth`: `signIn`, `signOut`, `refreshProfile` e restauração da sessão na inicialização. Cidadãos são bloqueados.
- `ProtectedRoute` (com `allowedRoles`) e `PublicRoute`, rotas com `React.lazy` e um dashboard provisório.

## [x] Etapa 3: Dashboard do profissional (RF009)

> Concluída em 10/10/2026. Layout baseado no template do orientador (sidebar, barra superior, cabeçalho com busca, 4 cards, duas colunas e rodapé). O card direito muda por perfil (LGPD): doses recentes para o profissional e profissionais pendentes para o ADMIN. Rotas `/confirmar-vacina` e `/profissionais` apontam para uma página "em construção" até as etapas 4 e 5. A busca de cidadãos leva a `/confirmar-vacina?citizenId=<id>`.

- Criar o `AppLayout` (`src/layouts/AppLayout.tsx`) com sidebar responsiva (links por perfil), header com o usuário logado e botão de sair. Todas as rotas protegidas usam esse layout.
- `services/dashboard.ts` com:
  - `GET /dashboard/summary` → `{ totalCadernetas, totalVacinasRegistradas, totalDosesAtrasadas }`
  - `GET /dashboard/recent-doses?limit=` → doses recentes (cidadão, vacina, dose, data, status)
  - `GET /dashboard/monthly` → `[{ month: "YYYY-MM", total }]` dos últimos 12 meses
- Tela `/dashboard`:
  - Cards de resumo (3 indicadores).
  - Tabela de doses recentes.
  - Gráfico de linha com **recharts** (instalar `recharts`) mostrando as doses por mês.
- Exige profissional verificado: se a API responder `403`, mostrar um aviso de registro pendente ou recusado em vez dos dados. O ADMIN também precisa de um tratamento para essa tela.
- Estados de carregamento, vazio e erro.

## [x] Etapa 4: Confirmação de vacina (RF010)

> Concluída em 12/10/2026. Tela `pages/records/ConfirmVaccination.tsx` no `AppLayout`. `?citizenId=` abre a caderneta direto; sem ele, a busca do cabeçalho (`components/citizens/CitizenSearch`, compartilhada com o dashboard) leva ao cidadão. A caderneta mostra 3 cards de resumo e as vacinas ordenadas (atrasadas primeiro e destacadas), com doses aplicadas/total, próxima dose e registros (confirmado ou aguardando confirmação). O modal (`ConfirmDoseModal`) sugere a vacina e a próxima dose (RF010 notas 2 e 3, editáveis), exige o lote (alfanumérico, até 20, em maiúsculas) e mostra a data de hoje e o profissional logado sem edição (RS006). "Registrar outra vacina" permite qualquer vacina do `GET /vaccines`. Após o sucesso: aviso "Dose registrada" ou "Registro do cidadão confirmado", destaque da vacina atualizada e recarga da caderneta (RNF03). O `409` mostra "Esta dose já foi confirmada" e recarrega a caderneta.

- Busca de cidadão com debounce (hook `useDebounce`) em `GET /citizens?search=` (2 a 100 caracteres, máximo de 20 resultados, CPF mascarado).
- Ao selecionar o cidadão, abrir a caderneta: `GET /citizens/:id/vaccination-records` (resumo + vacinas com status `EM_DIA`/`ATRASADA`/`COMPLETA`, doses e registros).
- Modal de confirmação com a escolha da dose e o campo de lote (1 a 20 caracteres alfanuméricos, salvo em maiúsculas): `POST /vaccination-records/confirm` com `{ citizenId, vaccineId, doseId, lote }`.
- Tratamento das respostas:
  - `201` (`action: "CREATED"`): dose nova registrada.
  - `200` (`action: "CONFIRMED_EXISTING"`): registro manual/OCR promovido a `CONFIRMADO`.
  - `409`: dose já confirmada.
  - `400`/`404`: erros de validação, dose que não pertence à vacina, cidadão ou vacina inexistente.
- Depois de confirmar, recarregar a caderneta.

## [x] Etapa 5: Administração de profissionais (RS001)

> Concluída em 12/10/2026. Tela `pages/professionals/Professionals.tsx` no `AppLayout`, só para ADMIN. Filtro por status na URL (`?status=pendentes|verificados|recusados`, Pendentes por padrão). Pendentes e recusados vêm de `?verified=false` e são separados no cliente. A lista mostra nome, e-mail, conselho/registro/UF, badge de status, data de cadastro e, nos recusados, o motivo. "Verificar" (pendentes e recusados) abre um diálogo que lembra o admin de conferir o registro no site oficial do conselho (só a página inicial: CFM, Cofen, CFF e CFO, em `utils/councils.ts`). "Recusar" abre um modal com motivo opcional (3 a 500 caracteres). Nos verificados, a ação vira "Revogar" e exige marcar a ciência de que o profissional perderá o acesso às funções de profissional. `404` e `409` fecham o modal, mostram um aviso de lista desatualizada e recarregam. O sucesso mostra um aviso por 8 s e recarrega a lista (RNF03). O "Ver todos" do dashboard leva a `/profissionais?status=pendentes`.

- Rota restrita a `ADMIN` (`ProtectedRoute allowedRoles={['ADMIN']}`), com link na sidebar só para esse perfil.
- `services/professionals.ts`:
  - `GET /professionals?verified=false` → pendentes e recusados.
  - `PATCH /professionals/:id/verify` (`409` se já verificado).
  - `PATCH /professionals/:id/reject` com `{ reason? }` (3 a 500 caracteres; `409` se a recusa já foi registrada).
- Lista com nome, e-mail, conselho/registro/UF, status e data de cadastro.
- Ação de verificar, com confirmação.
- Ação de recusar, em um modal com motivo opcional.

## [x] Etapa 6: Cadastro de profissional (RF001)

> Concluída em 12/10/2026, com aprovação do orientador. O `RequestAccessModal` ("Criar conta") virou o cadastro de profissional via `POST /users`, com `role: "PROFISSIONAL_SAUDE"` fixo: o Gerenciador Web não cadastra cidadãos, que usam o app. Campos: nome completo (nome e sobrenome), e-mail, celular com máscara `(DD) 9XXXX-XXXX` (enviado só com números), categoria profissional, número do registro, UF (27 UFs), senha e confirmação com o checklist da RF001. O conselho da categoria aparece só como informação, porque é o backend que o define (D12). O `400` mostra o erro em cada campo (o `parseApiError` passou a ler os campos aninhados do Zod, como `professionalRegistry.uf`). O `409` mostra a mensagem da API (e-mail ou registro já cadastrado). No sucesso, aparece a tela "Cadastro enviado!" e o login abre com o e-mail preenchido. O endpoint provisório `/auth/request-access` e o sucesso falso foram removidos, e o CRO saiu do `utils/councils.ts` (D13). No login, o cartão "Controle do SUS" passou a se chamar "Administração", porque o sistema não é integrado ao SUS. A busca de cidadãos mostra o badge "Profissional" para `PROFISSIONAL_SAUDE` (D11). Na própria caderneta, o profissional não vê as ações de confirmar e recebe o aviso "Você não pode confirmar a própria vacinação (RS006)".

- Body: `{ name, email, password, phone, role: "PROFISSIONAL_SAUDE", professionalRegistry: { category, registryNumber, uf } }`, sem `council`.
- Categorias (D13): Médico(a) → CRM; Enfermeiro(a), Técnico(a) de Enfermagem e Auxiliar de Enfermagem → COREN; Farmacêutico(a) → CRF.
- Componentes reutilizáveis: `components/ui/FormField` (`FormField` e `FormSelect`) e `components/ui/PasswordChecklist`, também usados no `ForgotPasswordModal`.

## [x] Etapa 5d: Gestão de UBS (só ADMIN)

> Concluída em 13/10/2026. Tela `pages/ubs/UbsList.tsx` em `/ubs`, no `AppLayout`, só para ADMIN, com o link "UBS" na sidebar. A lista vem inteira de `GET /ubs?includeInactive=true`. A busca por nome ou bairro (ignora acentos) e o filtro Ativas/Inativas/Todas (na URL: `?status=inativas|todas`, com contadores) rodam no cliente. Cada linha mostra o nome, o endereço resumido, o bairro, o horário, o telefone e o badge Ativa/Inativa. O `UbsFormModal` cadastra e edita (no `PUT`, envia só os campos alterados) com os campos do RF008: nome, CNES opcional (7 dígitos), CEP com máscara, logradouro, número (normaliza "S/N" para `s/n`), bairro, cidade, UF, horário, telefone opcional e latitude/longitude. Cidade e UF entraram porque o `POST /ubs` os exige, e o padrão é Maceió/AL. O telefone aceita fixo (10 dígitos) ou celular (11 dígitos), com a máscara adaptando ao tamanho, e é salvo formatado, como no seed. Com o CEP completo, o ViaCEP (`services/viaCep.ts`, `fetch` sem o token da API) preenche logradouro, bairro, cidade e UF, que continuam editáveis. Se o ViaCEP falhar, o preenchimento é manual. As coordenadas aceitam vírgula decimal e, coladas juntas na latitude ("-9.6658, -35.7353"), são separadas. Uma dica explica como obtê-las no OpenStreetMap e tem um link para conferir o ponto. O `UbsStatusDialog` confirma a desativação ("A UBS deixará de aparecer no aplicativo, mas o histórico de vacinações registradas nela será mantido.") e a reativação. O `400` aparece em cada campo, o `409` marca o CNES e o `404` fecha o modal com o aviso de lista desatualizada. Depois de cada ação, um aviso fica 8 s na tela, a UBS ganha o badge "Atualizada agora" e a lista é recarregada (RNF03). O aviso foi extraído para `components/feedback/FeedbackBanner`, que agora também é usado em Profissionais. Ajustes de 13/10: as coordenadas usam vírgula decimal nos exemplos, e o horário de funcionamento passou a ser montado em faixas (dias + abertura/fechamento). O texto salvo é sempre gerado no padrão "Seg a Sex: 07:00 às 17:00 · Sáb: 07:00 às 14:00", e horários antigos fora do padrão (como os do seed) aparecem como referência para serem redefinidos.

- Listar (`GET /ubs`, com busca e `includeInactive=true` para ver as desativadas), cadastrar (`POST /ubs`), editar (`PUT /ubs/:id`) e desativar/reativar (`PATCH /ubs/:id/status`). A UBS nunca é excluída (D10).
- Campos do cadastro (RF008): nome, CEP, logradouro, número (ou `s/n`), bairro, cidade, UF, latitude, longitude e horário de funcionamento; telefone e CNES são opcionais.
- Tratamento de `409` (CNES duplicado).

## [x] Etapa 5b: Catálogo de vacinas (só ADMIN)

- Rota `/vacinas` restrita a `ADMIN`, com link "Vacinas" na sidebar.
- Listar as vacinas (`GET /vaccines` com `isActive=true` e `isActive=false`, juntas no cliente), com busca por nome ou doença, filtro por status e por público-alvo, e esquema de doses expansível. Cadastrar (`POST /vaccines`, com as doses) e editar (`PUT /vaccines/:id`).
- Tratamento de `400` por campo (inclusive `doses.N.campo`), `404` (lista desatualizada) e `409` (nome duplicado).
- Sem exclusão: o `DELETE /vaccines/:id` não é usado. A vacina é desativada ou reativada com `PUT { isActive }`.
- **Limitação da API:** o `PUT` não aceita doses, então o esquema só é definido no cadastro e aparece para leitura na edição. O `dosesCount` é calculado a partir das doses e não é editado.

## [x] Etapa 5e: Perfil do usuário (RF003)

> Concluída em 13/10/2026. Os dados vêm do `GET /users/me`, que traz categoria, conselho, número e UF do registro (o `GET /auth/me` só tem `isVerified` e `status`).

- Rota `/perfil` para `PROFISSIONAL_SAUDE` e `ADMIN`, aberta pelo menu do ícone de perfil na barra superior ("Meu perfil" e "Sair").
- Ver os próprios dados. Só o nome é editável, pelo `PATCH /auth/me` (`{ name }`, mesma regra do cadastro). O `PUT /users/me` foi removido (D20). E-mail e celular exigem verificação de identidade e ficam bloqueados por enquanto; CPF, data de nascimento, perfil e registro profissional não são editáveis (D19).
- Trocar a senha pelo `PATCH /auth/me/password` (`{ currentPassword, newPassword, refreshToken }`), com a nova senha validada pelo RF001. O `refreshToken` da sessão atual a mantém conectada; as demais sessões são encerradas.

## [x] Etapa 5c: Gestão de usuários (só ADMIN)

- Listar usuários com `GET /users` (todas as páginas, com `limit=100`). A busca por nome ou e-mail e os filtros de perfil e status rodam no cliente, porque a API não filtra por `isActive`.
- Ativar/desativar contas com `PUT /users/:id` e `{ isActive }`, com confirmação. O `DELETE /users/:id` não é usado: usuários não são excluídos, porque os registros de vacinação apontam para eles.

## [x] Etapa 5f: Busca ativa de doses atrasadas (RF009)

> Concluída em 13/10/2026. Usa o `GET /dashboard/overdue` (D21). Não há página própria: a busca ativa fica na tela Confirmar vacina.

- Em `/confirmar-vacina`, sem cidadão selecionado, o card "Busca ativa — doses atrasadas" (`pages/records/components/OverdueCard.tsx`) mostra abaixo da busca os totais (pessoas e doses atrasadas) e a lista com `limit=100`, das pessoas mais atrasadas para as menos. Cada item tem nome, CPF mascarado, o maior atraso em dias e as vacinas atrasadas (vacina, dose e data prevista). Clicar abre a caderneta (`?citizenId=`), e a página volta ao topo.
- O filtro por nome usa o `search` da API (debounce de 400 ms, mínimo de 2 caracteres, ignora acentos). Com filtro, os totais passam a ser os do resultado filtrado. Se houver mais de 100 pessoas, aparece "Mostrando 100 de N".
- Sem o badge "Profissional", porque o `/overdue` não retorna `role`. O badge continua na busca de cidadãos.
- Estados: carregando, erro com "Tentar novamente", vazio ("Nenhuma dose atrasada no momento") e filtro sem resultado. Durante um novo filtro, a lista anterior continua na tela, esmaecida, com "Atualizando..." (RNF03). O `403` sincroniza o perfil.
- Dashboard: para o profissional, o card "Doses atrasadas" é um link para `/confirmar-vacina` ("Ver busca ativa"). Para o ADMIN, o card continua só informativo (LGPD, D21). O `StatCard` ganhou as props `to` e `linkLabel`.
- Doses recentes (RF009 nota 4): o nome do cidadão é um link para a caderneta.

## [x] Etapa final: Revisão de acessibilidade (WCAG 2.1 AA, RNF04) e LGPD (RNF10, RNF11)

> Concluída em 14/10/2026, em todas as telas (login, cadastro, recuperação de senha, dashboard, confirmar vacina, busca ativa, profissionais, UBS, vacinas, usuários e meu perfil).

- **Contraste:** `primary` `#077A66`, `accent` `#047A80` e `warning` `#8F5B12` (antes 4,37, 3,15 e 3,36:1 nos piores pares) e o token `input` (`#7F948D`, 3,22:1) no contorno dos campos. Placeholders em `muted` e contadores sem `opacity`. A tabela de pares está no `DESIGN.md`.
- **Foco e teclado:** `hooks/useFocusTrap` no `Modal` (todos os diálogos) e na gaveta da sidebar: foco inicial no primeiro campo, Tab preso, Esc fecha e o foco volta a quem abriu. Só o diálogo do topo reage ao teclado. A sidebar fechada no celular fica `inert`. O menu do perfil tem setas, Home/End, Esc e Tab. Foco visível padrão (`:focus-visible`) e link "Pular para o conteúdo". Os dias da UBS formam um grupo rotulado, e o dia já usado em outra faixa continua no Tab (`aria-disabled`). A paginação já era navegável.
- **Rótulos e anúncios:** `PasswordToggle` (no Tab, com `aria-label` e `aria-pressed`) nas 4 telas com senha. Os erros de campo têm `role="alert"` e a dica fica ligada por `aria-describedby`. O login passou a usar o `FormField`. A busca de cidadãos anuncia a quantidade de resultados. O título da aba muda por página (`usePageTitle`).
- **Gráfico mensal:** tabela `sr-only` (mês por extenso e total) e gráfico com `aria-hidden`.
- **Login (D17):** mostra a mensagem da API no `401` e no `403`, com textos de reserva por status (inclusive `429`).
- **LGPD:** página pública `/privacidade` (dados, finalidades, quem acessa, segurança, retenção e direitos), com link no rodapé do login e do painel e aviso no cadastro. O storage do navegador guarda o usuário sem CPF, celular e nascimento.
- **RNF11:** `hooks/useIdleTimeout` encerra a sessão após `VITE_IDLE_TIMEOUT_MINUTES` (padrão 30) sem uso, com aviso 1 minuto antes ("Continuar conectado" / "Sair agora"). A contagem segue o relógio e é compartilhada entre as abas. O login explica o encerramento.
- **Pendência no backend:** não existe `POST /auth/logout`. Ao sair (ou por inatividade), o refresh token só é apagado do navegador e continua válido no servidor até expirar.
