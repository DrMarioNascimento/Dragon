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

### 1. Tela inicial

Sempre oferecer:

- **Abrir uma mesa**
- **Entrar em uma mesa**
- **Ensaiar sozinho/neste aparelho**, quando o modo possuir ensaio local

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
- botão **Iniciar partida** visível somente para o Mestre.

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
