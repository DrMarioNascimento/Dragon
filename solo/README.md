# MOSAICO — modo solo

Pasta **única**. Não misturar com a mesa (`v1/`) nem com a noite (`v2/` / `mosaico-web/`).

O jogo é [`index.html`](./index.html). Não precisa de build.

Cada pista nasce partida em quatro fragmentos. Só entra no mosaico inteira.
As opções da dedução saem embaralhadas com semente da partida — recarregar
mantém a ordem; «Outra partida» muda.

**Caso:** A Casa da Costa

```
solo/
  index.html     o jogo (GitHub Pages)
  tiles/         as cinco cartas e os recortes 2×2
  src/           rascunho React — não é o que o Pages serve
```

A espinha da noite (`mosaico-web/src/lib/mosaico/v3.ts`) **não** é este modo.

**Jogar:** [drmarionascimento.github.io/Dragon/solo/](https://drmarionascimento.github.io/Dragon/solo/)
