# Firebase — A Noite e Modo Solo

O repositório usa **dois projetos Firebase separados**.

| Experiência | Projeto Firebase | Dados principais |
|---|---|---|
| A Mesa (`v1`) | `mosaico-game` | `mosaico/{codigo}` |
| A Noite (`v2`) | `mosaico-noite` | progresso pessoal em `usuarios/{uid}/experiencias/casa-da-costa-noite` |
| Modo Solo (`solo`) | `mosaico-noite` | progresso pessoal em `usuarios/{uid}/experiencias/casa-da-costa-solo` |

A Mesa continua isolada e não deve ter suas chaves alteradas.

## Login Google

A Noite e o Modo Solo agora carregam `firebase-user.js` **antes do jogo**. O jogo só inicia depois que uma conta Google é resolvida.

No projeto `mosaico-noite`, conferir em **Authentication → Sign-in method**:

- **Google** ligado;
- domínio `drmarionascimento.github.io` autorizado.

O código usa popup e cai para redirect quando o navegador bloquear popup.

## O que é sincronizado

O Firestore guarda somente estado de jogo e identificação básica da conta:

- pergunta atual / rotação;
- progresso da investigação;
- respostas e fragmentos já processados;
- nome e e-mail retornados pelo Google;
- horário da última sincronização.

A fonte canônica da história continua sendo `v1/casos/casa-da-costa.json`.

## Regras obrigatórias

Além das regras já existentes para `mosaico/` e `noite/`, o projeto `mosaico-noite` precisa permitir a árvore pessoal abaixo:

```rules
match /usuarios/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

O mesmo bloco está versionado em `FIRESTORE-USUARIOS.rules.snippet`.

**Importante:** editar o repositório não publica regras no console Firebase. Depois de incorporar esse bloco ao `firestore.rules`, publicar no projeto da noite:

```bash
firebase deploy --only firestore:rules -P noite
```

Enquanto a regra ainda não estiver publicada, o login Google funciona e o jogo continua localmente, mas o selo da conta mostra `local` em vez de `Firebase` e o console registra a recusa do Firestore.

## Configuração usada pelo cliente

Projeto: `mosaico-noite`

```text
authDomain: mosaico-noite.firebaseapp.com
projectId: mosaico-noite
storageBucket: mosaico-noite.firebasestorage.app
```

A configuração Web completa está centralizada em `firebase-user.js`. O antigo código React em `mosaico-web/src/lib/mosaico/firebase.ts` continua apenas como legado/referência e não é mais a camada de autenticação das páginas publicadas atuais.

## Arquitetura

- `firebase-user.js` — Google Auth + leitura/gravação do progresso por uid.
- `v2/index.html` — espera `mosaico-cloud-ready` e só então carrega `noite-auto.js`.
- `solo/index.html` — espera `mosaico-cloud-ready`, carrega `solo-auto.js` e depois `solo-cloud-state.js`.
- `solo/solo-cloud-state.js` — transforma o estado em memória do Solo em snapshot sincronizável.

Assim, recarregar a página ou abrir a experiência em outro aparelho com a mesma conta recupera a rotação e o progresso após a sincronização do Firestore.
