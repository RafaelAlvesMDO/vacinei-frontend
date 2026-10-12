# VACINEI!? — Plano do Gerenciador Web

Roteiro das etapas do front-end web (`web/`). O contrato da API está em [`API.md`](./API.md).

Legenda: `[x]` concluída · `[ ]` pendente

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

## [ ] Etapa 5: Administração de profissionais (RS001)

- Rota restrita a `ADMIN` (`ProtectedRoute allowedRoles={['ADMIN']}`), com link na sidebar só para esse perfil.
- `services/professionals.ts`:
  - `GET /professionals?verified=false` → pendentes e recusados.
  - `PATCH /professionals/:id/verify` (`409` se já verificado).
  - `PATCH /professionals/:id/reject` com `{ reason? }` (3 a 500 caracteres; `409` se a recusa já foi registrada).
- Lista com nome, e-mail, conselho/registro/UF, status e data de cadastro.
- Ação de verificar, com confirmação.
- Ação de recusar, em um modal com motivo opcional.

## [ ] Etapa 6: Cadastro de profissional (aguardando o orientador)

- O `RequestAccessModal` passa a ser o cadastro de profissional via `POST /users`:
  - `{ name, email, password, cpf?, phone, birthDate?, role: "PROFISSIONAL_SAUDE", professionalRegistry: { category, council, registryNumber, uf } }`.
  - Validações do RF001:
    - **Nome:** obrigatório, com no mínimo duas palavras (nome e sobrenome).
    - **Celular:** obrigatório, DDD + 9 dígitos (ex.: `(82) 98765-4321`), com máscara.
    - **Categoria profissional:** select obrigatório (Médico(a), Enfermeiro(a), Técnico(a) de Enfermagem, Farmacêutico(a), Cirurgião(ã)-Dentista). O conselho é preenchido automaticamente a partir dela: CRM, COREN, COREN, CRF e CRO, respectivamente.
    - **Senha:** regra RF001 (`validatePassword`).
  - **Dependência do backend:** o `professionalRegistry` precisa de um campo `category`, porque Enfermeiro(a) e Técnico(a) de Enfermagem têm o mesmo conselho (COREN). O backend também deve validar o celular e o nome com essas regras.
  - Tratamento de `400` (erros por campo) e `409` (e-mail, CPF ou registro já cadastrado).
  - Mensagem final informando que a conta fica pendente de verificação pelo administrador.
- Remover o endpoint provisório `/auth/request-access`.

## [ ] Etapa 5b: Catálogo de vacinas (só ADMIN)

- Rota restrita a `ADMIN`, com link na sidebar.
- Listar as vacinas (`GET /vaccines`, com busca, filtro por público-alvo e opção de ver as inativas), cadastrar (`POST /vaccines`, com as doses) e editar (`PUT /vaccines/:id`).
- Tratamento de `409` (nome duplicado).

## [ ] Etapa 5c: Gestão de usuários (só ADMIN)

- Listar usuários com `GET /users` (filtro por perfil, busca e paginação).
- Ativar/desativar contas: `PUT /users/:id` com `{ isActive }` e `DELETE /users/:id` (exclusão lógica), com confirmação.

## [ ] Etapa 5d: Gestão de UBS (só ADMIN)

- Listar (`GET /ubs`, com busca), cadastrar (`POST /ubs`), editar (`PUT /ubs/:id`) e desativar/remover (`DELETE /ubs/:id`).
- Tratamento de `409` (CNES duplicado).

## [ ] Etapa 5e: Perfil do usuário (RF003)

- Ver e editar os próprios dados (`GET /users/me` e `PUT /users/me`: nome, celular e data de nascimento).
- Trocar a senha informando a senha atual, com a nova senha validada pelo RF001. **Dependência do backend:** a API ainda não tem uma rota de troca de senha autenticada.

## [ ] Etapa 5f: Cidadãos com doses atrasadas

- Ao clicar no card "Doses atrasadas" do dashboard, abrir a lista de cidadãos com doses atrasadas. Cada cidadão leva à caderneta em `/confirmar-vacina?citizenId=`.
- **Dependência do backend:** a API ainda não tem um endpoint que liste esses cidadãos.
