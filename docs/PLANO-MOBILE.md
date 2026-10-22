# VACINEI!? — Plano do App Mobile

Roteiro das etapas do aplicativo (`mobile/`). O contrato da API está em [`API.md`](./API.md), as regras em [`DECISOES.md`](./DECISOES.md) e a identidade visual em [`DESIGN.md`](./DESIGN.md).

Legenda: `[x]` concluída · `[ ]` pendente · **Backend novo:** endpoint que ainda não existe na API.

---

## Base técnica

- **Expo SDK 57 + React Native 0.86 + TypeScript estrito** (sem `any`). Testes no celular pelo Expo Go, que só abre projetos do SDK que ele suporta (a versão 57.0.9 do Expo Go aceita apenas o SDK 57). Atualizar o SDK só quando o Expo Go das lojas suportar a versão nova (`npm install expo@^N` + `npx expo install --fix`).
- **Navegação:** Expo Router (rotas por arquivo em `src/app/`): grupo `(auth)` e as alas em pastas `cidadao/` e `profissional/` (URLs `/cidadao/...` e `/profissional/...`), cada uma com abas inferiores. As alas não são grupos porque as duas têm a aba Perfil, e dois grupos com `perfil` gerariam a mesma URL. A proteção fica no `_layout.tsx` raiz (`Stack.Protected`).
- **HTTP:** Axios em `src/services/api.ts`, no mesmo padrão do web: Bearer token, renovação única no `401` via `POST /auth/refresh`, opção `skipAuthRefresh` e `parseApiError` (erros por campo do Zod). Chamadas isoladas em `src/services/`.
- **Sessão:** `expo-secure-store` para o access token, o refresh token e o usuário mínimo (`id`, `name`, `email`, `role`, `professionalRegistry`; sem CPF, como no web). Sem "Lembrar de mim": o app mantém a sessão até sair ou expirar.
- **URL da API:** `EXPO_PUBLIC_API_URL` em `mobile/.env` (ex.: `http://192.168.0.10:3333`, IP do computador na rede local), com `mobile/.env.example` versionado. O backend precisa escutar em `0.0.0.0`.
- **Tema:** `src/theme/` com os tokens do `DESIGN.md` (`colors`, `spacing`, `radius`, `typography`) e a fonte Inter (`@expo-google-fonts/inter`). Estilos com `StyleSheet` lendo o tema; nada de cores soltas.
- **Componentes:** `src/components/ui/` (Button, TextField, PasswordField, SelectField, CodeInput, Checkbox, RadioCard, Card, Badge, Banner, PasswordChecklist, StepHeader, Screen) com acessibilidade nativa (`accessibilityLabel`, `accessibilityRole`, alvos de toque de 48 px). Ícones: `@expo/vector-icons` (Ionicons).
- **Reaproveitamento do web:** portar as funções puras de `web/src/utils/` (`password`, `cpf`, `name`, `format`, `councils`) e os tipos de `web/src/types/`.
- **Bibliotecas por etapa:** `react-native-maps` + `expo-location` (mapa), `expo-image-picker`/`expo-camera` (OCR), `expo-notifications` (alertas).

---

## [x] Etapa 1: Base do app

- [x] Projeto Expo SDK 57 em `mobile/` (TypeScript estrito), Expo Router, ESLint (`eslint-config-expo`, `no-explicit-any` como erro) e scripts (`npm run start`, `npm run lint`, `npm run typecheck`).
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
- [x] **Abas provisórias:** ala Cidadão (Início, Perfil) e ala Profissional (Painel, Perfil). Perfil simples (`components/profile/ProfileScreen`): dados da conta, badge de verificação, "Trocar para a ala ..." (só profissional), política de privacidade e "Sair" (com confirmação).
- [x] **Política de privacidade** (`privacidade`): conteúdo do `/privacidade` do web, adaptado ao app (sessão no armazenamento seguro, consentimento do art. 11, I e direito de revogá-lo).
- Requisitos: RF001, RF002, RF011, RS001, RS007, RNF03, RNF04, RNF10.
- **Pendente (próximas etapas):** perfil completo (RF003, D19: editar o nome com `PATCH /auth/me` e trocar a senha com `PATCH /auth/me/password`) e encerramento por inatividade (RNF11) ao voltar do segundo plano (`AppState`).
- **Logout (D27):** o `signOut` limpa o aparelho e revoga o refresh token com `POST /auth/logout`, sem bloquear a saída se a chamada falhar. O cadastro envia `acceptedPrivacyPolicy: true` (D26).

## [ ] Etapa 3: Caderneta digital

- Tela inicial do cidadão: resumo (`emDia`, `atrasadas`, `completas`) e lista de vacinas por status (atrasadas primeiro), via `GET /citizens/:id/vaccination-records` com o próprio id.
- Detalhe da vacina: doses aplicadas/total, próxima dose e data, registros com badge "Confirmado" ou "Aguardando confirmação" (D06), lote, UBS e profissional.
- Puxar para atualizar, estados de carregando, vazio e erro.
- Requisitos: RF006, RS004.
- **Backend:** nenhum.

## [ ] Etapa 4: Mapa de UBS

- Mapa (`react-native-maps`) e lista das UBS próximas: `GET /ubs?latitude=&longitude=&radiusKm=` (ordenado por `distanceKm`), com a localização do aparelho (`expo-location`). Sem permissão, busca por nome/bairro (`?search=`) centrada em Maceió.
- Detalhe: endereço, horário (faixas em linhas), telefone (ligar) e "Como chegar" (abre o app de mapas).
- Requisitos: RF008, RNF09 (permissão de geolocalização), RNF15. LGPD: a localização fica só no aparelho e não é salva.
- **Backend:** nenhum.

## [ ] Etapa 5: Cadastro manual de vacina

- Formulário: vacina e dose (`GET /vaccines`), data de aplicação (não futura), lote e UBS opcionais. O registro entra como `MANUAL` e fica "Aguardando confirmação" até um profissional confirmar (D06).
- Editar ou excluir o próprio registro enquanto não estiver confirmado.
- Requisitos: RF005, RS003 (vacina do calendário e data de aplicação não futura).
- **Backend novo:** `POST /vaccination-records` (titular, `origin: MANUAL`), e `PUT`/`DELETE /vaccination-records/:id` só para registros próprios não confirmados.

## [ ] Etapa 6: Ala profissional

- Disponível só para `PROFISSIONAL_SAUDE` verificado; senão, aviso de verificação pendente/recusada (RS001).
- Busca de cidadão por nome ou CPF (`GET /citizens`), caderneta do cidadão e confirmação de dose com lote (`POST /vaccination-records/confirm`), com o mesmo tratamento de `201`/`200`/`409` do web.
- Busca ativa de doses atrasadas (`GET /dashboard/overdue`, D21) e indicadores (`/dashboard/summary`).
- Na própria caderneta, sem ação de confirmar (RS006, D11).
- Requisitos: RF009, RF010, RS001, RS005, RS006.
- **Backend:** nenhum.

## [ ] Etapa 7: Dependentes

- Listar, cadastrar e editar dependentes (nome, nascimento, CPF opcional, parentesco); caderneta de cada dependente; cadastro manual de vacina para o dependente; seletor "de quem é a caderneta" na tela inicial.
- Ala profissional: o dependente aparece na busca e pode ter doses confirmadas (D09).
- Requisitos: RF012, RS004 (só o responsável vê), RS008 (mesmo nome e nascimento não podem ter dois responsáveis).
- **Backend novo:** módulo `dependents` (hoje vazio): `GET/POST /dependents`, `PUT/DELETE /dependents/:id`, `GET /dependents/:id/vaccination-records`, `dependentId` no registro manual e na confirmação, e dependentes na busca e nas métricas (D09).

## [ ] Etapa 8: OCR da caderneta física

- Foto da caderneta (`expo-image-picker`/`expo-camera`), envio, revisão das doses reconhecidas (cada uma editável e descartável) e gravação como `OCR_ICR`, pendente de confirmação (D06).
- Baixa confiança ou falha: aviso amigável e oferta do cadastro manual, sem perder o que já foi lido (RNF12).
- Requisitos: RF004, RS003, RNF05, RNF12. Pede a permissão da câmera (e da galeria) com a finalidade explicada. LGPD: a imagem não fica salva depois do processamento.
- **Backend novo:** microsserviço em Python (D25) (OpenCV no pré-processamento + `pytesseract`) chamado pelo backend. Rotas `POST /vaccination-records/ocr` (multipart, devolve sugestões, sem gravar) e gravação em lote (`POST /vaccination-records` com `origin: OCR_ICR`).

## [ ] Etapa 9: Alertas de vacinação

- **Notificações locais** (`expo-notifications`), sem custo e sem backend: a partir da caderneta (`nextDoseDate` de cada vacina, do titular e dos dependentes), agendar no aparelho um lembrete diário consolidado das doses pendentes e um aviso na data prevista. Reagendar ao abrir o app e após cada registro.
- Tela de preferências (ligar/desligar, horário do lembrete) e pedido de permissão explicado.
- **Expo Push (complemento):** campanhas e avisos do servidor. Exige development build, porque o Expo Go não recebe push remoto no Android.
- Requisitos: RF007 (alerta diário único consolidado). Decisão D24.
- **Backend novo (só para o push):** `POST/DELETE /devices` (token Expo do aparelho) e disparo pelo Expo Push Service, no lugar do FCM previsto no `agent.md` do backend.

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

---

## Resumo de endpoints

| Função | Situação |
| :--- | :--- |
| Login, refresh, recuperação de senha, perfil e troca de senha | Pronto |
| Cadastro de cidadão e de profissional (`POST /users`) | Pronto |
| Caderneta do titular (`GET /citizens/:id/vaccination-records`) | Pronto |
| UBS próximas (`GET /ubs` com coordenadas) e catálogo de vacinas | Pronto |
| Ala profissional: busca, confirmação, busca ativa e indicadores | Pronto |
| Alertas locais | Pronto (usa a caderneta) |
| Logout (`POST /auth/logout`) | Pronto |
| Registro manual de vacina (`POST/PUT/DELETE /vaccination-records`) | **Novo** |
| Dependentes (CRUD, caderneta, confirmação, busca) | **Novo** |
| OCR (serviço Python + `POST /vaccination-records/ocr`) | **Novo** |
| Push (`/devices` + Expo Push) | **Novo** (complemento) |
