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
  - Skill `git_commit` importada em `.agents/skills/git_commit`.
  - Diretrizes do front-end formalizadas em `agent.md` (arquitetura de componentes, Tailwind CSS, rotas protegidas JWT/RBAC e consumo de API).
  - Repositório Git sincronizado na branch `main` no GitHub (`https://github.com/RafaelAlvesMDO/vacinei-frontend.git`).
- **Data da Última Atualização:** 2026-10-07

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

---

## 3. Roteiro para Apresentação da Pré-Banca (Até 15/Outubro/2026)

- [x] **Inicialização do Projeto Web:** Scaffold Vite React TS, Tailwind CSS, Axios, Lucide React e React Router.
- [x] **Diretrizes e Memória do Agente:** Criação de `agent.md` e `memory.md` estabelecendo padrões de código e arquitetura.
- [ ] **Configuração do Cliente HTTP (`src/services/api.ts`):** Instância Axios com interceptors de autenticação e refresh token.
- [ ] **Módulo de Autenticação (`src/contexts/AuthContext.tsx` e tela `/login`):** Login com e-mail/senha, validação de papéis permitidos (`PROFISSIONAL_SAUDE` / `ADMIN`) e persistência segura de tokens.
- [ ] **Layout do Gerenciador Web (`AppLayout`):** Sidebar responsiva com rotas administrativas, header com perfil do profissional logado e botão de logout.
- [ ] **Dashboard Principal (`/dashboard`):** Cards com contagem de UBSs cadastradas, vacinas disponíveis no catálogo e atalhos rápidos.
- [ ] **Módulo de Vacinas (`/vaccines`):** Listagem com busca e filtros por público-alvo, detalhes da vacina e suas doses.
- [ ] **Módulo de Unidades Básicas de Saúde (`/ubs`):** Listagem das 36 UBSs de Maceió/AL cadastradas no backend, busca por nome/bairro e visualização de dados de contato/coordenadas.
- [ ] **Registro e Confirmação de Doses (`/records`):** Interface para profissionais de saúde confirmarem a aplicação presencial de doses (RS006/RF010).

---

## 4. Próximos Passos Imediatos

1. Criar a estrutura inicial de pastas (`src/components/`, `src/services/`, `src/contexts/`, `src/pages/`, `src/routes/`, `src/types/`).
2. Implementar `src/services/api.ts` com base URL apontando para `http://localhost:3333`.
3. Criar os tipos base de autenticação e usuário (`src/types/auth.ts`).
4. Desenvolver o `AuthContext` e a página de login integrada à rota `POST /auth/login` do backend.
