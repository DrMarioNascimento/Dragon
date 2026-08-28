# Isolar A mesa e A noite

As duas versões não se misturam mais.

| | A mesa (v1) | A noite (v2) |
|---|---|---|
| Endereço | `/Dragon/v1/MOSAICO-mesa.html` | `/Dragon/v2/` |
| Coleção Firestore | `mosaico/{codigo}` | `noite/{codigo}` |
| App Auth | `mesa` | `noite` |
| localStorage | `mosaico_*` | `noite.*` |
| QR | o da mesa | o da noite (`/Dragon/v2/?sala=`) |

Um código da mesa **não** abre a noite, e o contrário também. Salas antigas da noite que estavam em `mosaico/` ficam para trás — abre uma mesa nova.

## O que já está no código

- Regras aceitam as duas árvores: `mosaico` e `noite`.
- A noite grava só em `noite/`.
- A mesa grava só em `mosaico/`.
- Auth anônimo de cada um fica em sessão separada no mesmo telefone.

## Publicar as regras (obrigatório)

No console: **Firestore → Rules**. Cola o arquivo
[firestore.rules](https://github.com/DrMarioNascimento/Dragon/blob/main/firestore.rules)
e **Publish**. Sem isso a noite nova não cria sala.

## Projeto Firebase só da noite (opcional, isolamento total)

Hoje as duas ainda usam o projeto `mosaico-game`. Os dados já não se cruzam. Se quiser conta, cota e chaves 100% separadas:

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → nome `mosaico-noite`.
2. **Authentication** → ligar **Anonymous**.
3. **Authorized domains** → `drmarionascimento.github.io` e `localhost`.
4. **Firestore** → criar banco, modo produção, cola as mesmas `firestore.rules` (a noite só usa a árvore `noite/`).
5. **Project settings** → app Web → copia `apiKey`, `authDomain`, `projectId`, `appId`.
6. Cola em `mosaico-web/src/lib/mosaico/firebase.ts` no objeto `firebaseConfig`.
7. Rebuild da v2.

A mesa continua no projeto `mosaico-game`. Não mexa nas chaves da v1.
