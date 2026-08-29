# MOSAICO — A manhã do Carro-Forte

Versão jogável do caso de dedução distribuída. A entrada da Mesa está em
`index.html`; estilos e lógica ficam em `styles.css` e `game.js`.

O jogo inclui perspectivas individuais, Fragmentos, validação cruzada,
investigação, hipótese, Mercado de Pistas, Mosaico coletivo, dedução final,
revelação e placar fechado em 100 pontos.

## Fragmentos em Dupla

O módulo `fragmentos-em-dupla.html` implementa a nova proposta multitelas da
Fase 1. Cada aparelho recebe somente metade de um registro e precisa localizar
a custódia complementar. O pareamento correto revela uma evidência utilizável,
mas nunca fecha sozinho autoria, cúmplice, motivo e ação.

Foram implementadas seis remessas:

1. Recibo + rua;
2. Erro 17 + câmera 3;
3. Chaveiro 17-B + porta reparada;
4. Rádio + corredor vazio;
5. Etiqueta + posição do malote;
6. Pasta azul + padaria.

O módulo aceita `?players=2..8&player=0..7`, alterna as duplas entre remessas,
registra conclusões em `localStorage` e emite `MOSAICO_FRAGMENTOS_DONE` via
`postMessage` ao concluir. Isso permite integração com a Sala sem tornar uma
metade ponto único de falha.

```
carro-forte/tiles/
  relogio.jpg
  o-banco.jpg
  o-carro-forte.jpg
  o-malote.jpg
  a-zona-cega.jpg
```

As imagens internas do jogo ficam em `carro-forte/assets/`. Não misturar esta
versão com `solo/` (Casa da Costa) nem com a noite (`v2/`).
