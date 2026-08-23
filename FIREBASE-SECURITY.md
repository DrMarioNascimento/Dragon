# Segurança do Firebase

O arquivo `firestore.rules` é a fonte versionada das permissões do projeto `mosaico-game`.

## Garantias implementadas

- toda operação exige autenticação;
- somente o UID que criou a sala pode alterar fases, encerrá-la e publicar o placar;
- cada participante cria apenas o documento correspondente ao próprio UID;
- alterações ordinárias ficam limitadas a prontidão, personagem e Arquivo do próprio jogador;
- compras validam, na mesma transação, oferta, comprador, vendedor, preço e variação das moedas;
- votos de Performance e Cooperação são únicos, sem voto em si e legíveis apenas pelo autor e pelo mestre;
- tarefas sensoriais e Dedução Final são únicas por jogador;
- o avanço após uma apresentação é solicitado pelo jogador, mas executado pelo mestre;
- documentos e coleções desconhecidos são negados por padrão;
- exclusões diretas são bloqueadas.

## Publicação

Com a Firebase CLI autenticada por uma conta autorizada no projeto:

```bash
firebase deploy --only firestore:rules --project mosaico-game
```

Antes de uma sessão presencial, execute o jogo contra o emulador configurado em `firebase.json` e confirme a matriz abaixo.

| Teste | Resultado esperado |
|---|---|
| jogador atualiza o próprio estado permitido | aceita |
| jogador altera moedas ou pontuação diretamente | nega |
| jogador altera outro participante | nega |
| jogador muda fase ou encerra sala | nega |
| mestre muda fase ou encerra sala | aceita |
| voto em si mesmo ou segundo voto | nega |
| compra sem saldo ou fora da transação | nega |
| compra válida | aceita comprador, vendedor, oferta e negociação juntos |
| participante lê voto ou dedução de outro | nega |
| retorno a uma sala encerrada | nega |

## Limite conhecido

Os documentos públicos de jogadores ainda contêm o Arquivo de pistas porque o Mercado Cego atual transfere pistas por uma transação executada no cliente. A interface não revela esses campos, mas um participante tecnicamente experiente pode inspecioná-los nas ferramentas do navegador. A ocultação criptograficamente efetiva das pistas exige separar dados privados e processar compras em ambiente confiável, como Cloud Functions. Isso pertence ao item específico de proteção dos segredos do caso.
