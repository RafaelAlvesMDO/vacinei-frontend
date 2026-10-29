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
- **Bibliotecas por etapa:** `expo-location` + `react-native-webview` com Leaflet (mapa), `expo-image-picker`/`expo-camera` (OCR), `expo-notifications` (notificações do sistema, etapa final; retirada por agora).

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

## [ ] Etapa 7: Dependentes

- **Design:** `design-mobile/dependentes/`.
- Listar, cadastrar e editar dependentes (nome, nascimento, CPF opcional, parentesco); caderneta de cada dependente; cadastro manual de vacina para o dependente; seletor "de quem é a caderneta" na tela inicial.
- Ala profissional: o dependente aparece na busca e pode ter doses confirmadas (D09).
- Requisitos: RF012, RS004 (só o responsável vê), RS008 (mesmo nome e nascimento não podem ter dois responsáveis).
- **Backend novo:** módulo `dependents` (hoje vazio): `GET/POST /dependents`, `PUT/DELETE /dependents/:id`, `GET /dependents/:id/vaccination-records`, `dependentId` no registro manual e na confirmação, e dependentes na busca e nas métricas (D09).

## [ ] Etapa 8: OCR da caderneta física

- **Design:** `design-mobile/ocr/`.
- Foto da caderneta (`expo-image-picker`/`expo-camera`), envio, revisão das doses reconhecidas (cada uma editável e descartável) e gravação como `OCR_ICR`, pendente de confirmação (D06).
- Baixa confiança ou falha: aviso amigável e oferta do cadastro manual, sem perder o que já foi lido (RNF12).
- Requisitos: RF004, RS003, RNF05, RNF12. Pede a permissão da câmera (e da galeria) com a finalidade explicada. LGPD: a imagem não fica salva depois do processamento.
- **Backend novo:** microsserviço em Python (D25) (OpenCV no pré-processamento + `pytesseract`) chamado pelo backend. Rotas `POST /vaccination-records/ocr` (multipart, devolve sugestões, sem gravar) e gravação em lote (`POST /vaccination-records` com `origin: OCR_ICR`).

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

## [ ] Etapa final: Notificações do sistema

- **Código de referência:** o commit `840e50dbedb0f48525dc1adbaefe053a8f140995` (`840e50d`, branch `dev`) é o último com as notificações locais completas. Para recuperar um arquivo: `git show 840e50d:mobile/src/services/vaccineNotifications.ts`.
  - `services/vaccineNotifications.ts`: agendamento diário às 8h nos próximos 30 dias, cancelando os anteriores a cada carga da caderneta (nota 5), canal Android "Alertas de vacina", notificação de teste (`__DEV__`) e `isExpoGo`.
  - `utils/vaccineAlerts.ts`: `buildDailyDigest` (com o lembrete 7 dias antes e no dia, D31) e `formatDigestNotification` (notificação consolidada, nota 8, e destino do toque, nota 4), testados com relógio simulado (16 cenários).
  - `contexts/VaccineAlertsContext`, `services/notificationPreferences.ts`, `components/alerts/NotificationPrompt` (permissão explicada), `NotificationSettingsCard` (interruptores no Perfil) e o cancelamento no `AuthContext` ao sair (LGPD).
- **1. Validar as notificações locais num APK (EAS Build):** gerar o build instalável e conferir o pedido de permissão, a chegada diária, o canal "Alertas de vacina" nas configurações do app e a navegação ao tocar (detalhe da vacina ou Caderneta filtrada), com o app fechado e aberto.
- **2. Se não funcionarem, envio diário por e-mail pelo backend** (sugestão do orientador): rotina agendada que calcula os avisos do D32 (atrasadas e aguardando conferência, consolidados por pessoa, uma vez por dia e sem duplicar) e os lembretes do D31. Funciona com o app fechado e usa a caderneta atual.

## Revisão final de acessibilidade

- Conferir ícones com a fonte do sistema ampliada.

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
| Logout (`POST /auth/logout`) | Pronto |
| Registro manual de vacina (`POST/PUT/DELETE /vaccination-records`) | **Novo** |
| Dependentes (CRUD, caderneta, confirmação, busca) | **Novo** |
| OCR (serviço Python + `POST /vaccination-records/ocr`) | **Novo** |
| Situação do alerta na caderneta (`alert`, D32) | Pronto |
| Push (`/devices` + Expo Push) | **Novo** (complemento, melhoria futura) |
