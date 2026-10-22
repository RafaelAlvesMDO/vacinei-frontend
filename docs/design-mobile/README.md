# Design do app mobile

Telas de referência do aplicativo **Vacinei!?** (`mobile/`), organizadas por fluxo. A identidade visual oficial está em `docs/DESIGN.md` e o roteiro em `docs/PLANO-MOBILE.md`.

> **Avisos**
>
> - O nome **"Jornada da Saúde"** que aparece nas imagens está desatualizado. O nome correto do app é **Vacinei!?**.
> - A tela de **login profissional separado** (`auth/login-profissional.png`) foi **descartada (D23)**: o app tem um login único, com as alas Cidadão e Profissional.

## Regra de uso

Os designs são **referência visual**: o app só exibe dados que a API oferece. Itens dos designs sem suporte no backend ou fora do levantamento de requisitos ficam de fora por enquanto. Exemplos: "contatados hoje" e "prioridade crítica" na busca ativa; "tempo médio" e "doses descartadas" no dashboard. Esses itens estão listados em "Possíveis melhorias futuras (vindas dos designs)" no `docs/PLANO-MOBILE.md`.

## Resumo

| Pasta | Arquivos |
| --- | --- |
| `auth/` | 14 |
| `cidadao/` | 9 |
| `profissional/` | 11 |
| `dependentes/` | 6 |
| `ocr/` | 6 |
| `ubs/` | 6 |
| `perfil/` | 8 |
| **Total** | **60** |

## Índice

### auth

| Arquivo | Nome original | Observações |
| --- | --- | --- |
| `auth/splash.png` | APP-1.png | |
| `auth/onboarding-acompanhe.png` | Onboarding — Acompanhe.png | |
| `auth/onboarding-digitalize.png` | Onboarding — Digitalize.png | ⚠️ Versões da mesma tela: `onboarding-digitalize-1.png` |
| `auth/onboarding-digitalize-1.png` | Onboarding — Digitalize-1.png | ⚠️ Versão de `onboarding-digitalize.png` |
| `auth/onboarding-receba-alertas.png` | Onboarding — Receba alertas.png | |
| `auth/login.png` | Login.png | |
| `auth/login-credenciais-invalidas.png` | Login — Credenciais inválidas.png | Estado de erro do login |
| `auth/login-profissional.png` | Login profissional .png | ❌ Descartada (D23): login único |
| `auth/bloqueio-tentativas-incorretas.png` | Bloqueio por tentativas incorretas.png | |
| `auth/cadastro-etapa-1-dados-e-perfil.png` | Cadastro — Etapa 1_ dados e perfil.png | |
| `auth/cadastro-etapa-2-dados-profissionais.png` | Cadastro — Etapa 2_ dados profissionais.png | |
| `auth/esqueci-minha-senha-etapa-1-canal.png` | Esqueci minha senha — Etapa 1_ canal.png | |
| `auth/esqueci-minha-senha-etapa-2-codigo.png` | Esqueci minha senha — Etapa 2_ código.png | |
| `auth/redefinir-senha-etapa-3.png` | Redefinir senha — Etapa 3.png | Etapa 3 do fluxo "Esqueci minha senha" |

### cidadao

| Arquivo | Nome original | Observações |
| --- | --- | --- |
| `cidadao/inicio-caderneta-de-vacinacao.png` | Início — Caderneta de vacinação.png | ⚠️ Parecida com `caderneta-do-cidadao.png` |
| `cidadao/caderneta-do-cidadao.png` | Caderneta do cidadão.png | ⚠️ Parecida com `inicio-caderneta-de-vacinacao.png` |
| `cidadao/detalhe-da-vacina.png` | Detalhe da vacina.png | ⚠️ Parecida com `resumo-da-vacina.png` |
| `cidadao/resumo-da-vacina.png` | Resumo da vacina.png | ⚠️ Parecida com `detalhe-da-vacina.png` |
| `cidadao/cadastrar-ou-editar-vacina.png` | Cadastrar ou editar vacina.png | Cadastro manual de vacina |
| `cidadao/registro-salvo.png` | Registro salvo.png | Sucesso do cadastro manual |
| `cidadao/central-de-notificacoes-rf007.png` | Central de notificações — RF007.png | |
| `cidadao/minhas-cadernetas-preenchida.png` | Minhas Cadernetas — preenchida.png | Estados da mesma tela: `minhas-cadernetas-vazia.png` |
| `cidadao/minhas-cadernetas-vazia.png` | Minhas Cadernetas — vazia.png | Estado vazio de `minhas-cadernetas-preenchida.png` |

### profissional

| Arquivo | Nome original | Observações |
| --- | --- | --- |
| `profissional/dashboard.png` | Vacinação .png | "Tempo médio" e "doses descartadas" ficam de fora (ver Regra de uso) |
| `profissional/acesso-restrito.png` | Acesso restrito.png | |
| `profissional/busca-ativa.png` | Atrasados.png | "Contatados hoje" e "prioridade crítica" ficam de fora (ver Regra de uso) |
| `profissional/registrar-vacinacao-etapa-1-buscar-cidadao.png` | Registrar Vacinação — Etapa 1_ buscar cidadão.png | |
| `profissional/registrar-vacinacao-nenhum-cidadao-encontrado.png` | Registrar Vacinação — Nenhum cidadão encontrado.png | Estado vazio da etapa 1 |
| `profissional/registrar-vacinacao-etapa-2-formulario.png` | Registrar Vacinação — Etapa 2_ formulário.png | |
| `profissional/registrar-vacinacao-etapa-3-revisao.png` | Registrar Vacinação — Etapa 3_ revisão.png | |
| `profissional/vacinacao-confirmada.png` | Vacinação confirmada .png | Sucesso do "Registrar Vacinação" |
| `profissional/registro-profissional-em-analise.png` | Registro profissional — Em análise.png | Estados do registro: em análise, aprovado e recusado |
| `profissional/registro-profissional-aprovado.png` | Registro profissional — Aprovado.png | |
| `profissional/registro-profissional-recusado.png` | Registro profissional — Recusado.png | |

### dependentes

| Arquivo | Nome original | Observações |
| --- | --- | --- |
| `dependentes/dependentes-lista.png` | Dependentes — Lista.png | Estados da mesma tela: `dependentes-vazio.png` |
| `dependentes/dependentes-vazio.png` | Dependentes — Vazio.png | Estado vazio de `dependentes-lista.png` |
| `dependentes/cadastrar-dependente.png` | Cadastrar dependente.png | |
| `dependentes/dependente-duplicado.png` | Dependente duplicado.png | Erro do cadastro |
| `dependentes/perfil-do-dependente.png` | Perfil do dependente.png | |
| `dependentes/remover-dependente.png` | Remover dependente.png | |

### ocr

| Arquivo | Nome original | Observações |
| --- | --- | --- |
| `ocr/digitalizar-etapa-1-de-4.png` | Digitalizar — Etapa 1 de 4.png | |
| `ocr/digitalizar-etapa-2-de-4-captura.png` | Digitalizar — Etapa 2 de 4 — Captura.png | Duas variações da etapa 2: captura e pré-visualização |
| `ocr/digitalizar-etapa-2-de-4-pre-visualizacao.png` | Digitalizar — Etapa 2 de 4 — Pré-visualização.png | |
| `ocr/digitalizar-etapa-3-de-4.png` | Digitalizar — Etapa 3 de 4.png | |
| `ocr/digitalizar-etapa-4-de-4.png` | Digitalizar — Etapa 4 de 4.png | |
| `ocr/erro-no-reconhecimento.png` | Erro no reconhecimento.png | |

### ubs

| Arquivo | Nome original | Observações |
| --- | --- | --- |
| `ubs/ubs-proximas-lista.png` | UBS próximas — Lista.png | Visões da mesma tela: lista e mapa |
| `ubs/ubs-proximas-mapa.png` | UBS próximas — Mapa.png | |
| `ubs/detalhe-da-ubs.png` | Detalhe da UBS.png | |
| `ubs/ubs-permissao-de-localizacao.png` | UBS — Permissão de localização.png | |
| `ubs/ubs-localizacao-desativada.png` | UBS — Localização desativada.png | |
| `ubs/ubs-mapa-indisponivel.png` | UBS — Mapa indisponível.png | |

### perfil

| Arquivo | Nome original | Observações |
| --- | --- | --- |
| `perfil/perfil.png` | Perfil.png | ⚠️ Parecida com `perfil-cidadao.png` e `perfil-profissional.png` |
| `perfil/perfil-cidadao.png` | Perfil — Cidadão.png | |
| `perfil/perfil-profissional.png` | Perfil — Profissional.png | |
| `perfil/verificacao-de-identidade.png` | Verificação de identidade.png | |
| `perfil/privacidade-e-meus-dados.png` | Privacidade e meus dados.png | |
| `perfil/sobre.png` | info-1.png | |
| `perfil/excluir-conta-etapa-1.png` | Excluir conta — Etapa 1.png | |
| `perfil/excluir-conta-etapa-2.png` | Excluir conta — Etapa 2.png | |
