# MOSAICO — Padrão único de sala multiplayer

Este documento é normativo para todos os jogos multiplayer do MOSAICO. A referência operacional é **A Mesa — A Casa da Costa**.

## Regra geral

O que muda entre casos e modos é o jogo depois de iniciado. A infraestrutura de entrada deve permanecer igual.

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
3. somente após o login, abrir a **Identificação do jogador**;
4. solicitar o nome;
5. solicitar uma das três formas de tratamento visual:
   - 👋 **Bem-vindo** (`forma: m`)
   - 👋 **Bem-vinda** (`forma: f`)
   - ✨ **Tanto faz** (`forma: n`)
6. o Mestre também é registrado como jogador da sala;
7. criar a sala no Firebase do modo correspondente.

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

| Modo | Projeto | Coleção principal |
|---|---|---|
| A Mesa | `mosaico-game` | `mosaico/{codigo}` |
| A Noite | `mosaico-noite` | `noite/{codigo}` |

Casos diferentes compartilham a infraestrutura do modo, mas devem gravar `caseId` para impedir que um código de outro caso seja aceito na página errada.

## Casos abrangidos

Este padrão vale, no mínimo, para:

- A Mesa — A Casa da Costa
- A Noite — A Casa da Costa
- A Mesa — A Manhã do Carro-Forte
- A Noite — A Manhã do Carro-Forte
- futuros casos multiplayer do MOSAICO

Não criar fluxos paralelos de login, identificação, QR ou lobby sem decisão explícita de projeto.
