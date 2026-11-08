# VACINEI!? — Plano do App Mobile

Roteiro das etapas do aplicativo (`mobile/`). O contrato da API está em [`API.md`](./API.md), as regras em [`DECISOES.md`](./DECISOES.md) e a identidade visual em [`DESIGN.md`](./DESIGN.md).

Legenda: `[x]` concluída · `[ ]` pendente · **Backend novo:** endpoint que ainda não existe na API.

---

## Base técnica

- **Expo SDK 58 + React Native 0.88 + React 19.3 + TypeScript estrito** (sem `any`). Testes no celular pelo Expo Go, que só abre projetos do SDK que ele suporta (a versão 58.0.5 do Expo Go aceita apenas o SDK 58). Atualizar o SDK só quando o Expo Go das lojas suportar a versão nova (`npm install expo@^N` + `npx expo install --fix`; se o npm acusar conflito de peer com pacotes do SDK anterior, apagar `node_modules` e `package-lock.json` e reinstalar).
  - Migração 57 → 58: o RN 0.88 tipa refs pelas instâncias (`TextInputInstance`, `TextInstance`) e o `ColorValue` passou a admitir número e `null`, por isso o `Icon` recebe o tipo de cor do `@expo/vector-icons`. O `index.d.ts` do `react-native-webview` 14 resolve as props como `never` com o genérico padrão, então o mapa usa `WebView<object>`. No `Stack.Protected` do SDK 58, uma guarda sem `redirectTo` leva à primeira rota liberada em ordem alfabética (o profissional na ala Profissional caía em `privacidade`): o layout raiz passa `redirectTo` com o destino do estado (`getHomeHref`).
- **Navegação:** Expo Router (rotas por arquivo em `src/app/`): grupo `(auth)` e as alas em pastas `cidadao/` e `profissional/` (URLs `/cidadao/...` e `/profissional/...`), cada uma com abas inferiores. As alas não são grupos porque as duas têm a aba Perfil, e dois grupos com `perfil` gerariam a mesma URL. A proteção fica no `_layout.tsx` raiz (`Stack.Protected`).
- **HTTP:** Axios em `src/services/api.ts`, no mesmo padrão do web: Bearer token, renovação única no `401` via `POST /auth/refresh`, opção `skipAuthRefresh` e `parseApiError` (erros por campo do Zod). Chamadas isoladas em `src/services/`.
- **Sessão:** `expo-secure-store` para o access token, o refresh token e o usuário mínimo (`id`, `name`, `email`, `role`, `professionalRegistry`; sem CPF, como no web). Sem "Lembrar de mim": o app mantém a sessão até sair ou expirar.
- **URL da API:** `EXPO_PUBLIC_API_URL` em `mobile/.env` (ex.: `http://192.168.0.10:3333`, IP do computador na rede local), com `mobile/.env.example` versionado. O backend precisa escutar em `0.0.0.0`.
- **Tema:** `src/theme/` com os tokens do `DESIGN.md` (`colors`, `spacing`, `radius`, `typography`) e a fonte Inter (`@expo-google-fonts/inter`). Estilos com `StyleSheet` lendo o tema; nada de cores soltas.
- **Componentes:** `src/components/ui/` (Button, TextField, SearchField, PasswordField, SelectField, CodeInput, Checkbox, RadioCard, Card, Badge, Banner, PasswordChecklist, StepHeader, Pagination, Screen) com acessibilidade nativa (`accessibilityLabel`, `accessibilityRole`, alvos de toque de 48 px). Ícones: `@expo/vector-icons` (Ionicons).
- **Reaproveitamento do web:** portar as funções puras de `web/src/utils/` (`password`, `cpf`, `name`, `format`, `councils`) e os tipos de `web/src/types/`.
- **Bibliotecas por etapa:** `expo-location` + `react-native-webview` com Leaflet (mapa), `expo-image-picker` + `expo-image-manipulator` + `expo-file-system` (OCR), `expo-notifications` (notificações do sistema, etapa final; retirada por agora).

---

## [x] Etapa 1: Base do app

- [x] Projeto Expo SDK 58 (criado no 57) em `mobile/` (TypeScript estrito), Expo Router, ESLint (`eslint-config-expo`, `no-explicit-any` como erro) e scripts (`npm run start`, `npm run lint`, `npm run typecheck`).
- [x] `src/services/api.ts` (Bearer, renovação única no `401`, `skipAuthRefresh`, `renewSession`, `onSessionExpired`), `tokenStorage.ts` e `auth.ts` (`authenticate`, `getProfile`, `signOut`, `parseApiError`).
  - O SecureStore é assíncrono: `tokenStorage` mantém uma cópia da sessão em memória, preenchida por `loadSession()` no layout raiz antes de esconder o splash, e grava no aparelho a cada alteração. Só o usuário mínimo (`StoredUser`) é gravado.
- [x] Tema em `src/theme/` (`colors`, `spacing`, `radius`, `touchTarget`, `typography`, `fonts`) e Inter 400/500/600/700. Cada peso é uma família (`fonts.semibold` etc.), porque no React Native o `fontWeight` não troca o arquivo da fonte.
- [x] Ícone, ícone adaptativo do Android, splash e favicon gerados do `icone-vacinei.svg`. O fundo do splash e do ícone adaptativo usa `#087F6B`, a cor do SVG oficial, para emendar com o logo.
- [x] Utils portados do web: `password`, `cpf`, `name`, `councils` e `format` (com `formatDateInput`/`parseDateInput` novos para a data de nascimento).
- [x] `EXPO_PUBLIC_API_URL` em `mobile/.env` (ignorado pelo `.gitignore` da raiz) e `.env.example`. A tela inicial provisória chamava `GET /health` (removida na etapa 2; sem a variável, o login mostra o aviso).
- [x] Telas provisórias com `components/ProvisionalScreen` (substituídas na etapa 2).
- Movidos para a etapa 2: `AuthContext` + `useAuth` e os componentes de UI base.
- Requisitos: RNF03 (feedback), RNF04 (acessibilidade), RNF10 (LGPD: dados mínimos no aparelho).
- **Backend:** nenhum. Conferir CORS/escuta em `0.0.0.0` para acesso pela rede.

## [x] Etapa 2: Login, cadastro e recuperação de senha

- [x] **Sessão:** `contexts/AuthContext` + `hooks/useAuth` (`user`, `ala`, `isRestoring`, `sessionExpired`, `signIn`, `signOut`, `refreshProfile`, `chooseAla`).
  - Restauração: `loadSession()` + `GET /auth/me` para atualizar o perfil e o status de verificação. Sem rede, segue com o usuário salvo; com `401`, volta ao login.
  - `SessionSplash` ("Verificando sessão ativa...", fundo `brand`, igual ao splash nativo) durante a restauração.
  - O `authenticate` não grava mais a sessão: o contexto confere o perfil antes (ADMIN é recusado com `AdminAccessError` e nada fica no aparelho).
  - Sessão recusada no refresh (`onSessionExpired`): volta ao login com o aviso "Sua sessão expirou".
- [x] **Rotas protegidas** (`Stack.Protected` no `_layout.tsx` raiz): sem sessão → `(auth)`; profissional sem ala salva → `escolher-ala`; `cidadao/` para quem está na ala Cidadão; `profissional/` só para `PROFISSIONAL_SAUDE` na ala Profissional. `privacidade` é pública.
- [x] **Login único** (RF002, D23) por e-mail e senha: `401` com banner "E-mail ou senha inválidos" e o campo de senha marcado; `403` mostra a mensagem da API (conta desativada, D17); ADMIN recebe o aviso para usar o Gerenciador Web. Volta do cadastro e da recuperação com o e-mail preenchido e o aviso de sucesso.
- [x] **Alas (D23):** o cidadão vai direto para a ala Cidadão. O profissional escolhe a ala em `escolher-ala` na primeira entrada; a última fica salva no SecureStore (`services/alaStorage.ts`, `{ userId, ala }`, vale só para a mesma conta) e a troca fica no Perfil. O não verificado vê o `RestrictedAccess` no Painel (pendente ou recusado), com "Acessar a ala Cidadão" e "Atualizar status" (`refreshProfile`).
- [x] **Cadastro** (RF001, D14, `POST /users`): escolha do perfil (Cidadão ou Profissional da Saúde), nome, celular (máscara), e-mail, CPF (máscara e dígitos verificadores), nascimento (DD/MM/AAAA, não futura), senha com `PasswordChecklist` e confirmação.
  - O profissional tem a etapa 2: categoria (D13), número do registro (só letras e números) e UF (D12), com o aviso de que o registro fica em análise (RS001).
  - Consentimento obrigatório e destacado para dados de saúde (LGPD, art. 11, I): checkbox "Li e concordo com a Política de Privacidade e autorizo o tratamento dos meus dados de saúde", com link para `privacidade`. Sem marcar, o botão fica desabilitado. O consentimento não é enviado à API (não há campo no contrato).
  - Erros da API por campo (inclusive `professionalRegistry.*`); erro de um campo da etapa 1 com a etapa 2 aberta volta para a etapa 1. `409` marca o campo deduzido da mensagem (CPF, e-mail ou registro).
- [x] **Recuperação de senha** (RF011, RS007, D04) em 2 etapas: e-mail (`POST /auth/forgot-password`) e código de 6 dígitos (`CodeInput`) + nova senha (`POST /auth/reset-password`). Validade do código (10 min) e reenvio (30 s) com `hooks/useCountdown`. O `429` abre a tela de bloqueio com contagem de 15:00 e, ao fim, "Solicitar novo código". A escolha de canal (SMS) do design ficou de fora: a API só envia por e-mail.
- [x] **Abas provisórias:** ala Cidadão (Início, Perfil; a etapa 3 trouxe a Caderneta) e ala Profissional (Painel, Perfil). Perfil simples (`components/profile/ProfileScreen`): dados da conta, badge de verificação, "Trocar para a ala ..." (só profissional), política de privacidade e "Sair" (com confirmação).
- [x] **Política de privacidade** (`privacidade`): conteúdo do `/privacidade` do web, adaptado ao app (sessão no armazenamento seguro, consentimento do art. 11, I e direito de revogá-lo).
- Requisitos: RF001, RF002, RF011, RS001, RS007, RNF03, RNF04, RNF10.
- **Pendente (próximas etapas):** perfil completo (RF003, D19: editar o nome com `PATCH /auth/me` e trocar a senha com `PATCH /auth/me/password`; design em `design-mobile/perfil/`) e encerramento por inatividade (RNF11) ao voltar do segundo plano (`AppState`).
- **Logout (D27):** o `signOut` limpa o aparelho e revoga o refresh token com `POST /auth/logout`, sem bloquear a saída se a chamada falhar. O cadastro envia `acceptedPrivacyPolicy: true` (D26).

## [x] Etapa 3: Caderneta digital

- **Design:** `design-mobile/cidadao/` (exceto os arquivos do cadastro manual, da etapa 5, e o `central-de-notificacoes-rf007.png`, da etapa 9).
- [x] **Dados:** `services/citizens.ts` (`getVaccinationCard`, `GET /citizens/:id/vaccination-records` com o próprio id) e tipos em `types/vaccination.ts`. O `contexts/VaccinationCardContext` (+ `hooks/useVaccinationCard`) envolve a ala Cidadão: busca a caderneta uma vez e a compartilha com Início, Caderneta e Detalhe (`reload`, cancelamento da requisição anterior). Vale também para o profissional na ala Cidadão (D11).
- [x] **Rotas:** `cidadao/_layout` virou um Stack com o grupo `(abas)` (Início, Caderneta e Perfil; as URLs não mudaram) e o detalhe `cidadao/vacina/[vaccineId]` por cima, sem a barra de abas.
- [x] **Status:** sempre o da API (`EM_DIA`, `ATRASADA`, `COMPLETA`). O app só calcula, para exibição, os dias de atraso a partir do `nextDoseDate` (fuso de Maceió, em `utils/vaccination.ts`). Ordem: atrasadas, em dia e completas, e depois por nome.
- [x] **Início:** saudação com o e-mail, resumo da API (`SummaryCard`: em dia, atrasadas e completas), "Alertas" com as atrasadas ("2ª dose · 18 dias em atraso", abre o detalhe) ou "Tudo em dia" e o atalho "Ver caderneta completa".
- [x] **Caderneta (aba nova):** busca por vacina ou doença (sem acentos), filtros Todas, Em dia, Atrasadas e Completas (`components/ui/FilterChips`, com contadores que respeitam a busca) e um cartão por vacina (`VaccineListItem`) com a próxima dose ou "Esquema completo", o status, a data da última dose e a origem do último registro.
- [x] **Detalhe:** status, doença, aviso de atraso, doses aplicadas/total, última aplicação, próxima dose e data prevista, e o histórico (da dose mais recente para a mais antiga) com badge "Confirmado" ou "Aguardando confirmação" (D06), lote, UBS e profissional.
- [x] **Estados:** puxar para atualizar (`refreshing`/`onRefresh` no `Screen`), carregando, erro com "Tentar novamente" (`403` e `404` com mensagens próprias) e, com dados na tela, falha da atualização como banner, sem perder a caderneta (`components/ui/StateMessage` e `components/vaccination/CardLoadState`). Vazio: "Você ainda não tem vacinas registradas. Cadastre as doses que já tomou. Em breve você também poderá digitalizar sua caderneta." (texto ajustado na etapa 5).
- Ficaram de fora (outras etapas): seletor de dependentes e "Adicionar dependente" (etapa 7), notificações (etapa 9), "Digitalizar" e "Cadastrar manualmente" (etapas 8 e 5), editar e "Registrar nova dose" (etapa 5), "Ver no mapa" e distância da UBS (etapa 4). O filtro avançado da busca do design não foi feito: os filtros por status já cobrem a lista.
- Requisitos: RF006, RS004.
- **Backend:** nenhum.

## [x] Etapa 4: Mapa de UBS

- **Design:** `design-mobile/ubs/`.
- [x] **Aba "UBS"** na ala Cidadão (`cidadao/(abas)/ubs`), entre Caderneta e Perfil, com Lista e Mapa (`components/ui/SegmentedControl`) e busca por nome, bairro, logradouro ou CEP no cliente, sem acentos (RF008 nota 7). A busca da API diferencia acentos e o catálogo é pequeno.
- [x] **Permissão (RNF09, RF008 nota 6):** `hooks/useUserLocation` (`expo-location`, só em primeiro plano, conferida de novo quando o app volta das configurações). Na primeira entrada, `components/ubs/LocationPermissionPrompt` explica o uso ("não será salva nem compartilhada") antes do pedido do sistema; "Agora não" segue sem ordenação. Sem permissão, o aviso warning "Localização desativada" tem "Ativar" (pede de novo ou, se o sistema não deixar, "Abrir configurações"). Localização do aparelho desligada, posição indisponível e nenhuma UBS no raio têm avisos próprios.
- [x] **Distância (RF008 nota 2):** com permissão, `GET /ubs?latitude=&longitude=&radiusKm=50` (`services/ubs.ts`), ordenado pela API. A posição é obtida de novo a cada foco da aba, ao puxar para atualizar e no botão de localizar (10 s de limite, depois a última posição de até 5 min). Sem UBS no raio, a lista completa. LGPD: a posição fica só na memória e vai apenas na consulta.
- [x] **Mapa (RNF15):** Leaflet 1.9.4 (unpkg, com SRI) numa `react-native-webview`, no lugar do `react-native-maps`: funciona no Expo Go, não depende do Google Maps e avisa falhas de tile (`tileerror`), o que o `UrlTile` não faz. Atribuição "© colaboradores do OpenStreetMap" sempre visível (o link abre no navegador), `User-Agent` identificando o app (`Vacinei/1.0`), `keepBuffer: 1`, sem pré-carregamento e cache HTTP da WebView. O mapa só é montado na aba Mapa. Marcadores das UBS, ponto do usuário e cartão da UBS selecionada (a mais próxima por padrão). Se o Leaflet não carregar, se só vierem erros de tile ou sem tile em 15 s: cartão "Mapa indisponível agora" com "Tentar novamente" e a lista abaixo.
- [x] **Horário:** `utils/openingHours.ts` lê o padrão da API ("Seg a Sex: 07:00 às 17:00 · Sáb: 07:00 às 14:00") e calcula o status do dia no fuso de Maceió: "Aberto agora · até 17h", "Fechado · abre hoje às 7h", "Fechado · abre amanhã às 7h", "Fechado · abre segunda às 7h" ou "Fechado hoje". Texto fora do padrão: só as faixas, sem status.
- [x] **Detalhe** (`cidadao/ubs/[ubsId]`, `GET /ubs/:id`): nome e distância, endereço completo (logradouro, número, bairro, cidade/UF e CEP), status e uma faixa de horário por linha, telefone (toque abre a discagem) e distância em linha reta. Rodapé com "Ligar" (só com telefone) e "Como chegar" (`geo:` no Android, Apple Maps no iOS, Google Maps no navegador se nada abrir). Aberto pela caderneta, a distância é calculada no aparelho (haversine), só se a permissão já tiver sido concedida. UBS desativada mostra aviso.
- [x] **"Ver UBS no mapa"** (RF008 nota 9, D29) abaixo do cartão de informações do detalhe da vacina: abre a aba UBS já no Mapa (`/cidadao/ubs?modo=mapa`). O histórico de doses não mostra a UBS, porque a confirmação ainda não a registra.
- Ficaram de fora do design: filtros avançados, "Serviços disponíveis", tempo de carro e compartilhar (a API não tem esses dados) e as abas Digitalizar e Dependentes (outras etapas). "Traçar rota" virou "Como chegar".
- Requisitos: RF008, RNF09, RNF15.
- **Backend:** nenhum.

## [x] Etapa 5: Cadastro manual de vacina

- **Design:** `design-mobile/cidadao/` (`cadastrar-ou-editar-vacina.png`, `resumo-da-vacina.png`, `registro-salvo.png`).
- [x] **Dados:** `services/vaccines.ts` (`listVaccines`, `GET /vaccines`) + `hooks/useVaccineCatalog` e `services/vaccinationRecords.ts` (`createRecord`, `updateRecord`, `deleteRecord`). Tipos `CatalogVaccine`, `ManualRecordPayload` e `SavedRecord` em `types/vaccination.ts`. Regras em `utils/vaccineRecord.ts` (funções puras).
- [x] **Rota:** `cidadao/registro-vacina` (Stack, sem as abas). `?vaccineId=` preenche a vacina e `?recordId=` edita. Um registro confirmado ou que sumiu da caderneta mostra um aviso no lugar do formulário.
- [x] **Fluxo** (`components/vaccination/VaccineRecordFlow`): formulário → resumo ("Confira antes de salvar", origem "Informado por você" e aviso de "Aguardando confirmação") → registro salvo (badge "Aguardando confirmação", "Ver minha caderneta" e "Adicionar outra vacina", ou "Voltar para a vacina" na edição). O voltar do Android no resumo retorna ao formulário.
- [x] **Formulário** (`components/vaccination/VaccineRecordForm`): é controlado e não chama a API. Recebe os valores e devolve só os campos alterados.
  - Vacina: busca por nome ou doença (sem acentos), com sugestões em pílulas (até 8).
  - Dose: `SelectField`, que ganhou `disabled` por opção. As doses já registradas aparecem bloqueadas, com "Já está na sua caderneta".
  - Data: `DD/MM/AAAA`, não futura (fuso de Maceió) e não anterior ao nascimento.
  - Lote: opcional, em maiúsculas, `^[A-Z0-9]{1,20}$`.
  - Sem dose escolhida, o fluxo sugere a próxima pendente da caderneta ou, sem ela, a primeira livre (`suggestDose`).
- [x] **Reaproveitamento no OCR (etapa 8):** o `VaccineRecordFlow` recebe `initialValues` (`RecordInitialValues`: `vaccineId`, `doseId`, `applicationDate` em `YYYY-MM-DD` e `lote`), além de `title` e `subtitle`. O cidadão confere e corrige os dados lidos antes de salvar (RF004, RNF12). A leitura precisa entregar os ids do catálogo.
- [x] **Erros:**
  - `400`: erro por campo e volta ao formulário.
  - `409`: "Esta dose já está na sua caderneta." na dose, com recarga da caderneta.
  - `404`: vacina indisponível ou registro não encontrado, com recarga do catálogo e da caderneta.
  - `403`: mensagem da API, por exemplo quando o registro foi confirmado durante a edição.
  - Falha de conexão: o fluxo continua no resumo para tentar de novo.
  - Depois de salvar, editar ou excluir, a caderneta do contexto é recarregada.
- [x] **Pontos de entrada:** "Cadastrar vacina" na Caderneta (topo e estado vazio) e no estado vazio da Início. "Registrar nova dose" no detalhe, enquanto houver dose sem registro. No histórico, os registros não confirmados ganham "Editar" e "Excluir" (`ConfirmDialog` danger, com banner de sucesso ou erro: `403` confirmado e `404` já excluído).
- **Diferenças intencionais do design:**
  - Sem "Próxima dose" e "Profissional responsável" (e sem a UBS citada antes): a API não aceita esses campos. A próxima dose é calculada pela caderneta, e o profissional é quem confirma.
  - Data digitada com máscara, sem calendário nativo, como no cadastro.
  - O "Salvo" do design virou o badge "Aguardando confirmação" (D06).
  - O resumo mostra a doença no lugar da próxima dose e do profissional.
- Requisitos: RF005, RS003 (vacina do calendário e data de aplicação não futura).
- **Backend novo (D30):** `POST /vaccination-records` (titular, `origin: MANUAL`), e `PUT`/`DELETE /vaccination-records/:id` só para registros próprios não confirmados.

## [x] Etapa 6: Ala profissional

- **Design:** `design-mobile/profissional/`.
- [x] **Rotas:** `profissional/_layout` virou um Stack com o grupo `(abas)` (Painel, Busca ativa, Cidadãos e Perfil; as URLs não mudaram) e, por cima, a caderneta `profissional/cidadao/[citizenId]` e a confirmação `profissional/confirmar-dose` (`?citizenId=&vaccineId=&recordId=`). Busca ativa e Cidadãos ficam ocultas (`href: null`) para quem não é verificado.
- [x] **Acesso (RS001):** o Painel mostra o `RestrictedAccess` (pendente ou recusado); as outras telas usam `components/professional/VerifiedOnly`. Um `403` numa rota de profissional chama `refreshProfile` (`hooks/useForbiddenSync`): se a verificação foi revogada, a tela passa ao acesso restrito.
- [x] **Dados:** `services/dashboard.ts` (`getDashboardSummary`, `getRecentDoses`, `getOverdue`), `searchCitizens` (`services/citizens.ts`) e `confirmDose` (`services/vaccinationRecords.ts`). Tipos em `types/dashboard.ts`, `types/citizen.ts` e `ConfirmDose*` em `types/vaccination.ts`. `hooks/useRequest` (cancela a requisição anterior e mantém os dados na tela), `useCitizenCard`, `useDebounce` e `useReloadOnFocus` (recarrega ao voltar para a tela, ex.: depois de confirmar). Regras puras em `utils/confirmDose.ts`.
- [x] **Painel (RF009):** atalhos "Registrar vacinação" e "Busca ativa"; indicadores do `/summary` (`StatTile`): cadernetas, vacinas registradas, doses atrasadas e aguardando conferência (os dois últimos abrem a Busca ativa no grupo, `?grupo=aguardando`); "Registros recentes" (`/recent-doses`, 5 itens, badge "Confirmado" ou "Aguardando confirmação"), que abrem a caderneta do cidadão.
- [x] **Busca ativa (D21, D32):** Atrasadas e Aguardando conferência (`SegmentedControl` com os `counts`), quadros com os totais de doses e pessoas (`doseCounts`/`counts`), busca por nome (400 ms, mín. 2 letras) e 10 por página (`components/ui/Pagination`, volta ao topo com o `scrollRef` novo do `Screen`). Cartão (`OverduePersonCard`): iniciais, nome, CPF mascarado, "Atrasado há X dias" ("mais de 1 ano" acima de 365), vacinas com a dose e a data prevista ou as doses informadas com a data, e "Abrir caderneta".
- [x] **Cidadãos (etapa 1 do design):** busca por nome ou CPF como no web (CPF só com os números, exigindo os 11 dígitos válidos), resultados com nascimento, CPF mascarado e os badges "Profissional" ou "Você", "Selecionar"; sem resultado, "Nenhum cidadão encontrado" com "Limpar busca" e dicas. `components/ui/SearchField` novo.
- [x] **Caderneta do cidadão:** nome, nascimento e idade, `SummaryCard`, "Registrar outra vacina" e as vacinas (`CitizenVaccineItem`) com a situação (D32), os registros (lote, data e "Informada pelo cidadão · aguardando confirmação"), "Confirmar dose" (enquanto houver dose sem registro) e "Confirmar registro" nos registros não conferidos. Na própria caderneta (D11): aviso RS006 e nenhuma ação.
- [x] **Confirmar dose (RF010, `ConfirmDoseFlow`):** dados da vacinação → revisão → confirmada (etapas 2 e 3 de 3 no `StepHeader`).
  - Vacina com as pendentes da caderneta primeiro e a dose sugerida (`nextDose` ou a primeira não confirmada), com as anotações "Sugerida pela caderneta", "Já confirmada" (bloqueada) e "Registrada pelo cidadão". Aviso de dose antes da data prevista e de vacina desativada (bloqueia).
  - "Confirmar registro": vacina e dose fixas e a data informada pelo cidadão, que é mantida.
  - Data (hoje) e profissional (sessão) só leitura; lote obrigatório, em maiúsculas, `^[A-Z0-9]{1,20}$`.
  - Revisão com "Confirmação definitiva" e "O que acontecerá". Sucesso: "Vacinação confirmada!" (`201`) ou "Registro do cidadão confirmado!" (`200 CONFIRMED_EXISTING`), com "Voltar à caderneta", "Registrar outra" e "Voltar ao painel".
  - Erros: `409` volta ao formulário com "Esta dose já foi confirmada." e recarrega a caderneta; `400` por campo; `404` recarrega o catálogo e a caderneta; `403` mostra a mensagem da API; falha de conexão continua na revisão. A própria caderneta é bloqueada também na rota (RS006).
- **Diferenças intencionais do design:** sem o gráfico mensal (fica no web), "Tempo médio", "Doses descartadas", "Sala aberta" e o contexto do atendimento (unidade, sala, início); sem CNS e vínculo de dependente (etapa 7); sem prioridade, "Contatados hoje", "Exportar lista" e "Iniciar busca ativa"; sem validade do lote e leitor de código de barras; sem protocolo e central de ajuda; registros recentes sem filtros e sem paginação (5 itens). A busca de cidadão virou uma aba ("Cidadãos"), e a aba "Vacinação" do design é o atalho do Painel.
- Requisitos: RF009, RF010, RS001, RS005, RS006.
- **Backend:** nenhum.

## [x] Etapa 7: Dependentes

- **Design:** `design-mobile/dependentes/`.
- [x] **Dados:** `services/dependents.ts` (CRUD, caderneta e registro manual do dependente) e tipos em `types/dependent.ts`. Regras puras em `utils/dependents.ts`: rótulos de sexo e parentesco, `formatAge` ("8 anos", "5 meses"), validação do formulário e resumo da situação (D32). O `contexts/DependentsContext` (+ `hooks/useDependents`) envolve a ala Cidadão: lista os dependentes e busca a caderneta de cada um em paralelo para o resumo, porque o `GET /dependents` não traz a situação. Isso é aceitável para poucos dependentes.
- [x] **Caderneta reaproveitada:** o `VaccinationCardProvider` recebe o dono (`owner`: titular ou dependente) e expõe as rotas (`paths`). Caderneta, detalhe da vacina e cadastro manual foram para `components/vaccination/screens/` (`CardScreen`, `VaccineDetailScreen`, `RecordScreen`). As rotas do titular (`cidadao/caderneta`, `vacina/[vaccineId]`, `registro-vacina`) e as do dependente só renderizam essas telas. O `VaccineRecordFlow` e a exclusão escolhem o serviço pelo dono, e os textos mudam com `getCardTexts` ("na sua caderneta" ou "na caderneta de Lucas").
- [x] **Rotas:** `cidadao/dependentes` (lista), `dependentes/novo` e `dependentes/[dependentId]/` (Stack com o provider da caderneta do dependente): `index` (perfil), `editar`, `caderneta`, `vacina/[vaccineId]` e `registro-vacina`.
- [x] **Acesso:** "Meus dependentes" no Perfil da ala Cidadão (também para o profissional nesta ala, D11) e o cartão "Dependentes" na Início, só com dependentes cadastrados, com a situação de cada um.
- [x] **Lista:** resumo "N dependentes vinculados" e um cartão por dependente com iniciais, nome, idade e parentesco, badges de situação ("N atrasadas", "N aguardando conferência", "Em dia" ou "Sem vacinas"), quantidade de vacinas e "Ver perfil". Estado vazio com o aviso de privacidade (RS004). Atualiza ao voltar para a tela.
- [x] **Cadastro e edição** (`components/dependents/DependentForm`): nome (contador de 120 caracteres), nascimento (DD/MM/AAAA, não futura), sexo e parentesco (pílulas obrigatórias na tela), CPF opcional (máscara e dígitos verificadores). A regra de idade (menor de 18, exceto Curatelado) é conferida antes do envio, só se o nascimento ou o parentesco mudarem, como na API. Erros: `400` por campo (a mensagem de idade vai para o parentesco e a de "posterior a uma dose" para o nascimento), `409` de CPF no campo e `409` de nome e nascimento (RS008) no diálogo "Cadastro já existente" (`ConfirmDialog` ganhou `showCancel`).
- [x] **Perfil do dependente:** iniciais, nome, idade e parentesco; nascimento, sexo, CPF completo (o responsável é o titular, D14), parentesco e data do cadastro; cartão "Caderneta de Lucas" com a quantidade de vacinas e a situação; "Editar dados" e "Remover dependente". Aviso de sucesso depois de cadastrar ou editar.
- [x] **Remover:** `ConfirmDialog` danger avisando que os registros não confirmados são apagados; `409` (dose confirmada) mostra a mensagem da API; `404` trata como já removido.
- [x] **Caderneta do dependente:** as mesmas telas do titular (busca, filtros, badges, as três situações do D32, detalhe e histórico), com "Caderneta do dependente" e o nome no cabeçalho. Registro manual, edição e exclusão só enquanto o registro aguarda conferência (D30), pelas rotas `/dependents/:id/vaccination-records`.
- [x] **Ala profissional:** `components/professional/DependentOf` ("Dependente de <nome>") na busca de cidadãos, na busca ativa, nos registros recentes, na ficha do cidadão e na confirmação (com o responsável na revisão). Dependente sem CPF aparece como "Sem CPF". A busca ganhou a dica do CPF do responsável. Na ficha de um dependente do próprio profissional, as ações de confirmar ficam ocultas e aparece o aviso RS006; a rota `confirmar-dose` também bloqueia (a API responde `403`).
- **Diferenças intencionais do design:**
  - Sem "Solicitar verificação" no diálogo de duplicado (a API não tem esse fluxo) e sem "Salvar e adicionar outro".
  - Sem o menu "…" e o "?" do cabeçalho; o lápis do cabeçalho do perfil virou só o botão "Editar dados".
  - "Vinculado desde" virou "Cadastrado em" (`createdAt`). O perfil mostra também sexo e CPF.
  - Parentesco no enum da API: Filho(a), Pai/Mãe, Cônjuge, Curatelado(a) e Outro (sem Neto(a) e Tutelado(a)). Campo sexo acrescentado (exigido pela API).
  - O texto da remoção ("o histórico será mantido") contradiz a API: os registros não confirmados são apagados e quem tem dose confirmada não pode ser removido.
  - Sem "receber lembretes" no estado vazio (notificações do sistema adiadas, D24).
  - O seletor "de quem é a caderneta" virou o cartão "Dependentes" na Início.
- Requisitos: RF012, RS004, RS006, RS008. Decisões D30, D32 e D33 (o D09 foi resolvido).
- **Backend:** módulo `dependents` (D33) e `responsible` na busca, na caderneta, no `/overdue` e no `/recent-doses`.

## [x] Etapa 8: OCR da caderneta física

- **Design:** `design-mobile/ocr/`.
- [x] **Dados:** `readCardPhoto` (`services/vaccinationRecords.ts`, `POST /vaccination-records/ocr` em `multipart/form-data`, campo `image`, timeout próprio de 35 s e cancelamento por `AbortController`) e tipos em `types/ocr.ts`. O `ManualRecordPayload` ganhou `origin` e `ocrConfidence`. O `parseApiError` passou a devolver o `code` da API (e `TIMEOUT` quando a requisição estoura o tempo no app). Regras puras em `utils/ocr.ts`: itens da revisão (`toScanItems`), validação dos itens marcados (`validateScanItems`), corpo `OCR_ICR` (`toOcrPayload`) e mensagens por `code` e por `fallbackReason`.
- [x] **Foto (`services/cardPhoto.ts`):** `expo-image-picker` (câmera do sistema e seletor de fotos, ambos no Expo Go) e `expo-image-manipulator` (lado maior de até 2000 px, JPEG 0,8). LGPD: a foto original e a reduzida ficam só no cache do app e são apagadas com `expo-file-system` depois do envio, ao refazer, ao falhar e ao sair do fluxo. A exclusão só atua em arquivos do cache do app, nunca na foto original da galeria. Os recortes da API ficam só na memória.
- [x] **Rotas:** `cidadao/digitalizar` (titular) e `cidadao/dependentes/[dependentId]/digitalizar`, as duas com a `ScanScreen` (`components/vaccination/screens/`) e o dono vindo do `VaccinationCardProvider` (`paths.scan`). Gesto de voltar do iOS desligado nessas rotas, para não perder a leitura sem querer.
- [x] **Entrada:**
  - **Aba central "Digitalizar"** na barra da ala Cidadão, entre Caderneta e UBS, como no design (`cidadao/inicio-caderneta-de-vacinacao.png`): círculo `primary` elevado com o ícone branco (`scanTabIcon`) e o rótulo em `primary`. O toque abre `cidadao/digitalizar` por cima das abas (a rota `(abas)/escanear` só redireciona). Na Caderneta do titular ficou só o "Cadastrar vacina".
  - **"De quem é esta caderneta?" (`OwnerPicker`):** pela aba, quem tem dependentes escolhe primeiro (Você ou cada dependente); sem dependentes, a pergunta é pulada. O dependente escolhido ganha um `VaccinationCardProvider` próprio, então a caderneta conferida, o salvamento, o cadastro manual e o "Ver caderneta" usam as rotas dele. Voltar da orientação (também o voltar do Android) retorna à pergunta. Depois de salvar na caderneta de um dependente, o resumo dos dependentes é recarregado.
  - **Caderneta do dependente:** botões "Digitalizar caderneta" e "Cadastrar vacina" (também no estado vazio), já com o dependente como dono, sem a pergunta.
  - O estado vazio da caderneta deixou de dizer "em breve".
  - **`Button`:** o texto passou a encolher e quebrar linha dentro do botão (o ícone ficava para fora em botões lado a lado ou com a fonte ampliada).
- [x] **Fluxo (`components/ocr/ScanFlow`), etapas X de 4 no `StepHeader`:**
  1. **Orientação (`ScanGuide`):** modelos suportados (Caderneta da Criança do MS e Caderneta de Jovens e Adultos de Maceió), dicas (página inteira ou as duas abertas, plana, iluminada, sem sombra ou reflexo) e o aviso de que a foto não fica salva. A permissão da câmera só é pedida ao tocar em "Tirar foto". Negada: aviso com a galeria e o cadastro manual e, se o sistema não deixar perguntar de novo, "Abrir configurações". A galeria usa o seletor do sistema, que não pede permissão.
  2. **Conferir foto (`PhotoPreview`):** "Refazer" (abre a mesma origem) e "Usar esta foto".
  3. **Leitura (`ReadingStep`):** indicador indeterminado, anúncio ao leitor de tela e "Cancelar" (volta à foto).
  4. **Revisão (`ReviewStep` + `ScanItemCard`):** "Encontramos N doses", aviso fixo "Confira os dados com a caderneta; a leitura automática pode errar" e, com alinhamento `BAIXA`, a sugestão de outra foto. Cada item: vacina e dose (ou o impresso na caderneta), checkbox "Salvar esta dose", recorte da célula, recorte da vacina escrita (blocos livres) e **data e lote editáveis ao lado dos recortes**, vazios quando a leitura teve baixa confiança. Dose que já está na caderneta começa desmarcada, com o badge "Já está na caderneta".
  - **Editor completo (`ItemEditor`):** o `VaccineRecordForm` com os valores do item e o recorte acima de cada campo (prop nova `fieldAddons`). É o caminho para escolher vacina e dose quando vêm `null` ("Escolher vacina e dose") ou para editar tudo. "Concluir" valida e marca o item.
  - **Validação:** item marcado sem vacina, dose ou data válida (ou com a dose repetida em outro item, ou já na caderneta) não é enviado. O erro aparece no próprio item (borda e número em vermelho) e o botão vira "Salvar N doses: K precisam de atenção", que rola até o primeiro item com problema e anuncia a quantidade.
  - **Falha (`ScanFailure`):** `manualFallback` (modelo não reconhecido ou nenhuma dose) e erros por `code` (`OCR_INDISPONIVEL`/`OCR_ERRO`, `OCR_TIMEOUT`, `IMAGEM_GRANDE`, `FORMATO_INVALIDO`/`IMAGEM_INVALIDA`/`IMAGEM_AUSENTE`/`UPLOAD_INVALIDO`, sem conexão) com mensagem própria, "Tentar outra foto" e "Cadastrar manualmente" (RNF12).
- [x] **Salvar:** um `POST` por dose marcada, em sequência, pela rota do dono (`/vaccination-records` ou `/dependents/:id/vaccination-records`) com `origin: "OCR_ICR"` e o `ocrConfidence` da sugestão; aguardando conferência (D30). Botão com "Salvando X de N...". **Resultado (`SaveResults`):** cada dose como "Salva · aguardando conferência", "Já estava na caderneta" (`409`) ou "Não foi salva" com a mensagem da API; "Revisar as doses que falharam" volta à revisão só com elas; "Ver minha caderneta" recarrega e volta à caderneta.
- [x] **Voltar:** o voltar do Android segue a etapa (foto → orientação, leitura → cancelar, editor → lista, resultado → caderneta). Sair da revisão pede confirmação ("Sair sem salvar?").
- [x] **Ajustes na etapa "Conferir foto" (2026-11-08):**
  - **Girar:** "Girar à esquerda" e "Girar à direita" (90°).
  - **Recortar:** recorte livre, sem proporção fixa, numa tela própria (`CropStep`). Tem quatro alças nas bordas, arrastáveis (`PanResponder`, funciona no Expo Go e no APK) ou ajustáveis pelo leitor de tela (5% por vez). Sobra pelo menos 25% da foto em cada direção. O aviso diz: "Mantenha a página inteira no recorte; cortar demais impede o reconhecimento da caderneta."
  - **Layout sem rolagem (correção do teste no celular):** a tela não usa a `Screen`.
    - A foto cabe inteira ("contain") no espaço medido entre o cabeçalho e o rodapé, usando a largura e a altura da foto atual (vertical, horizontal ou girada).
    - O aviso e os botões ficam numa barra fixa, dentro da área segura.
    - Com a fonte ampliada (escala ≥ 1,3), o aviso começa recolhido em "Ver aviso sobre o recorte". O leitor de tela lê o aviso completo no rótulo.
    - O recorte fica em frações da foto, então as alças e o recorte enviado continuam certos quando a foto muda de tamanho na tela.
  - **Por que não o recorte nativo:** o do `expo-image-picker` só existe na hora de tirar ou escolher a foto e não serve para uma foto já na prévia ou já girada.
  - **Desfazer ajustes:** volta à foto original.
  - **Como os ajustes são aplicados:** ficam numa lista aplicada sempre à original, numa só renderização (`applyEdits` em `services/cardPhoto.ts`, sem recomprimir a cada giro), e valem para a prévia e para a imagem enviada.
  - **Cache (LGPD):** a versão ajustada anterior é apagada a cada ajuste, e a de um ajuste ultrapassado também. Ao desfazer, refazer, enviar ou sair, as versões ajustadas são apagadas junto com a original e a reduzida.
  - **Acessibilidade:** rótulos e dicas nos botões (girar só com ícone e rótulo para o leitor de tela), alvos de 48 px e anúncios "Foto girada para a esquerda/direita", "Foto recortada" e "Ajustes desfeitos".
- **Diferenças intencionais do design:**
  - Câmera do sistema (`expo-image-picker`) no lugar da tela de captura com moldura, flash e "Documento detectado", que exigiriam o `expo-camera` com detecção de bordas. A prévia ("Conferir foto") foi mantida.
  - A leitura não mostra porcentagem (a API não informa o progresso) e diz "até 20 segundos", o limite do backend.
  - Na revisão, sem "Próxima dose", "Profissional responsável" e "Adicionar outra vacina" (a API não aceita esses campos e o cadastro manual cobre o último); "Remover linha" virou o checkbox "Salvar esta dose"; o menu "…" virou o botão do editor completo.
  - O modal "Não conseguimos ler tudo" virou a tela de falha. Leitura parcial vai direto à revisão, com os campos vazios para preencher olhando o recorte.
  - O lote é opcional (como no cadastro manual e na API), e não obrigatório como no design.
- **Pendente para os testes com fotos reais (no celular, com o backend e o serviço de OCR rodando):**
  - Os dois modelos: Caderneta da Criança (tabelas "até 12 meses" e "a partir de 12 meses") e a de Maceió (blocos impressos e livres), com página única e com as duas páginas abertas.
  - Fotos inclinadas, com sombra, reflexo, pouca luz e bordas cortadas: conferir o `fallbackReason` e o aviso de alinhamento `BAIXA`.
  - Tempo de leitura na rede local e o tamanho do upload depois da redução (bem abaixo dos 8 MB); confirmar que o timeout de 35 s do app basta.
  - Envio do `multipart` pelo Axios no Android e no iOS (Expo Go).
  - Limpeza do cache: conferir que as fotos somem depois do envio, ao cancelar e ao sair.
  - Permissão da câmera negada uma vez e negada de vez (Android), e o "Abrir configurações".
  - Doses com `doseId: null` (Hepatite B do adulto, HPV 2ª dose) e blocos livres sem match no catálogo, escolhidos pelo editor.
  - Leitor de tela (TalkBack) e fonte ampliada nos recortes, nos campos ao lado e no botão de salvar.
- Requisitos: RF004, RS003, RNF05, RNF12. Decisões D25, D30, D34 e D35.
- **Backend:** `POST /vaccination-records/ocr` (D34) e `origin`/`ocrConfidence` nas rotas de cadastro manual. O backend usa o microsserviço Python (D25).

## [~] Etapa 9: Alertas de vacinação (concluída parcialmente: alertas dentro do app)

- **Design:** `design-mobile/cidadao/central-de-notificacoes-rf007.png`.
- **Decisão (2026-10-28):** as notificações do sistema foram retiradas por agora (D24), para não deixar funcionalidade com erro no projeto: no Expo Go do Android (SDK 58), criar o canal falhava (NullPointerException) e tocar na notificação fechava o app. Ficam para a etapa final "Notificações do sistema". Os alertas continuam dentro do app.
- [x] **Regra (D32, RF007 nota 7):** a caderneta da API ganhou `alert: { status, pendingDoses }` por vacina. `ATRASADA` = dose vencida sem nenhum registro; `AGUARDANDO_CONFERENCIA` = doses informadas e não confirmadas, sem dias de atraso ("Dose informada · leve sua caderneta à UBS para conferência"); `EM_DIA`/`COMPLETA` = sem pendências. Só a confirmação por um profissional encerra o alerta. O app exibe essa situação em toda a ala Cidadão: badge, filtros (novo "Aguardando conferência", `?filtro=` na URL), ordem, resumo da Início (com a linha "N vacinas aguardando conferência") e aviso no detalhe. Atraso acima de 1 ano: "Há mais de 1 ano em atraso".
- [x] **Avisos (`utils/vaccineAlerts.ts`, funções puras):** `getTodayNotices` monta os avisos de hoje, agregados por vacina (nota 2): atrasada a partir do dia seguinte à data prevista (nota 6), com os dias de atraso (nota 3); aguardando conferência; e a dose prevista para hoje. `getUpcomingDoses` lista as previstas para os próximos 7 dias (D31).
- [x] **Início:** sino com a quantidade de avisos do dia (abre a Central) e o cartão "Alertas" com atrasadas e aguardando conferência (`components/alerts/AlertRow`).
- [x] **Central de notificações** (`cidadao/notificacoes`): resumo, cartão "Hoje" com atrasadas ("Registrar dose", que abre o cadastro com a vacina), aguardando conferência e doses previstas para hoje ("Ver detalhes"), e "Próximos 7 dias".
- **Diferenças intencionais do design:** sem "Anteriores", "Marcar como lidas", "2 novas", o horário e o menu "…" (não há histórico de notificações; a Central recalcula os avisos da caderneta); "Próximos 7 dias" no lugar do histórico; sem as abas Digitalizar e Dependentes (outras etapas).
- Requisitos: RF007 (notas 2, 3, 6 e 7 dentro do app; as notas 4, 5 e 8 dependem das notificações do sistema) e a ampliação D31. Decisões D24, D31 e D32.
- **Backend:** campo `alert` na caderneta e busca ativa e `/summary` com os grupos do D32. O web separa a busca ativa em Atrasadas e Aguardando conferência.

---

## [~] Etapa final: Notificações do sistema e APK (implementada; falta validar no APK)

- **Base:** o código do commit `840e50d`, adaptado para os dependentes e desligado no Expo Go. Regras na **D36**.
- [x] **APK (EAS Build):**
  - `eas.json` com o perfil `preview` (APK, `distribution: internal`, ambiente `preview` e `EXPO_PUBLIC_NOTIFICATION_TEST=true`).
  - `app.json`: `android.package` `br.edu.cesmac.vacinei`, `versionCode` 1, microfone bloqueado e plugin `expo-notifications` (ícone monocromático `assets/images/notification-icon.png`, gerado a partir do primeiro plano do ícone adaptativo, e cor `#077A66`).
  - `expo-build-properties` com `usesCleartextTraffic` (concessão do protótipo, D36: em produção, HTTPS).
  - Nome, ícone, splash e textos de permissão em pt-BR já estavam coerentes.
- [x] **Ambiente:** `services/vaccineNotifications.ts` carrega o `expo-notifications` com `import()` só fora do Expo Go (`notificationsAvailable`). No Expo Go, as funções não fazem nada e a permissão volta como `unavailable`.
- [x] **Regras (D31, D36):**
  - `buildDailyDigest` (alertas e lembretes de 7 dias antes e do dia, conforme as preferências) e `formatDigestNotification(digest, target)`, com título e rotas por pessoa (`SELF_TARGET`, `getDependentTarget`). O `getTodayNotices` da Central e da Início continua sem as preferências.
  - Uma notificação por pessoa por dia, às 8h, 30 dias, teto de 60.
  - `contexts/VaccineAlertsContext` (na ala Cidadão, dentro do `DependentsProvider`) reagenda ao carregar a caderneta do titular ou de um dependente (`DependentsContext.cardLoaded`), ao mudar os dependentes e ao voltar ao primeiro plano.
  - O `AuthContext` cancela tudo ao sair, com a sessão expirada e na abertura sem sessão.
  - Testadas com relógio simulado: 13 cenários (7 dias antes, no dia, atraso, preferências, títulos e rotas do titular e do dependente).
- [x] **Permissão:** `ConfirmDialog` "Ative os lembretes de vacina" ("Ativar lembretes" / "Agora não"), uma vez por conta, depois do login e com a caderneta carregada.
  - **Correção depois da validação no APK (2026-11-08):** o modal não aparecia numa instalação nova. No Android 13+, a permissão nunca pedida volta como `denied` com `canAskAgain: true`, e a condição exigia `undetermined`. Agora basta "não concedida e o sistema ainda pode pedir"; o "uma vez por conta" continua pelo `prompted`. O modal abre 0,8 s depois de a condição valer, para não competir com a transição de tela do login.
- **Validado no APK (2026-11-08):** login, notificação de teste, toque abrindo a caderneta (inclusive vindo da ala Profissional), interruptores do Perfil, pedido de câmera em português e OCR. Falta conferir de novo o modal depois da correção.
- [x] **Toque:** `components/alerts/NotificationTapHandler` no navegador raiz abre o detalhe da vacina ou a caderneta filtrada (`?filtro=`), do titular ou do dependente. Trata também o toque que abriu o app fechado e troca o profissional para a ala Cidadão.
- [x] **Perfil:** `NotificationSettingsCard` com "Alertas de vacina" e "Lembretes da próxima dose", e o aviso "Disponível no app instalado" no Expo Go. Também traz "Abrir configurações" quando a permissão está bloqueada e o botão de teste no APK `preview`. A Central mostra "Notificações desativadas · Ativar no Perfil".
- **Gerar o APK (no computador, em `mobile/`):**
  1. `npm install -g eas-cli` e `eas login` (conta Expo).
  2. `eas init`: cria o projeto no Expo e grava o `extra.eas.projectId` (e o `owner`) no `app.json`. Commitar essa mudança.
  3. `eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value http://<IP-do-computador>:3333 --visibility plaintext`. O valor é embutido no APK, e o `.env` local não vai para o build.
  4. `eas build -p android --profile preview`: o build roda na nuvem do Expo. No fim, o link e o QR baixam o APK; no celular, permitir a instalação de fontes desconhecidas.
  5. Celular e computador na mesma rede, backend (e serviço de OCR) rodando e o firewall liberando a porta 3333. Se o IP mudar, atualizar a variável (`eas env:update`) e gerar outro build.
- **Validar no APK (roteiro do vídeo):**
  - O modal aparece depois do login e abre o pedido do sistema.
  - O canal "Alertas de vacina" aparece nas configurações do app.
  - "Enviar notificação de teste" chega em 5 s, com o app aberto e em segundo plano.
  - O toque abre o detalhe da vacina ou a caderneta filtrada, inclusive com o app fechado e num dependente.
  - Os interruptores do Perfil funcionam.
  - Ao sair, a barra é limpa.
  - A chegada às 8h (ou com o relógio do celular adiantado).
- **Plano B (D36):** se as notificações não funcionarem no APK, entra o envio diário por e-mail pelo backend (sugestão do orientador): uma rotina agendada com os avisos do D32 e os lembretes do D31, consolidados por pessoa, uma vez por dia e sem duplicar.

## [x] Revisão final de acessibilidade (2026-11-08)

Revisão de todas as telas das duas alas (TalkBack, fonte em 2x, alvos de 48 px, contraste e informação além da cor). Os tokens passam no AA (`muted` 4,7 a 5,3:1 nos fundos claros, `primary` 5,3:1 no branco, `warning` e `danger` nos fundos suaves, contorno `input` 3,2:1). Situações e badges sempre têm texto.

- [x] **Foco no primeiro erro (`hooks/useFieldFocus`):** ao validar (no app ou pela API), anuncia "N campos precisam de atenção" e leva o foco do teclado e do TalkBack ao primeiro campo com erro, que lê o rótulo e a mensagem. A validação não mudou. Vale no login, cadastro, recuperação de senha, registro manual, editor do OCR, dependente e confirmação de dose. `SelectField`, `CodeInput` e `FilterChips` passaram a aceitar `ref`.
- [x] **Barra inferior (`useTabScreenOptions`):** a altura acompanha a escala da fonte (antes era fixa e cortava o rótulo). O rótulo cresce até 1,3x e encolhe para caber na aba, sem truncar; o TalkBack lê o nome inteiro.
- [x] **Fonte ampliada:** `AlertRow` põe a ação embaixo do texto a partir de 1,3x; o valor do `SelectField` quebra linha; caixas do código, do número do item do OCR e do contador do sino crescem com o texto; a data da lista da caderneta encolhe; iniciais dos círculos crescem só até 1,3x (`INITIALS_MAX_FONT_SCALE`, decorativas).
- [x] **`SegmentedControl`:** borda `primary` na opção ativa (antes só a cor do texto a distinguia) e 48 px de altura.
- [x] **TalkBack:** a revisão do OCR leva o foco ao primeiro item com problema; o status de verificação entra no rótulo da Ala Profissional (`RadioCard.extraLabel`); cabeçalhos nas seções da revisão da confirmação e nos nomes das vacinas da caderneta do cidadão; o rótulo "Como você usará o aplicativo?" não é lido duas vezes.
- [x] **Perfil:** o texto das opções de notificação também alterna o interruptor.
- **Limitações registradas (baixa gravidade, não corrigidas):**
  - Botões desabilitados com 50% de opacidade e bordas claras (`border`) em chips e botões secundários: a WCAG isenta componentes inativos, e o texto identifica o controle.
  - Ícones dentro de badges não crescem com a fonte (sem corte, só desproporção).
  - E-mail da saudação da Início em uma linha.
  - O resumo "N dependentes vinculados" agrupa o título e perde o papel de cabeçalho.
  - Marcadores do mapa (WebView/Leaflet) inacessíveis ao TalkBack; a lista é a alternativa, e o rótulo do mapa avisa.
  - No iOS, `accessibilityLiveRegion` não existe: banners não são anunciados ao aparecer (o alvo do TCC é Android/TalkBack). O foco no primeiro erro usa `announceForAccessibility`, que funciona nos dois.
  - No Android, o fundo "Fechar" da lista de seleção e do diálogo pode receber o primeiro foco.
- **Falta conferir no celular** (fonte do sistema no máximo e TalkBack), principalmente a barra inferior e o foco nos erros.

---

## Possíveis melhorias futuras (vindas dos designs)

Itens que aparecem em `docs/design-mobile/`, mas não têm suporte na API ou estão fora do levantamento de requisitos. Ficam de fora por enquanto, para avaliação posterior:

- **Busca ativa** (`profissional/busca-ativa.png`):
  - "Contatados hoje": exigiria registrar o contato com o cidadão.
  - "Prioridade crítica": exigiria uma regra de prioridade no `GET /dashboard/overdue`.
- **Dashboard do profissional** (`profissional/dashboard.png`):
  - "Tempo médio" (de atendimento).
  - "Doses descartadas": o sistema não controla estoque nem descarte.
- **Rodapé do login** (`auth/login.png`): links "Termos de uso" e "Ajuda". Ainda não há conteúdo para essas páginas; o app mostra só a "Política de privacidade".
- **UBS da dose** (D29): registrar a UBS onde a dose foi aplicada na confirmação (backend e web) e exibi-la no histórico de doses.
- **Resumo da situação no `GET /dependents`:** a API devolver, para cada dependente, a quantidade de vacinas e os totais de atrasadas e aguardando conferência (D32). Hoje o app busca a caderneta de cada dependente só para montar o resumo da lista e da Início.
- **Doenças prevenidas em lista:** guardar as doenças prevenidas como lista no catálogo de vacinas (backend e Gerenciador Web), em vez de texto único, eliminando a heurística de separação dos chips no app.

---

## Resumo de endpoints

| Função | Situação |
| :--- | :--- |
| Login, refresh, recuperação de senha, perfil e troca de senha | Pronto |
| Cadastro de cidadão e de profissional (`POST /users`) | Pronto |
| Caderneta do titular (`GET /citizens/:id/vaccination-records`) | Pronto |
| UBS próximas (`GET /ubs` com coordenadas) e catálogo de vacinas | Pronto |
| Ala profissional: busca, confirmação, busca ativa e indicadores | Pronto |
| Alertas dentro do app | Pronto (usa a caderneta) |
| Notificações do sistema (locais, D36) | Pronto no app (sem endpoint; falta validar no APK) |
| Logout (`POST /auth/logout`) | Pronto |
| Registro manual de vacina (`POST/PUT/DELETE /vaccination-records`) | Pronto |
| Dependentes (CRUD, caderneta, confirmação, busca) | Pronto |
| OCR (serviço Python + `POST /vaccination-records/ocr`) | Pronto (falta testar com fotos reais) |
| Situação do alerta na caderneta (`alert`, D32) | Pronto |
| Push (`/devices` + Expo Push) | **Novo** (complemento, melhoria futura) |
