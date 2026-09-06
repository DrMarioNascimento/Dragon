# MOSAICO — Padrão único de sala multiplayer

Este documento é normativo para todos os jogos multiplayer do MOSAICO. A referência operacional é **A Mesa — A Casa da Costa**.

## Regra geral

O que muda entre casos e modos é o jogo depois de iniciado. A infraestrutura de entrada deve permanecer igual.

**O projeto Firebase é definido pelo caso (1:1), não pelo rótulo Mesa/Noite.**

- **A Casa da Costa** → sempre `mosaico-game`;
- **A Manhã do Carro-Forte** → sempre `mosaico-noite`;
- cada caso tem um app com portas **Celular · Telão · Solo**;
- o caso continua identificado na sala por `caseId`.

## Fluxo obrigatório

### 1. Portas do caso (landing) e gate Celular

Cada caso tem landing com **Celular · Telão · Solo**. O gate dentro do **Celular** NÃO repete a escolha de modo:

1. **Abrir uma mesa** (primário)
2. **Entrar em uma mesa** (secundário)

- **Solo** (landing): ensaio neste aparelho — abertura individual.
- **Telão** (landing / CTA): display only. Mestre cria a sala no Celular; a TV entra com o código (`?sala=` ou formulário do telão).
- Não há **Ensaiar** nem **Entrar como telão** dentro do gate Celular.
- Não há **Com telão / Sem telão** no fluxo Abrir mesa: presença de telão é detectada por heartbeat `telao/{uid}` / `modo` na abertura.

### Abertura (obrigatória) — roteamento

| Modo | Onde toca a abertura AV |
|---|---|
| **Solo** | Neste aparelho |
| **Multiplayer sem telão** | Só no aparelho do **Mestre** (convidados aguardam) |
| **Multiplayer com telão** | Só no **Telão** (celulares não tocam o AV completo) |

### 2. Mestre da Mesa

Ao escolher **Abrir uma mesa**:

1. mostrar a etapa **Mestre da Mesa**;
2. autenticar o Mestre com **Google**;
3. autorizar a abertura somente quando o e-mail autenticado estiver em `config/mestres` do projeto Firebase daquele modo;
4. somente após o login, abrir a **Identificação do jogador**;
5. solicitar o nome;
6. solicitar uma das três formas de tratamento visual:
   - 👋 **Bem-vindo** (`forma: m`)
   - 👋 **Bem-vinda** (`forma: f`)
   - ✨ **Tanto faz** (`forma: n`)
7. o Mestre também é registrado como jogador da sala;
8. criar a sala no Firebase do modo correspondente.

### 3. Sala de espera

A sala deve mostrar, no mesmo painel:

- código de seis caracteres;
- **QR Code dentro da própria sala**;
- orientação para apontar a câmera ou informar o código;
- lista em tempo real dos jogadores conectados;
- identificação do Mestre;
- identificação visual dos jogadores;
- botão **Iniciar partida** visível somente para o Mestre;
- convidados veem **Aguardando o Mestre iniciar a partida…**;
- badges da lista: **Mestre** / **Jogador**;
- o painel persistente chama-se **Sala** (Title Case).

### Painel Sala (Mestre) — ordem

1. Ação necessária (se houver)
2. Código e QR
3. Participantes
4. Controle partida
5. Encerrar sala

(O bloco “abra o telão” saiu do painel Sala — o telão entra pela landing.)

O QR deve abrir o próprio jogo com `?sala=CODIGO`.

### 4. Jogadores convidados

Ao entrar pelo QR ou código:

1. autenticação **anônima** ocorre em segundo plano;
2. abrir **Identificação do jogador**;
3. solicitar nome;
4. solicitar Bem-vindo / Bem-vinda / Tanto faz;
5. registrar o jogador no Firestore;
6. mostrar a sala de espera até o Mestre iniciar.

Convidado não precisa de login Google.

### 5. Início sincronizado

- somente o Mestre inicia a partida;
- a mudança de fase é gravada no Firestore;
- todos os aparelhos recebem o início em tempo real;
- qualquer pergunta/cenário/variante definida pelo sistema deve ser gravada no documento da sala e permanecer congelada durante aquela sessão;
- recarga ou reconexão não pode gerar outra variante.

## Firebase por modo

| Caso | Projeto Firebase | Coleção Celular | Coleção fluxo alternativo/fechamento |
|---|---|---|---|
| **A Casa da Costa** | `mosaico-game` | `mosaico/{codigo}` | `noite/{codigo}` (v2, revisão) |
| **A Manhã do Carro-Forte** | `mosaico-noite` | `mosaico/{codigo}` | `noite/{codigo}` |

### Invariante técnico

`data-project="mesa"` → credenciais de `mosaico-game`. `data-project="noite"` → credenciais de `mosaico-noite`. Para Carro-Forte o Celular usa `data-project="noite"`. Não misturar chaves entre projetos.

## Casos abrangidos

Este padrão vale, no mínimo, para:

- A Mesa — A Casa da Costa
- A Noite — A Casa da Costa
- A Mesa — A Manhã do Carro-Forte
- A Noite — A Manhã do Carro-Forte
- futuros casos multiplayer do MOSAICO

Não criar fluxos paralelos de login, identificação, QR ou lobby sem decisão explícita de projeto.


## Implementação atual

- **Carro-Forte Celular**, **A Noite (Carro-Forte)** e **A Casa da Costa Celular** usam o mesmo gate/lobby em `firebase-room.js`.
- Casa: `v1/MOSAICO-mesa.html` carrega `firebase-room.js` com `data-project="mesa"` / `data-root="mosaico"` / `data-case="casa-da-costa"`. A ponte `v1/js/casa-firebase-room-bridge.js` entrega a partida ao motor v1 (personagem, `fase:encenacao`, `MosaicoFB` na app `dragon-mesa`).
- Porta Solo / hub: CTA **Ensaiar neste aparelho** (no gate da Casa, `?soloLab=1` / ensaio redireciona para `/solo/`).
- **A Noite v2** (`/v2/`, `mosaico-web/`) não é porta de produção do playtest. A landing da Casa não aponta para ela. Bookmarks antigos ainda abrem o shell; o gate de lá é Abrir | Entrar (sem Ensaiar sozinho). Módulos v2/mosaico-web da Janela usam CTA Casa.
- Forma “Tanto faz”: código canônico **`n`** (Casa aceita legado `?` na leitura).
