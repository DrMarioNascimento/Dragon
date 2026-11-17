# Organização dos jogos Dragon Games

Organização definida em 14/10/2026; disponibilidade revisada em 24/10/2026.

## Regra: um jogo = um repositório = um subdomínio

| Endereço | Repositório | Conteúdo |
|---|---|---|
| `dragongames.dev.br` | Dragon | Só a vitrine: catálogo, marca, sobre. |
| `<repositorio>.dragongames.dev.br` | o repositório do jogo | Raiz = página de escolha da versão; cada versão em sua pasta. |
| `dragongames.dev.br/<repositorio>/` | Dragon (atalho) | Página mínima que redireciona ao subdomínio do jogo, mantendo `?sala=`. |

- O nome do subdomínio é o nome do repositório, em minúsculas e com hífen (`mosaico-card`, `casa-da-costa`, `carro-forte`, `eco-do-amanha`).
- No catálogo do Dragon, cada cartão tem botões diretos para as versões e um link para a página do jogo (duas entradas).
- Código comum (ex.: `firebase-room.js`): cada jogo leva a sua cópia, com a versão anotada.
- Os projetos Firebase e as configurações de autenticação são próprios de cada jogo; consulte seu README. A separação de repositórios não implica unificação dos bancos.

## Acesso

Eita! está em testes abertos desde 20/10/2026: qualquer conta Google pode conduzir e participantes entram por código. Histórias MOSAICO e Mosaico Card continuam em testes fechados, com condução autorizada. A licença de cada projeto define as condições de uso. Consulte também o [catálogo de recursos públicos do autor](https://www.drmarionascimento.com.br/#acesso-publico).

## Situação

| Jogo | Endereço | Situação |
|---|---|---|
| Mosaico Card | `mosaico-card.dragongames.dev.br` (`/novo-testamento/`, `/filmes-e-series/`) | Testes fechados; conta de mestre autorizada para criar sala. Atalho: `/mosaico-card/`. |
| Eita! | `eita.dragongames.dev.br` | Testes abertos; Firebase Hosting. Atalho: `/eita/`. |
| A Casa da Costa | https://casa-da-costa.dragongames.dev.br/ | Repositório próprio `casa-da-costa`; testes internos. |
| A Manhã do Carro-Forte | https://carro-forte.dragongames.dev.br/ | Repositório próprio `carro-forte`; testes internos. |
| O Eco do Amanhã | https://eco-do-amanha.dragongames.dev.br/ | Repositório próprio `eco-do-amanha`; testes internos. |

## Passo a passo para um jogo novo

1. Criar a pasta do jogo e publicar como repositório no GitHub Desktop ("Publish repository", público).
2. Registro.br → Configurar zona DNS → Nova entrada: CNAME `<repositorio>` → `drmarionascimento.github.io`.
3. GitHub → repositório → Settings → Pages: Custom domain `<repositorio>.dragongames.dev.br`; depois marcar Enforce HTTPS.
4. Fetch/Pull no GitHub Desktop (o GitHub cria o arquivo `CNAME`).
5. No Dragon: cartão novo no `index.html` e pasta-atalho `/<repositorio>/index.html`.
