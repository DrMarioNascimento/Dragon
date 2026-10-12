# Segurança do Firebase

O MOSAICO usa **dois projetos Firebase independentes**, amarrados ao **caso**
(não ao antigo par Mesa/Noite). Essa separação é intencional e deve ser preservada:

| Caso / experiência | Alias Firebase | Projeto | Estrutura principal |
|---|---|---|---|
| **A Casa da Costa** (Celular / Telão / Solo) | `mesa` | `mosaico-game` | `mosaico/{sala}`; Solo em `usuarios/{uid}/experiencias/casa-da-costa-solo` |
| **Casa · fluxo v2** (revisão) | `mesa` | `mosaico-game` | `noite/{sala}` |
| **A Manhã do Carro-Forte** (Celular / Telão) | `noite` | `mosaico-noite` | `mosaico/{sala}` |
| **Carro-Forte · fechamento (A Noite)** | `noite` | `mosaico-noite` | `noite/{sala}` |

O arquivo `firestore.rules` é a fonte versionada das regras. Ele pode ser mantido como fonte comum no repositório, mas **precisa ser publicado separadamente em cada projeto Firebase**. Publicar no projeto da Casa (`mesa` → `mosaico-game`) não altera as regras do Carro-Forte (`noite` → `mosaico-noite`), e vice-versa.

Os projetos não compartilham banco Firestore, sessão de Authentication, documento `config/mestres` nem estado de sala. Cada projeto deve ter sua própria configuração operacional.

## Coleções-raiz (`known`)

As regras aceitam as raízes canônicas `mosaico` e `noite`, mais os aliases legados
`carroforte` e `carroforte-noite` (salas antigas). **Clientes atuais só usam
`mosaico` / `noite`** — ver testes de sincronia Firebase. Não remover os aliases
sem auditar dados remotos.

`validPartida` restringe o campo raiz `partidaId` aos IDs de pergunta da Casa.
O Carro-Forte grava a pergunta em `partida.pergunta` (mapa aninhado) e não deve
escrever `partidaId` na raiz da sala.

## Gate (`firebase-room.js`)

Casa Celular, Carro Celular e Carro Noite entram pela mesma folha. A Casa liga o motor v1 via `v1/js/casa-firebase-room-bridge.js` sem segundo fluxo de login. As regras (`emailMestre`, `ownPlayerUpdate`, fases conhecidas) não mudam com esse port.

## Autorização do Mestre

A abertura de uma sala exige:

- autenticação Firebase válida;
- login com provedor Google;
- e-mail presente em `config/mestres.emails` **no mesmo projeto Firebase usado pela experiência**;
- `mestreUid` igual ao UID autenticado;
- sala criada ativa e na fase inicial permitida pelas regras.

Portanto, para o **Carro-Forte / A Noite**, reconhecer o Mestre na interface não é suficiente se as regras ou `config/mestres` do projeto `mosaico-noite` estiverem ausentes/desatualizados. Nessa situação o Firestore devolve `Missing or insufficient permissions`.

## Garantias implementadas

- toda operação exige autenticação;
- somente o UID que criou a sala pode alterar fases, encerrá-la e publicar o placar;
- a fase da sala só pode ser um valor conhecido; qualquer outro valor é recusado, inclusive ao mestre;
- cada participante cria apenas o documento correspondente ao próprio UID;
- o convidado pode atualizar, no próprio `jogadores/{uid}`, só o allowlist de
  `ownPlayerUpdate` (pronto/forma/pistas, personagem/fragmentoPronto, papel/camada,
  resumo `hpcScaffold`, voto de envio do Fragmento `pedidoEnvioFragmento` /
  `votoEnvioSim` / `votoEnvioMs`) — nunca moedas, total nem núcleo;
- o Portador (ou integrante de Fragmento compartilhado, mesas ≤3) grava o
  rascunho do núcleo e pode fechar com `concluidoEm` **uma vez**, como
  timestamp do servidor — número de cliente é recusado (desempate de tempo);
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
# Casa da Costa (e Solo Casa)
firebase deploy --only firestore:rules -P mesa

# Carro-Forte (Celular + fechamento)
firebase deploy --only firestore:rules -P noite
```

Quando `firestore.rules` mudar e a alteração for aplicável às duas experiências, publique **nos dois projetos**:

```bash
firebase deploy --only firestore:rules -P mesa
firebase deploy --only firestore:rules -P noite
```

Não use apenas o projeto `default` para uma atualização destinada ao Carro-Forte. O `default` aponta para `mosaico-game` e, portanto, atualiza somente a Casa.

## Checklist de implantação — Carro-Forte / A Noite

Antes de testar a criação de uma mesa no Carro-Forte, conferir no projeto `mosaico-noite`:

1. Google habilitado em Authentication;
2. autenticação anônima habilitada para convidados;
3. domínio publicado autorizado;
4. documento `config/mestres` existente;
5. campo `emails` contendo o e-mail autorizado do Mestre;
6. `firestore.rules` publicado com `-P noite`;
7. cliente apontando para `projectId: mosaico-noite` e coleção canônica (`mosaico` no Celular; `noite` no fechamento).

Se a interface mostrar o Mestre reconhecido, mas a criação retornar `Missing or insufficient permissions`, verificar primeiro os itens **4, 5 e 6**.

## Testes

A matriz automatizada está em `tests/regras.test.mjs` e roda contra o emulador configurado em `firebase.json`:

```bash
npm run test:regras
```

O emulador valida a regra versionada; ele **não comprova que essa mesma versão já foi implantada nos dois projetos remotos**. Antes de uma sessão presencial, além dos testes locais, confirme a publicação das regras no projeto correspondente à experiência que será usada.

## Princípio de isolamento

**Casa da Costa e Carro-Forte não devem ser reunidos em um único projeto Firebase.** O isolamento `mosaico-game` / `mosaico-noite` (caso→projeto) é parte da arquitetura do MOSAICO. Alterações futuras de autenticação, regras ou dados devem sempre indicar explicitamente a qual dos dois projetos se destinam.
