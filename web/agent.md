# VACINEI!? - Diretrizes do Front-end Web (Agent Guide)

Guia de contexto, arquitetura, stack e regras de desenvolvimento do Gerenciador Web da plataforma **VACINEI!?** (TCC CESMAC).

---

## 0. Memória Contínua do Projeto (`memory.md`)

- **Consulta Obrigatória:** O agente **DEVE** consultar `memory.md` no início de cada sessão para alinhar status, histórico e prioridades.
- **Atualização Contínua:** O agente **DEVE** atualizar `memory.md` ao finalizar módulos, ajustar decisões arquiteturais ou atingir marcos (ex.: Pré-Banca).

---

## 1. Stack Tecnológica & Contexto

- **Build Tool & Framework:** Vite + React (v19) + TypeScript
- **Roteamento:** React Router DOM (v7)
- **Estilização:** Tailwind CSS (v4)
- **Requisições HTTP:** Axios (conectando à API Express na porta `3333`)
- **Ícones:** Lucide React
- **Perfil de Usuários (Web):** `PROFISSIONAL_SAUDE` e `ADMIN` (Cidadãos utilizam o aplicativo mobile).

---

## 2. Estrutura de Diretórios Sugerida (`src/`)

```
src/
├── assets/          # Imagens, logos e vetores estáticos
├── components/      # Componentes reutilizáveis agnósticos de regra de negócio
│   ├── ui/          # Botões, inputs, cards, modais, badges, tabelas, spinners
│   ├── layout/      # Sidebar, Header, Navbar, Footer, PageContainer
│   └── feedback/    # Toast, EmptyState, ConfirmDialog
├── contexts/        # Contextos globais React (ex.: AuthContext, ThemeContext)
├── hooks/           # Custom hooks reutilizáveis (useAuth, useDebounce, etc.)
├── layouts/         # Layouts de rotas (AppLayout com sidebar, AuthLayout para login)
├── pages/           # Telas da aplicação organizadas por domínio
│   ├── auth/        # Login, Esqueci Minha Senha
│   ├── dashboard/   # Visão geral, estatísticas e indicadores
│   ├── vaccines/    # Listagem, cadastro e detalhes do catálogo SUS
│   ├── ubs/         # Listagem e gestão de Unidades Básicas de Saúde
│   ├── records/     # Confirmação e registro de doses presenciais (RS006/RF010)
│   └── campaigns/   # Gestão de campanhas vacinais
├── routes/          # Definição e proteção de rotas (AppRoutes, ProtectedRoute)
├── services/        # Cliente Axios e chamadas à API organizadas por módulo
│   ├── api.ts       # Instância centralizada com baseURL e interceptors
│   ├── auth.ts      # Serviços de autenticação e perfil
│   ├── vaccines.ts  # Endpoints de vacinas e doses
│   └── ubs.ts       # Endpoints de UBSs e proximidade
├── types/           # Interfaces e tipos TypeScript compartilhados (DTOs, Models)
└── utils/           # Funções utilitárias (formatação de CPF, datas, máscaras)
```

---

## 3. Arquitetura de Componentes Reutilizáveis & Tailwind CSS

- **Componentes Atômicos e Reutilizáveis:**
  - Componentes de UI (`src/components/ui/`) devem ser desacoplados de regras de negócio, recebendo dados e callbacks via `props`.
  - Usar tipagem explícita com `interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement>`.
  - Variantes de estilo controladas por classes condicionais limpas.
- **Design System com Tailwind CSS:**
  - **Paleta de Cores de Saúde:** Primário em tons de azul/ciano (`sky`, `blue`, `cyan`) e verde/esmeralda (`emerald`, `teal`) para status e ações.
  - **Superfície e Contraste:** Fundos neutros (`slate-50` / `gray-50`) com cards em branco puro (`bg-white`), bordas suaves (`border-slate-200`) e sombras sutis (`shadow-sm`).
  - **Tipografia & Legibilidade:** Hierarquia visual clara com fontes sem serifa, peso `font-medium` ou `font-semibold` para cabeçalhos e labels.
  - **Acessibilidade & Estados:** Foco visível (`focus:ring-2 focus:ring-sky-500`), estados desabilitados (`disabled:opacity-50`) e feedback tátil em botões.
- **Ícones (Lucide React):**
  - Padronizar dimensões dos ícones: 16px (`size-4`) em botões pequenos, 20px (`size-5`) em menus e 24px (`size-6`) em cards de destaque.

---

## 4. Consumo de API via Axios (`src/services/api.ts`)

- **Instância Centralizada:**
  ```ts
  import axios from 'axios';
  export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
    timeout: 10000,
  });
  ```
- **Interceptor de Request:** Injeta automaticamente o Access Token JWT armazenado (`Authorization: Bearer <token>`).
- **Interceptor de Response & Tratamento de Erros:**
  - Intercepta erros `401 Unauthorized`.
  - Tentativa automática de renovação via `POST /auth/refresh` usando o refresh token persistido.
  - Em caso de falha irreversível de autenticação, limpa a sessão local e redireciona para a tela de login.
  - Extrai mensagens de erro amigáveis vindas da API (`error.response?.data?.message`).

---

## 5. Gerenciamento de Autenticação e Rotas Protegidas (JWT + RBAC)

- **Fluxo de Autenticação (`AuthContext`):**
  - Armazena usuário autenticado, papéis (`roles`), access token e refresh token.
  - Métodos expostos: `signIn(credentials)`, `signOut()`, `refreshProfile()`.
  - Na inicialização, valida sessão existente e restaura o perfil via `GET /auth/me`.
- **Restrição de Perfis (RBAC):**
  - Apenas usuários com perfil `PROFISSIONAL_SAUDE` ou `ADMIN` têm permissão de acesso ao gerenciador web.
  - Cidadãos comuns que tentarem login recebem aviso de acesso restrito ao app mobile.
- **Componente `ProtectedRoute`:**
  - Redireciona usuários não autenticados para `/login`.
  - Verifica propriedade `allowedRoles`. Se o usuário autenticado não possuir permissão, redireciona para `/unauthorized` ou dashboard padrão.
- **Divisão de Rotas:**
  - **Públicas:** `/login`, `/forgot-password`, `/reset-password`.
  - **Protegidas (Geral Web):** `/dashboard`, `/vaccines`, `/ubs`, `/records`.
  - **Restritas (`ADMIN`):** `/users`, `/reports/audit`.

---

## 6. Padrões de Código e Boas Práticas

- **TypeScript Estrito:** Proibido o uso de `any`. Sempre definir interfaces para retornos da API, formulários e props.
- **Separação de Preocupações (SoC):** Lógica assíncrona e chamadas Axios isoladas em `services/`, deixando páginas focadas em renderização e orquestração de estado.
- **Convenção de Commits:** Conventional Commits (`tipo(escopo): descrição concisa`) em português do Brasil (`feat`, `fix`, `docs`, `style`, `refactor`).
- **Performance:** Divisão de código com `React.lazy` e `Suspense` para carregamento sob demanda das páginas principais.
