# Identidade Visual - Vacinei!?

Referência única de identidade visual para o Gerenciador Web e o aplicativo mobile.

## Nome

- **Vacinei!?** (sempre com `!?`). O nome "Jornada da Saúde", que aparece em versões antigas dos protótipos, está desatualizado.
- Título da aba no web: `Vacinei!? | Gerenciador Web`.

## Cores

| Token          | Hex       | Uso                                                        |
| :------------- | :-------- | :--------------------------------------------------------- |
| `primary`      | `#077A66` | Botões principais, links, ícones de destaque, foco         |
| `primary-dark` | `#103B34` | Títulos, hover/active do botão primário                    |
| `accent`       | `#047A80` | Destaque turquesa (detalhes, gráficos, realces pontuais)   |
| `surface`      | `#E8F4F0` | Fundo de destaque: caixas de aviso, círculos de ícone      |
| `background`   | `#F6F8F7` | Fundo da página                                            |
| `muted`        | `#5F6F6B` | Texto secundário, placeholders e ícones de input           |
| `border`       | `#CFE0DA` | Borda de cards, divisórias e botões secundários            |
| `input`        | `#7F948D` | Contorno de campos de formulário (input, select, textarea) |
| `danger`       | `#B42318` | Erros (fundo suave `danger-soft` `#FEF3F2`)                |
| `warning`      | `#8F5B12` | Alertas (fundo suave `warning-soft` `#FDF5E6`)             |
| `success`      | `#077A66` | Sucesso (igual à primária; fundo suave `surface`)          |

Cards e inputs usam fundo branco (`#FFFFFF`).

### Contraste (WCAG 2.1 AA, RNF04)

Em outubro de 2026, `primary` (era `#087F6B`), `accent` (era `#03A1A9`) e `warning` (era `#B7791F`) foram escurecidos e o token `input` foi criado, para atender ao nível AA: **4,5:1** para texto e **3:1** para o contorno de componentes (critério 1.4.11).

| Par (texto ou elemento sobre fundo)             | Contraste            |
| :---------------------------------------------- | :------------------- |
| `primary-dark` sobre `background`               | 11,60:1              |
| `muted` sobre branco / `background` / `surface` | 5,29 / 4,96 / 4,69:1 |
| `primary` sobre branco / `surface`              | 5,27 / 4,68:1        |
| branco sobre `primary`                          | 5,27:1               |
| `accent` sobre branco                           | 5,12:1               |
| `warning` sobre `warning-soft` / branco         | 5,28 / 5,72:1        |
| `danger` sobre `danger-soft` / branco           | 6,05 / 6,57:1        |
| `primary-dark` sobre `accent/10` (badge)        | 10,81:1              |
| `input` (contorno) sobre branco                 | 3,22:1               |

Regras:

- Placeholders usam `muted` sem transparência (`muted/70` dava 2,9:1).
- Não aplicar `opacity` em texto: os contadores sobre o botão `primary` caíam para 3,96:1. O estado desabilitado é a exceção, porque a WCAG o dispensa.
- `border` (1,37:1 sobre branco) é decorativo e não pode ser o único contorno de um campo de formulário.
- Antes de usar um par novo de cores com texto, conferir o contraste: mínimo de 4,5:1, ou 3:1 para texto grande (24px, ou 18,66px em negrito).

## Tipografia

- Fonte **Inter** (pesos 400, 500, 600 e 700).
- Títulos em `primary-dark`, `font-bold`; labels em `font-semibold`; texto de apoio em `muted`.

## Logos

- `web/src/assets/logo-vacinei.svg`: logo completo (fundo branco), usado no login e na sidebar.
- `web/src/assets/icone-vacinei.svg`: ícone sobre fundo `primary`, usado como favicon e ícone do app.
- Não usar outros ícones (coração, seringa etc.) no lugar do logo.

## Componentes

- **Input:** fundo branco, borda `input`, cantos `rounded-xl`, altura ~48px, ícone à direita em `muted`; foco com borda e anel `primary`; erro com borda `danger` e mensagem abaixo.
- **Botão primário:** largura total, `rounded-xl`, fundo `primary`, texto branco `font-semibold`, hover `primary-dark`, ícone à esquerda do texto.
- **Botão secundário:** fundo branco, borda `border`, texto `primary-dark`.
- **Link:** texto `primary`, `font-semibold`.
- **Caixa de aviso:** fundo `surface`, cantos `rounded-xl`, ícone `primary` (ex.: escudo) e texto `muted`.
- **Ícone de destaque:** ícone `primary` dentro de um círculo `surface`.
