# Organização dos jogos Dragon Games

Decidida em 14/10/2026, pensando no crescimento (10+ jogos).

## Regra: um jogo = um repositório = um subdomínio

| Endereço | Repositório | Conteúdo |
|---|---|---|
| `dragongames.dev.br` | Dragon | Só a vitrine: catálogo, marca, sobre. |
| `<repositorio>.dragongames.dev.br` | o repositório do jogo | Raiz = página de escolha da versão; cada versão em sua pasta. |
| `dragongames.dev.br/<repositorio>/` | Dragon (atalho) | Página mínima que redireciona ao subdomínio do jogo, mantendo `?sala=`. |

- O nome do subdomínio é o nome do repositório, em minúsculas e com hífen (`mosaico-card`, `casa-da-costa`, `carro-forte`, `eco-do-amanha`).
- No catálogo do Dragon, cada cartão tem botões diretos para as versões e um link para a página do jogo (duas entradas).
- Código comum (ex.: `firebase-room.js`): cada jogo leva a sua cópia, com a versão anotada.
- Todos os jogos usam o mesmo projeto Firebase; cada um em sua coleção.

## Situação

| Jogo | Endereço | Situação |
|---|---|---|
| Mosaico Card | `mosaico-card.dragongames.dev.br` (`/novo-testamento/`, `/filmes-e-series/`) | No padrão (14/10/2026). Atalho: `/mosaico-card/`. |
| Eita! | `eita.dragongames.dev.br` | Firebase Hosting. Atalho: `/eita/`. |
| A Casa da Costa | `historias/casa-da-costa/…` (Dragon) | A migrar para `casa-da-costa.dragongames.dev.br`. |
| A Manhã do Carro-Forte | `historias/a-manha-do-carro-forte/…` (Dragon) | A migrar para `carro-forte.dragongames.dev.br`. |
| O Eco do Amanhã | `historias/o-eco-do-amanha/…` (Dragon) | A migrar para `eco-do-amanha.dragongames.dev.br`. |

## Passo a passo para um jogo novo

1. Criar a pasta do jogo e publicar como repositório no GitHub Desktop ("Publish repository", público).
2. Registro.br → Configurar zona DNS → Nova entrada: CNAME `<repositorio>` → `drmarionascimento.github.io`.
3. GitHub → repositório → Settings → Pages: Custom domain `<repositorio>.dragongames.dev.br`; depois marcar Enforce HTTPS.
4. Fetch/Pull no GitHub Desktop (o GitHub cria o arquivo `CNAME`).
5. No Dragon: cartão novo no `index.html` e pasta-atalho `/<repositorio>/index.html`.
