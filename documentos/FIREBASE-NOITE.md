# Firebase — MOSAICO (mapeamento por caso)

O repositório usa **dois projetos Firebase**, agora amarrados ao **caso**, não ao antigo par Mesa/Noite.

| Caso | Projeto Firebase | Entradas |
|---|---|---|
| **A Casa da Costa** | `mosaico-game` | `casa-da-costa/` → Celular (`jogos/casa-da-costa/a-mesa/`), Telão (`telao.html?jogo=casa-da-costa`), Solo (`jogos/casa-da-costa/solo/`); fluxo alternativo `jogos/casa-da-costa/a-noite/` também em `mosaico-game` |
| **A Manhã do Carro-Forte** | `mosaico-noite` | `jogos/a-manha-do-carro-forte/a-mesa/` → Celular (`celular.html`), Telão (`telao.html?jogo=carro-forte`), Solo; fechamento em `jogos/a-manha-do-carro-forte/a-noite/` |

## Coleções

- Casa / Celular canônico: `mosaico/{codigo}` em `mosaico-game`
- Casa / fluxo v2 (revisão): `noite/{codigo}` em `mosaico-game`
- Carro-Forte / Celular: `mosaico/{codigo}` em `mosaico-noite`
- Carro-Forte / fechamento: `noite/{codigo}` em `mosaico-noite`
- Solo Casa: `usuarios/{uid}/experiencias/casa-da-costa-solo` em `mosaico-game`

## Publicar regras

```bash
firebase deploy --only firestore:rules -P mesa
firebase deploy --only firestore:rules -P noite
```

`.firebaserc` mantém os aliases `mesa` → `mosaico-game` e `noite` → `mosaico-noite`.

## Raízes e aliases

Clientes usam apenas `mosaico` e `noite` como coleção-raiz de sala.
`firestore.rules` ainda lista `carroforte` / `carroforte-noite` como aliases
legados (não remover sem auditar salas antigas). Ver `FIREBASE-SECURITY.md`.
