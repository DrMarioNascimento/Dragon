# Contatos — O Impostor

Bonecos anônimos de capuz usados como foto de contato no grupo (Privadas e Suspeitos).
O número é o final do telefone; a cor identifica a pessoa sem revelar o papel.

| Número | Arquivo | Cor no jogo |
|--------|---------|-------------|
| 08 | `08.svg` | azul céu `#7fd4ff` |
| 19 | `19.svg` | rosa `#f0a8d0` |
| 23 | `23.svg` | verde `#70d6a0` (você, no protótipo) |
| 31 | `31.svg` | amarelo `#e6c36a` |
| 47 | `47.svg` | roxo `#b9a6ff` |
| 62 | `62.svg` | laranja `#ff9f7a` |
| 74 | `74.svg` | ciano `#8fe0d4` |
| extra | `extra.svg` | vermelho — fora do grupo de sete |

Na `mesa.html`, no lugar do SVG cinza:

```js
function avatarDe(f){
  return '<img src="icones/contatos/'+f+'.svg" alt="">';
}
```

Usar `avatarDe(f)` em Privadas, no cabeçalho da conversa e em Suspeitos.
