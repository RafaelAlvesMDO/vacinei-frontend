/// <reference types="vite/client" />

interface ImportMetaEnv {
  // URL da API (padrão: http://localhost:3333)
  readonly VITE_API_URL?: string;
  // Minutos sem uso até encerrar a sessão (RNF11, padrão: 30)
  readonly VITE_IDLE_TIMEOUT_MINUTES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
