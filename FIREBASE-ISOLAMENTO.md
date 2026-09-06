# Isolamento Firebase por caso

| Caso | Projeto | Não misturar com |
|---|---|---|
| A Casa da Costa | `mosaico-game` | salas do Carro-Forte |
| A Manhã do Carro-Forte | `mosaico-noite` | salas da Casa da Costa |

Dentro do mesmo projeto, coleções diferentes (`mosaico/` vs `noite/`) separam o Celular canônico do fluxo de fechamento/alternativo.

O padrão antigo “toda Mesa em mosaico-game / toda Noite em mosaico-noite” foi substituído por este mapeamento 1:1 caso→projeto.

## Publicar regras nos dois projetos

`firestore.rules` é compartilhado no repositório, mas cada projeto Firebase tem
a própria cópia publicada. Depois de alterar as regras:

```bash
firebase deploy --only firestore:rules -P mesa
firebase deploy --only firestore:rules -P noite
```

`mesa` → `mosaico-game` (Casa da Costa: Celular, Telão, Solo Casa, fluxo v2).
`noite` → `mosaico-noite` (Carro-Forte: Celular / Manhã e fechamento / A Noite).
Publicar só no `default` atualiza apenas a Casa (`mosaico-game`).

Raízes canônicas de sala: `mosaico/` e `noite/`. Os nomes `carroforte` /
`carroforte-noite` existem só como aliases legados em `firestore.rules` —
nenhum cliente atual cria salas sob esses nomes.

## Gate compartilhado

O lobby multiplayer (Abrir / Entrar) vive em `firebase-room.js` para Casa e Carro-Forte. Ensaiar é a porta Solo do hub; Telão é `telao.html`. O que muda por caso é só o `data-project` / `data-root` / `data-case`:

| Superfície | data-project | data-root | Projeto |
|---|---|---|---|
| Casa Celular | `mesa` | `mosaico` | `mosaico-game` |
| Carro Celular | `noite` | `mosaico` | `mosaico-noite` |
| Carro Noite | `noite` | `noite` | `mosaico-noite` |

A Casa mantém `MosaicoFB` para as fases do caso, reutilizando a app Auth/Firestore `dragon-mesa` criada pelo gate.

