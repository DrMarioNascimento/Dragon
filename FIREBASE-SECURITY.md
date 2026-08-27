# Segurança do Firebase

O arquivo `firestore.rules` é a fonte versionada das permissões do projeto `mosaico-game`.

Serve a **mesa HTML** e a **noite v3** (`mosaico-web`), na mesma coleção `mosaico/{sala}`.

## Garantias implementadas

- toda operação exige autenticação;
- somente o UID que criou a sala pode alterar fases, encerrá-la e publicar o placar;
- a fase da sala só pode ser um valor conhecido (mesa HTML **ou** noite v3: `janela`, `comodo`, `cor`, `encaixe`, `oleo`); qualquer outro valor é recusado, inclusive ao mestre;
- em mesas de 4–12, somente o Portador sorteado pode gravar o rascunho e concluir seu Mosaico;
- em mesas de 1–3, todos os integrantes do Fragmento compartilhado podem editar e concluir;
- em mesas **v3** (`v3: true`), qualquer integrante do próprio Fragmento grava a carta — não há Portador;
- cada participante cria apenas o documento correspondente ao próprio UID;
- uma pessoa autenticada com o código de uma sala ativa pode consultar a lista de jogadores necessária à entrada;
- alterações ordinárias ficam limitadas a prontidão, personagem e Arquivo do próprio jogador;
- o Arquivo cresce no máximo uma pista por escrita, e a mesma escrita não pode encostar nas moedas;
- o campo `concluidoMs` do Fragmento não é mais aceito: só o carimbo do servidor conta como hora de entrega;
- compras validam, na mesma transação, oferta, comprador, vendedor, preço e variação das moedas;
- votos de Performance e Cooperação são únicos, sem voto em si e legíveis apenas pelo autor e pelo mestre;
- tarefas sensoriais (`inclinacao` = Janela, `constelacao` = Vidro, `sala` = Sala às Escuras) e Dedução Final são únicas por jogador;
- o avanço após uma apresentação é solicitado pelo jogador, mas executado pelo mestre;
- documentos e coleções desconhecidos são negados por padrão;
- exclusões diretas são bloqueadas.

## Publicação

Com a Firebase CLI autenticada por uma conta autorizada no projeto:

```bash
firebase deploy --only firestore:rules --project mosaico-game
```

A matriz abaixo deixou de ser conferida à mão. Ela está escrita em `tests/regras.test.mjs` e roda contra o emulador configurado em `firebase.json` (porta **8180**, para não colidir com o cliente web):

```bash
npm run test:regras
```

Antes de uma sessão presencial, execute também o jogo contra o emulador e confirme o comportamento em tela.

| Teste | Resultado esperado |
|---|---|
| jogador atualiza o próprio estado permitido | aceita |
| jogador altera moedas ou pontuação diretamente | nega |
| jogador altera outro participante | nega |
| jogador muda fase ou encerra sala | nega |
| mestre muda fase ou encerra sala | aceita |
| mestre avança para fase v3 (`janela`) | aceita |
| mestre grava fase desconhecida | nega |
| voto em si mesmo ou segundo voto | nega |
| compra sem saldo ou fora da transação | nega |
| compra válida | aceita comprador, vendedor, oferta e negociação juntos |
| participante lê voto ou dedução de outro | nega |
| integrante comum altera o rascunho do Fragmento | nega |
| Portador altera o rascunho do próprio Fragmento | aceita |
| integrante do Fragmento compartilhado (1–3) altera o rascunho | aceita |
| participante de outro Fragmento tenta alterar o rascunho | nega |
| mesa v3: integrante do Fragmento grava a carta | aceita |
| tarefa `sala` no próprio UID | aceita |
| tarefa inventada | nega |
| retorno a uma sala encerrada | nega |
| jogador acrescenta uma pista ao próprio Arquivo | aceita |
| jogador acrescenta duas pistas na mesma escrita | nega |
| jogador acrescenta pista e altera moedas juntos | nega |
| qualquer pessoa grava `concluidoMs` no Fragmento | nega |

## Limites conhecidos

**Leitura das pistas.** Os documentos públicos de jogadores ainda contêm o Arquivo de pistas porque o Mercado Cego atual transfere pistas por uma transação executada no cliente. A interface não revela esses campos, mas um participante tecnicamente experiente pode inspecioná-los nas ferramentas do navegador. A ocultação criptograficamente efetiva das pistas exige separar dados privados e processar compras em ambiente confiável, como Cloud Functions. Isso pertence ao item específico de proteção dos segredos do caso.

**Escrita das pistas.** O cliente precisa acrescentar pistas ao próprio Arquivo: é assim que a pista privada do personagem e a pista de cada tarefa sensorial chegam. A regra atual encarece o abuso — uma pista por escrita, sem tocar nas moedas — mas não o elimina: quem insistir repete a operação. Isso não fere apenas o sigilo; fere a Economia e Risco, porque moedas guardadas viram pontos e a compra deixa de ser necessária. A eliminação real exige que a concessão de pista saia do jogador, seja pelo mestre (que já processa a coleção `acoes`), seja por Cloud Functions.

**Segredos do caso no cliente.** `CASO.solucao` e a revelação completa chegam ao navegador de todos no carregamento. Para produto ou competição, o caso precisará ser servido em partes, no momento correto.

**Apuração no aparelho do mestre.** O placar é calculado num único cliente. Se ele cair no encerramento, não há quem calcule, e o `mestreUid` é imutável por regra. É risco operacional de sessão presencial, não falha de autorização.
