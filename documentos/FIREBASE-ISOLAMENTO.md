# Isolamento Firebase por caso

| Caso | Projeto | Não misturar com |
|---|---|---|
| A Casa da Costa | `mosaico-game` | salas do Carro-Forte |
| A Manhã do Carro-Forte | `mosaico-noite` | salas da Casa da Costa |
| O Impostor (A Casa da Costa: O Impostor) | `oimpostor-c30e0` | salas das outras mesas |
| A Manhã do Carro-Forte: O Impostor | `o-impostor-carro-forte` (desde 11/10/2026) | salas dos outros casos |
| O Eco do Amanhã: O Impostor (VestChip) | `vestchip` (desde 11/10/2026) | salas dos outros casos |

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

## O Impostor (03/10/2026)

Projeto próprio, `oimpostor-c30e0`. A mesa (`o-impostor/mesa.html?grupo=1`) carrega o
mesmo `firebase-room.js` com `data-project="impostor"`, `data-root="mosaico"`,
`data-case="o-impostor"`, `data-papel-camada="nao"` (sem papel cognitivo nem camada) e
`data-retomar="sim"` (quem já está na sala volta sem digitar o nome).

As regras são outras: `o-impostor/firestore-impostor.rules`. Publicar **colando no
console** (Firestore → Regras). Não usar `firebase deploy` com o `firebase.json` da
raiz, que publica o `firestore.rules` das outras mesas.

No console do projeto: Firestore (região `southamerica-east1`), Authentication com
Google e Anônimo, domínio autorizado `drmarionascimento.github.io`, e o documento
`config/mestres` com o campo `emails` (lista).

## A Manhã do Carro-Forte: O Impostor (06/10/2026)

Mesmo projeto e mesmas regras d'O Impostor (`oimpostor-c30e0`,
`o-impostor/firestore-impostor.rules`): o protocolo da sala é o mesmo (sorteio em
`oi`, capítulos em `cap {n, t0Ms}`, `jogadores.etapa/resumo`, `mensagens`). A mesa
(`carro-forte-impostor/mesa.html?grupo=1`) carrega `firebase-room.js` com
`data-project="impostor"`, `data-root="mosaico"`, `data-case="carro-forte-impostor"`,
`data-papel-camada="nao"` e `data-retomar="sim"`. As salas dos dois casos convivem na
coleção `mosaico/`; o `caseId` gravado na sala separa uma da outra (quem digita o
código de um caso na página do outro recebe "Esse código pertence a outro caso").
Nada a publicar no console: as regras atuais já cobrem este caso.

## O Eco do Amanhã: O Impostor (10/10/2026; projeto próprio desde 11/10/2026)

Projeto próprio, `vestchip`. A mesa (`vestchip-impostor/mesa.html?grupo=1`) carrega
`firebase-room.js` com `data-project="vestchip"`, `data-root="mosaico"`,
`data-case="vestchip-impostor"`, `data-papel-camada="nao"` e `data-retomar="sim"`.
O protocolo da sala é o mesmo d'O Impostor (sorteio em `oi`, agora com `formas` por papel;
capítulos em `cap {n, t0Ms}`, `jogadores.etapa/resumo`, `mensagens`), e as regras são as mesmas:
colar `o-impostor/firestore-impostor.rules` no console do projeto `vestchip`.
O estado local do aparelho usa o prefixo `vci:` no sessionStorage, separado do `cfi:`.

No console do projeto `vestchip`: Firestore (região `southamerica-east1`), Authentication com
Google e Anônimo, domínio autorizado `drmarionascimento.github.io`, as regras coladas e o
documento `config/mestres` com o campo `emails` (lista).

Pendente: o modo grupo foi validado só com a simulação local de jogadores (`humsim`);
falta um teste ao vivo com aparelhos reais na sala Firebase.

## A Manhã do Carro-Forte: O Impostor — projeto próprio (11/10/2026)

Desde 11/10/2026 o Carro-Forte: O Impostor sai do `oimpostor-c30e0` e usa o projeto
`o-impostor-carro-forte`. A mesa carrega `firebase-room.js?v=20261011-cf` com
`data-project="carroforte"` (resto igual: `data-root="mosaico"`,
`data-case="carro-forte-impostor"`, `data-papel-camada="nao"`, `data-retomar="sim"`).
Regras: as mesmas de `o-impostor/firestore-impostor.rules`, coladas no console.
A seção de 06/10/2026 acima fica como histórico.

No console do projeto `o-impostor-carro-forte`: Firestore (região `southamerica-east1`),
Authentication com Google e Anônimo, domínio autorizado `drmarionascimento.github.io`,
as regras coladas e o documento `config/mestres` com o campo `emails` (lista).
Salas abertas antes da troca, no projeto antigo, não aparecem no novo.
