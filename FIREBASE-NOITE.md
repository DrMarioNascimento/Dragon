# As regras da noite

O repositório publica **dois** jogos em **dois projetos Firebase separados**.
Cada projeto tem o seu próprio banco e o seu próprio arquivo de regras.

| | Mesa (v1) | Noite (v2) |
|---|---|---|
| Projeto Firebase | `mosaico-game` | `mosaico-noite` |
| Coleção | `mosaico/` | `noite/` |
| Alias no `.firebaserc` | `mesa` | `noite` |

O `firestore.rules` deste repositório cobre as duas — `known(versao)` aceita
`mosaico` e `noite` — mas até 29/08/2026 o `.firebaserc` só conhecia
`mosaico-game`. Um `firebase deploy` daqui publicava as regras **só na mesa**,
e as regras que guardam a noite viviam apenas no console, sem versão, sem
teste e sem ninguém sabendo quais eram.

## Publicar

```bash
firebase deploy --only firestore:rules -P mesa
firebase deploy --only firestore:rules -P noite
```

**As duas, sempre.** Publicar em uma só reintroduz exatamente a deriva que
este arquivo existe para impedir.

## Antes de qualquer partida em rede: conferir a lista de mestres

Abrir mesa exige que o e-mail do Google esteja em `config/mestres` **no
projeto da noite**:

```
mosaico-noite → Firestore → coleção `config` → documento `mestres`
  emails: ["seu.email@gmail.com", ...]      ← lista de strings
```

Sem esse documento, `emailMestre()` é falso, o `create` da sala é negado e o
jogo mostra *"Esse Google não está autorizado a abrir mesa"* — para todo mundo,
inclusive para quem escreveu o jogo. Nada no código avisa: é configuração que
mora fora do repositório.

Conferir também em **Authentication → Sign-in method** do `mosaico-noite`:

- **Google** ligado — é como quem abre a mesa entra;
- **Anônimo** ligado — é como os convidados entram, só com o código.

## Cuidado ao mexer

`src/lib/mosaico/mestres.ts` tem uma segunda lista, no cliente, chamada
`MESTRES`. Ela está vazia e **não é usada por nada** — `podeAbrirMesa()` e
`studioPodeAbrir()` não são chamadas em lugar nenhum. Quem manda é a lista do
Firestore. Duas listas com o mesmo nome, só uma vale.
