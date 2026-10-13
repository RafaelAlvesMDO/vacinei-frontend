# VACINEI!? — Plano do Gerenciador Web

Roteiro das etapas do front-end web (`web/`). O contrato da API está em [`API.md`](./API.md).

Legenda: `[x]` concluída · `[ ]` pendente

Ordem das próximas etapas: 5b (vacinas) → 5e (perfil) → 5c (usuários) → 5f (atrasados) → revisão final.

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

## [ ] Etapa 5b: Catálogo de vacinas (só ADMIN)

- Rota restrita a `ADMIN`, com link na sidebar.
- Listar as vacinas (`GET /vaccines`, com busca, filtro por público-alvo e opção de ver as inativas), cadastrar (`POST /vaccines`, com as doses) e editar (`PUT /vaccines/:id`).
- Tratamento de `409` (nome duplicado).

## [ ] Etapa 5e: Perfil do usuário (RF003)

- Ver e editar os próprios dados (`GET /users/me` e `PUT /users/me`: nome, celular e data de nascimento), com as mesmas regras de nome e celular do cadastro.
- Trocar a senha informando a senha atual, com a nova senha validada pelo RF001. **Dependência do backend:** a API ainda não tem uma rota de troca de senha autenticada.

## [ ] Etapa 5c: Gestão de usuários (só ADMIN)

- Listar usuários com `GET /users` (filtro por perfil, busca e paginação).
- Ativar/desativar contas: `PUT /users/:id` com `{ isActive }` e `DELETE /users/:id` (exclusão lógica), com confirmação.

## [ ] Etapa 5f: Cidadãos com doses atrasadas

- Ao clicar no card "Doses atrasadas" do dashboard, abrir a lista de cidadãos com doses atrasadas. Cada cidadão leva à caderneta em `/confirmar-vacina?citizenId=`.
- **Dependência do backend:** a API ainda não tem um endpoint que liste esses cidadãos.

## [ ] Etapa final: Revisão de acessibilidade (WCAG 2.1 AA) e LGPD

- Acessibilidade: contraste, navegação por teclado, foco visível, rótulos e erros associados aos campos, e leitores de tela nos modais e nas listas.
- LGPD: revisar quais dados pessoais e de saúde cada perfil vê (princípio da necessidade), o mascaramento de CPF e as mensagens, para não expor dados de terceiros.
