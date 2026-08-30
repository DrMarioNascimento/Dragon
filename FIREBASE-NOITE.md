# Firebase — MOSAICO

O repositório usa dois projetos Firebase separados.

| Experiência | Projeto Firebase | Estrutura principal |
|---|---|---|
| A Mesa (`v1`) | `mosaico-game` | `mosaico/{codigo}` |
| A Noite (`v2`) | `mosaico-noite` | `noite/{codigo}` |
| Modo Solo (`solo`) | `mosaico-noite` | `usuarios/{uid}/experiencias/casa-da-costa-solo` |

## A Noite — estrutura restaurada

A Noite voltou ao modelo multiplayer:

1. Mestre escolhe **Abrir uma mesa**.
2. Mestre entra com Google.
3. O Firestore cria `noite/{codigo}` e grava a `partidaId` escolhida automaticamente pelo MOSAICO.
4. A sala mostra código e QR.
5. Convidados entram anonimamente por `?sala=CODIGO` ou digitando o código.
6. Todos permanecem vinculados à mesma sala e à mesma pergunta.
7. O Mestre inicia a sessão.

Projeto: `mosaico-noite`.

Authentication deve ter:

- Google habilitado para o Mestre;
- Anônimo habilitado para os convidados;
- `drmarionascimento.github.io` autorizado.

O documento `config/mestres` deve conter o e-mail autorizado em `emails`.

## Rotação automática

IDs válidos:

- `sete`
- `cinco`
- `apagao`
- `nome`
- `corpo`
- `perceber`

`partidaId` pode existir no documento da sala. Uma vez criada a sala, a pergunta fica congelada nela.

## Regras

`firestore.rules` foi atualizado para:

- aceitar `partidaId` nas salas;
- aceitar as fases `dossie` e `decisao`;
- permitir deduções com campos dinâmicos derivados da pergunta;
- manter `config/mestres` como autorização de quem pode abrir sala;
- permitir progresso pessoal do Modo Solo em `usuarios/{uid}` apenas ao próprio usuário.

### Publicação obrigatória

Alterar o arquivo no GitHub **não publica as regras nos projetos Firebase**. Depois desta atualização, publicar nos dois projetos:

```bash
firebase deploy --only firestore:rules -P mesa
firebase deploy --only firestore:rules -P noite
```

Enquanto isso não for feito, uma versão antiga das regras pode continuar devolvendo `Missing or insufficient permissions` mesmo com Google e Anônimo habilitados.

## Arquivos publicados da Noite

- `v2/index.html` — entrada multiplayer.
- `v2/room-shell.js` — Mestre, Google, criação de sala, entrada anônima, código, QR e lobby.
- `v2/room.css` — visual do lobby e QR.
- `v2/noite-auto.js` — experiência canônica após o Mestre iniciar.
- `v1/js/qr.js` — gerador local de QR, sem serviço externo.

## Solo

O Solo não cria sala. Ele usa conta Google e progresso pessoal em:

`usuarios/{uid}/experiencias/casa-da-costa-solo`

A Mesa continua isolada no projeto `mosaico-game` e A Noite no projeto `mosaico-noite`.
