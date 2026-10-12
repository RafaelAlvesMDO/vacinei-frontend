# VACINEI!? - Front-end

**Idioma:** responder sempre em português do Brasil.

Repositório das aplicações front-end da plataforma **VACINEI!?** (TCC CESMAC), que consomem a API Express do backend (porta `3333`).

- **`web/`**: Gerenciador Web para `PROFISSIONAL_SAUDE` e `ADMIN`. Stack: Vite + React 19 + TypeScript, React Router DOM v7, Tailwind CSS v4, Axios e Lucide React. Comandos (em `web/`): `npm run dev`, `npm run build`, `npm run lint` (oxlint).
- **`mobile/`**: Aplicativo para cidadãos (ainda não iniciado).

## Regras do Web

Diretrizes completas e status atual (consultar no início de cada sessão; atualizar `memory.md` ao concluir módulos ou tomar decisões de arquitetura):

- @web/agent.md
- @web/memory.md

Resumo: TypeScript estrito sem `any`; chamadas HTTP isoladas em `web/src/services/` usando o cliente `api.ts`; componentes de UI reutilizáveis em `web/src/components/ui/`; textos e mensagens em pt-BR.

## Git

- Trabalhar sempre na branch `dev`. **Nunca** commitar ou fazer push na `main`.
- Commits via skill `git_commit` (`.claude/skills/git_commit`): Conventional Commits em pt-BR (`feat`, `fix`, `docs`, `style`, `refactor`).
- `git add` apenas dos arquivos alterados, nomeados explicitamente (nunca `git add .`).
- Push em `origin dev`. PR `dev` → `main` somente quando o usuário pedir.

## Arquivos que não devem ser lidos

Nunca ler `node_modules/`, `dist/`, `package-lock.json` ou `.env` (e variantes `.env.*`).
