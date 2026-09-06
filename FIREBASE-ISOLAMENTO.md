# Isolamento Firebase por caso

| Caso | Projeto | Não misturar com |
|---|---|---|
| A Casa da Costa | `mosaico-game` | salas do Carro-Forte |
| A Manhã do Carro-Forte | `mosaico-noite` | salas da Casa da Costa |

Dentro do mesmo projeto, coleções diferentes (`mosaico/` vs `noite/`) separam o Celular canônico do fluxo de fechamento/alternativo.

O padrão antigo “toda Mesa em mosaico-game / toda Noite em mosaico-noite” foi substituído por este mapeamento 1:1 caso→projeto.
