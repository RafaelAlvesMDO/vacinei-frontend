# VACINEI!? — Plano do App Mobile

Roteiro das etapas do aplicativo (`mobile/`). O contrato da API está em [`API.md`](./API.md), as regras em [`DECISOES.md`](./DECISOES.md) e a identidade visual em [`DESIGN.md`](./DESIGN.md).

Legenda: `[x]` concluída · `[ ]` pendente · **Backend novo:** endpoint que ainda não existe na API.

---

## Base técnica

- **Expo (SDK mais recente suportado pelo Expo Go) + React Native + TypeScript estrito** (sem `any`). Testes no celular pelo Expo Go.
- **Navegação:** Expo Router (rotas por arquivo em `src/app/`), com grupos `(auth)`, `(cidadao)` e `(profissional)` e abas inferiores em cada ala.
- **HTTP:** Axios em `src/services/api.ts`, no mesmo padrão do web: Bearer token, renovação única no `401` via `POST /auth/refresh`, opção `skipAuthRefresh` e `parseApiError` (erros por campo do Zod). Chamadas isoladas em `src/services/`.
- **Sessão:** `expo-secure-store` para o access token, o refresh token e o usuário mínimo (`id`, `name`, `email`, `role`, `professionalRegistry`; sem CPF, como no web). Sem "Lembrar de mim": o app mantém a sessão até sair ou expirar.
- **URL da API:** `EXPO_PUBLIC_API_URL` em `mobile/.env` (ex.: `http://192.168.0.10:3333`, IP do computador na rede local), com `mobile/.env.example` versionado. O backend precisa escutar em `0.0.0.0`.
- **Tema:** `src/theme/` com os tokens do `DESIGN.md` (`colors`, `spacing`, `radius`, `typography`) e a fonte Inter (`@expo-google-fonts/inter`). Estilos com `StyleSheet` lendo o tema; nada de cores soltas.
- **Componentes:** `src/components/ui/` (Button, TextField, PasswordField, Card, Badge, Banner, EmptyState, Screen) com acessibilidade nativa (`accessibilityLabel`, `accessibilityRole`, alvos de toque de 48 px).
- **Reaproveitamento do web:** portar as funções puras de `web/src/utils/` (`password`, `cpf`, `name`, `format`, `councils`) e os tipos de `web/src/types/`.
- **Bibliotecas por etapa:** `react-native-maps` + `expo-location` (mapa), `expo-image-picker`/`expo-camera` (OCR), `expo-notifications` (alertas).

---

## [x] Etapa 1: Base do app

- [x] Projeto Expo SDK 58 em `mobile/` (TypeScript estrito), Expo Router, ESLint (`eslint-config-expo`, `no-explicit-any` como erro) e scripts (`npm run start`, `npm run lint`, `npm run typecheck`).
- [x] `src/services/api.ts` (Bearer, renovação única no `401`, `skipAuthRefresh`, `renewSession`, `onSessionExpired`), `tokenStorage.ts` e `auth.ts` (`authenticate`, `getProfile`, `signOut`, `parseApiError`).
  - O SecureStore é assíncrono: `tokenStorage` mantém uma cópia da sessão em memória, preenchida por `loadSession()` no layout raiz antes de esconder o splash, e grava no aparelho a cada alteração. Só o usuário mínimo (`StoredUser`) é gravado.
- [x] Tema em `src/theme/` (`colors`, `spacing`, `radius`, `touchTarget`, `typography`, `fonts`) e Inter 400/500/600/700. Cada peso é uma família (`fonts.semibold` etc.), porque no React Native o `fontWeight` não troca o arquivo da fonte.
- [x] Ícone, ícone adaptativo do Android, splash e favicon gerados do `icone-vacinei.svg`. O fundo do splash e do ícone adaptativo usa `#087F6B`, a cor do SVG oficial, para emendar com o logo.
- [x] Utils portados do web: `password`, `cpf`, `name`, `councils` e `format` (com `formatDateInput`/`parseDateInput` novos para a data de nascimento).
- [x] `EXPO_PUBLIC_API_URL` em `mobile/.env` (ignorado pelo `.gitignore` da raiz) e `.env.example`. A tela inicial provisória chama `GET /health` e mostra se a API respondeu.
- [x] Telas provisórias: `(auth)/index` (`/`), `(cidadao)/inicio` (`/inicio`) e `(profissional)/painel` (`/painel`), com `components/ProvisionalScreen`.
- Movidos para a etapa 2: `AuthContext` + `useAuth` e os componentes de UI base.
- Requisitos: RNF03 (feedback), RNF04 (acessibilidade), RNF10 (LGPD: dados mínimos no aparelho).
- **Backend:** nenhum. Conferir CORS/escuta em `0.0.0.0` para acesso pela rede.

## [ ] Etapa 2: Login, cadastro e recuperação de senha

- **Base (vinda da etapa 1):** `AuthContext` + `useAuth` (`signIn`, `signOut`, `refreshProfile`, restauração via `GET /auth/me`) e componentes de UI em `src/components/ui/` (Button, TextField, PasswordField, Card, Badge, Banner, EmptyState, Screen), substituindo o `ProvisionalScreen`.
- **Login único** (RF002, D23) por e-mail e senha, com mensagens do D17 (`401` genérico, `403` conta desativada).
  - `CIDADAO` → direto para a ala Cidadão.
  - `PROFISSIONAL_SAUDE` → escolhe entre a ala Cidadão e a ala Profissional, cada uma com sua barra de abas. O app lembra a última ala e permite alternar pelo Perfil. O não verificado vê o aviso de verificação na ala Profissional.
  - `ADMIN` → não usa o app, com aviso para usar o Gerenciador Web.
  - As alas são só navegação: as permissões continuam no backend.
- **Cadastro** (RF001, D14) de cidadão por `POST /users` (`role: "CIDADAO"`): nome completo, e-mail, celular, CPF, nascimento, senha com checklist. Opção "Sou profissional de saúde" com categoria, registro e UF (D12, D13), que nasce pendente (RS001).
- **Recuperação de senha** (RF011, RS007, D04): `POST /auth/forgot-password` e `POST /auth/reset-password`, com reenvio, `429` e retorno ao login.
- Perfil (RF003, D19): ver dados, editar o nome (`PATCH /auth/me`), trocar a senha (`PATCH /auth/me/password`) e política de privacidade.
- Encerramento por inatividade (RNF11) ao voltar do segundo plano (`AppState`).
- **Backend novo:** `POST /auth/logout` para revogar o refresh token ao sair (pendência já registrada no web).

## [ ] Etapa 3: Caderneta digital

- Tela inicial do cidadão: resumo (`emDia`, `atrasadas`, `completas`) e lista de vacinas por status (atrasadas primeiro), via `GET /citizens/:id/vaccination-records` com o próprio id.
- Detalhe da vacina: doses aplicadas/total, próxima dose e data, registros com badge "Confirmado" ou "Aguardando confirmação" (D06), lote, UBS e profissional.
- Puxar para atualizar, estados de carregando, vazio e erro.
- Requisitos: RF006, RS004.
- **Backend:** nenhum.

## [ ] Etapa 4: Mapa de UBS

- Mapa (`react-native-maps`) e lista das UBS próximas: `GET /ubs?latitude=&longitude=&radiusKm=` (ordenado por `distanceKm`), com a localização do aparelho (`expo-location`). Sem permissão, busca por nome/bairro (`?search=`) centrada em Maceió.
- Detalhe: endereço, horário (faixas em linhas), telefone (ligar) e "Como chegar" (abre o app de mapas).
- Requisitos: RF008, RNF09 (localização), RNF15. LGPD: a localização fica só no aparelho e não é salva.
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
- Requisitos: RF004, RS003, RNF05, RNF09 (câmera), RNF12. LGPD: a imagem não fica salva depois do processamento.
- **Backend novo:** microsserviço em Python (D25) (OpenCV no pré-processamento + `pytesseract`) chamado pelo backend. Rotas `POST /vaccination-records/ocr` (multipart, devolve sugestões, sem gravar) e gravação em lote (`POST /vaccination-records` com `origin: OCR_ICR`).

## [ ] Etapa 9: Alertas de vacinação

- **Notificações locais** (`expo-notifications`), sem custo e sem backend: a partir da caderneta (`nextDoseDate` de cada vacina, do titular e dos dependentes), agendar no aparelho um lembrete diário consolidado das doses pendentes e um aviso na data prevista. Reagendar ao abrir o app e após cada registro.
- Tela de preferências (ligar/desligar, horário do lembrete) e pedido de permissão explicado.
- **Expo Push (complemento):** campanhas e avisos do servidor. Exige development build, porque o Expo Go não recebe push remoto no Android.
- Requisitos: RF007 (alerta diário único consolidado). Decisão D24.
- **Backend novo (só para o push):** `POST/DELETE /devices` (token Expo do aparelho) e disparo pelo Expo Push Service, no lugar do FCM previsto no `agent.md` do backend.

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
| Logout (`POST /auth/logout`) | **Novo** |
| Registro manual de vacina (`POST/PUT/DELETE /vaccination-records`) | **Novo** |
| Dependentes (CRUD, caderneta, confirmação, busca) | **Novo** |
| OCR (serviço Python + `POST /vaccination-records/ocr`) | **Novo** |
| Push (`/devices` + Expo Push) | **Novo** (complemento) |
