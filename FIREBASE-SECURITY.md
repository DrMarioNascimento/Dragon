# Segurança do Firebase

O MOSAICO usa **dois projetos Firebase independentes**. Essa separação é intencional e deve ser preservada:

| Experiência | Alias Firebase | Projeto | Estrutura principal |
|---|---|---|---|
| **A Mesa** | `mesa` | `mosaico-game` | `mosaico/{sala}` |
| **A Noite** | `noite` | `mosaico-noite` | `noite/{sala}` |
| **Modo Solo** | `noite` | `mosaico-noite` | `usuarios/{uid}/...` |

O arquivo `firestore.rules` é a fonte versionada das regras. Ele pode ser mantido como fonte comum no repositório, mas **precisa ser publicado separadamente em cada projeto Firebase**. Publicar no projeto da Mesa não altera as regras de A Noite, e vice-versa.

Os projetos não compartilham banco Firestore, sessão de Authentication, documento `config/mestres` nem estado de sala. Cada projeto deve ter sua própria configuração operacional.

## Autorização do Mestre

A abertura de uma sala exige:

- autenticação Firebase válida;
- login com provedor Google;
- e-mail presente em `config/mestres.emails` **no mesmo projeto Firebase usado pela experiência**;
- `mestreUid` igual ao UID autenticado;
- sala criada ativa e na fase inicial permitida pelas regras.

Portanto, para **A Noite**, reconhecer o Mestre na interface não é suficiente se as regras ou `config/mestres` do projeto `mosaico-noite` estiverem ausentes/desatualizados. Nessa situação o Firestore devolve `Missing or insufficient permissions`.

## Garantias implementadas

- toda operação exige autenticação;
- somente o UID que criou a sala pode alterar fases, encerrá-la e publicar o placar;
- a fase da sala só pode ser um valor conhecido; qualquer outro valor é recusado, inclusive ao mestre;
- cada participante cria apenas o documento correspondente ao próprio UID;
- uma pessoa autenticada com o código de uma sala ativa pode consultar a lista de jogadores necessária à entrada;
- documentos e coleções desconhecidos são negados por padrão;
- exclusões diretas são bloqueadas;
- `usuarios/{uid}` é privado ao próprio usuário autenticado.

## Publicação das regras

Os aliases oficiais estão em `.firebaserc`:

- `mesa` → `mosaico-game`
- `noite` → `mosaico-noite`

Com a Firebase CLI autenticada em uma conta autorizada, publique explicitamente no destino desejado:

```bash
# A Mesa
firebase deploy --only firestore:rules -P mesa

# A Noite + Solo
firebase deploy --only firestore:rules -P noite
```

Quando `firestore.rules` mudar e a alteração for aplicável às duas experiências, publique **nos dois projetos**:

```bash
firebase deploy --only firestore:rules -P mesa
firebase deploy --only firestore:rules -P noite
```

Não use apenas o projeto `default` para uma atualização destinada a A Noite. O `default` aponta para `mosaico-game` e, portanto, atualiza somente A Mesa.

## Checklist de implantação — A Noite

Antes de testar a criação de uma mesa em A Noite, conferir no projeto `mosaico-noite`:

1. Google habilitado em Authentication;
2. autenticação anônima habilitada para convidados;
3. domínio publicado autorizado;
4. documento `config/mestres` existente;
5. campo `emails` contendo o e-mail autorizado do Mestre;
6. `firestore.rules` publicado com `-P noite`;
7. cliente apontando para `projectId: mosaico-noite` e coleção `noite`.

Se a interface mostrar o Mestre reconhecido, mas a criação retornar `Missing or insufficient permissions`, verificar primeiro os itens **4, 5 e 6**.

## Testes

A matriz automatizada está em `tests/regras.test.mjs` e roda contra o emulador configurado em `firebase.json`:

```bash
npm run test:regras
```

O emulador valida a regra versionada; ele **não comprova que essa mesma versão já foi implantada nos dois projetos remotos**. Antes de uma sessão presencial, além dos testes locais, confirme a publicação das regras no projeto correspondente à experiência que será usada.

## Princípio de isolamento

**A Mesa e A Noite não devem ser reunidas em um único projeto Firebase.** O isolamento `mosaico-game` / `mosaico-noite` é parte da arquitetura do MOSAICO. Alterações futuras de autenticação, regras ou dados devem sempre indicar explicitamente a qual dos dois projetos se destinam.
