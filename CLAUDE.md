# VACINEI!? - Front-end

**Idioma:** responder sempre em português do Brasil.

Repositório das aplicações front-end da plataforma **VACINEI!?** (TCC CESMAC), que consomem a API Express do backend (porta `3333`).

- **`web/`**: Gerenciador Web para `PROFISSIONAL_SAUDE` e `ADMIN`. Stack: Vite + React 19 + TypeScript, React Router DOM v7, Tailwind CSS v4, Axios e Lucide React. Comandos (em `web/`): `npm run dev`, `npm run build`, `npm run lint` (oxlint).
- **`mobile/`**: Aplicativo para cidadãos e profissionais (login único com as alas Cidadão e Profissional). Stack: Expo (testado no Expo Go) + React Native + TypeScript, Expo Router, Axios, `expo-secure-store` (tokens) e tema com os tokens do `docs/DESIGN.md`. A URL da API vem de `EXPO_PUBLIC_API_URL` em `mobile/.env` (IP do computador na rede). Comandos (em `mobile/`): `npm run start`, `npm run lint`, `npm run typecheck`; bibliotecas com `npx expo install`. Roteiro e status em `docs/PLANO-MOBILE.md`.

Documentos compartilhados em `docs/`: `API.md` (contrato), `DECISOES.md` (regras), `DESIGN.md` (identidade visual), `PLANO-WEB.md` e `PLANO-MOBILE.md` (roteiros).

## Regras do Web

Diretrizes completas e status atual (consultar no início de cada sessão; atualizar `memory.md` ao concluir módulos ou tomar decisões de arquitetura):

- @web/agent.md
- @web/memory.md

Resumo: TypeScript estrito sem `any`; chamadas HTTP isoladas em `web/src/services/` usando o cliente `api.ts`; componentes de UI reutilizáveis em `web/src/components/ui/`; textos e mensagens em pt-BR.

## Regras do Mobile

- **Design de referência:** antes de implementar ou alterar telas do app, abrir as imagens da etapa em `docs/design-mobile/` (usar o `README.md` da pasta para escolher os arquivos; a pasta de cada etapa está no `docs/PLANO-MOBILE.md`) e segui-las como referência visual de layout, componentes e textos, com as adaptações já decididas: nome "Vacinei!?", só os dados que a API oferece e as decisões do `docs/DECISOES.md`.
- Abrir **somente** as imagens da tela em que estiver trabalhando, nunca as de outras etapas (economia de tokens).
- Ao final, listar as diferenças intencionais em relação ao design.

## Git

- Trabalhar sempre na branch `dev`. **Nunca** commitar ou fazer push na `main`.
- Commits via skill `git_commit` (`.claude/skills/git_commit`): Conventional Commits em pt-BR (`feat`, `fix`, `docs`, `style`, `refactor`).
- `git add` apenas dos arquivos alterados, nomeados explicitamente (nunca `git add .`).
- Push em `origin dev`. PR `dev` → `main` somente quando o usuário pedir.

## Arquivos que não devem ser lidos

Nunca ler `node_modules/`, `dist/`, `package-lock.json` ou `.env` (e variantes `.env.*`).
