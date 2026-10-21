# Vacinei!? - App Mobile

Aplicativo da plataforma **Vacinei!?** para cidadãos e profissionais de saúde (Expo + React Native + TypeScript). Roteiro em [`docs/PLANO-MOBILE.md`](../docs/PLANO-MOBILE.md).

## Como rodar

1. Instale as dependências: `npm install`.
2. Copie `.env.example` para `.env` e coloque em `EXPO_PUBLIC_API_URL` o IP do computador na rede (no Windows, "Endereço IPv4" do `ipconfig`). O backend precisa escutar em `0.0.0.0` na porta `3333`, e o celular precisa estar no mesmo Wi-Fi.
3. Inicie: `npm run start` e leia o QR code com o Expo Go (Android) ou com a câmera (iOS).

Depois de alterar o `.env`, reinicie com `npx expo start -c` (as variáveis `EXPO_PUBLIC_*` entram no bundle).

## Scripts

- `npm run start`: servidor do Expo.
- `npm run lint`: ESLint (`eslint-config-expo`).
- `npm run typecheck`: `tsc --noEmit`.

Para instalar bibliotecas, use `npx expo install <pacote>` (escolhe a versão compatível com o SDK).

## Estrutura

- `src/app/`: rotas do Expo Router, com os grupos `(auth)`, `(cidadao)` e `(profissional)`.
- `src/services/`: cliente Axios (`api.ts`), sessão no SecureStore (`tokenStorage.ts`) e chamadas à API.
- `src/theme/`: tokens do `docs/DESIGN.md` e a fonte Inter.
- `src/types/` e `src/utils/`: tipos e funções puras portados do web.
