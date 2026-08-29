# mosaico-solo

Código-fonte do **modo solo** do MOSAICO.

Não é a mesa (`v1`). Não é a noite (`mosaico-web` → `v2`). Não é o arquivo `v3.ts` da noite.

O site estático publicado no Pages mora em [`../solo/`](../solo).

## Regra

Cada carta chega em quatro fragmentos. Toque dois para trocar. Só a carta inteira entra no mosaico coletivo.

## Arquivos deste protótipo

```
src/lib/game/case.ts      caso, peças, verdade
src/lib/game/store.ts     fases e mosaico
src/components/game/      UI da partida
public/tiles/             as cinco cartas e os recortes 2×2
```
