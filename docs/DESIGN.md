# Identidade Visual - Vacinei!?

Referência única de identidade visual para o Gerenciador Web e o aplicativo mobile.

## Nome

- **Vacinei!?** (sempre com `!?`). O nome "Jornada da Saúde", que aparece em versões antigas dos protótipos, está desatualizado.
- Título da aba no web: `Vacinei!? | Gerenciador Web`.

## Cores

| Token          | Hex       | Uso                                                        |
| :------------- | :-------- | :--------------------------------------------------------- |
| `primary`      | `#087F6B` | Botões principais, links, ícones de destaque, foco         |
| `primary-dark` | `#103B34` | Títulos, hover/active do botão primário                    |
| `accent`       | `#03A1A9` | Destaque turquesa (detalhes, gráficos, realces pontuais)   |
| `surface`      | `#E8F4F0` | Fundo de destaque: caixas de aviso, círculos de ícone      |
| `background`   | `#F6F8F7` | Fundo da página                                            |
| `muted`        | `#5F6F6B` | Texto secundário, placeholders e ícones de input           |
| `border`       | `#CFE0DA` | Borda de inputs e cards                                    |
| `danger`       | `#B42318` | Erros (fundo suave `danger-soft` `#FEF3F2`)                |
| `warning`      | `#B7791F` | Alertas (fundo suave `warning-soft` `#FDF5E6`)             |
| `success`      | `#087F6B` | Sucesso (igual à primária; fundo suave `surface`)          |

Cards e inputs usam fundo branco (`#FFFFFF`).

## Tipografia

- Fonte **Inter** (pesos 400, 500, 600 e 700).
- Títulos em `primary-dark`, `font-bold`; labels em `font-semibold`; texto de apoio em `muted`.

## Logos

- `web/src/assets/logo-vacinei.svg`: logo completo (fundo branco), usado no login e na sidebar.
- `web/src/assets/icone-vacinei.svg`: ícone sobre fundo `primary`, usado como favicon e ícone do app.
- Não usar outros ícones (coração, seringa etc.) no lugar do logo.

## Componentes

- **Input:** fundo branco, borda `border`, cantos `rounded-xl`, altura ~48px, ícone à direita em `muted`; foco com borda e anel `primary`; erro com borda `danger` e mensagem abaixo.
- **Botão primário:** largura total, `rounded-xl`, fundo `primary`, texto branco `font-semibold`, hover `primary-dark`, ícone à esquerda do texto.
- **Botão secundário:** fundo branco, borda `border`, texto `primary-dark`.
- **Link:** texto `primary`, `font-semibold`.
- **Caixa de aviso:** fundo `surface`, cantos `rounded-xl`, ícone `primary` (ex.: escudo) e texto `muted`.
- **Ícone de destaque:** ícone `primary` dentro de um círculo `surface`.
