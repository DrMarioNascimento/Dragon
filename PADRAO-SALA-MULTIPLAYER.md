# MOSAICO — Padrão único de sala multiplayer

Este documento é normativo para todos os jogos multiplayer do MOSAICO. A referência operacional é **A Mesa — A Casa da Costa**.

## Regra geral

O que muda entre casos e modos é o jogo depois de iniciado. A infraestrutura de entrada deve permanecer igual.

**O projeto Firebase é definido exclusivamente pelo tipo de partida, nunca pelo caso.**

- toda experiência **A Mesa**, atual ou futura, usa `mosaico-game`;
- toda experiência **A Noite**, atual ou futura, usa `mosaico-noite`;
- A Casa da Costa, A Manhã do Carro-Forte e futuros casos não criam projetos Firebase próprios;
- o caso é identificado dentro da sala por `caseId` e não pela escolha do projeto Firebase.

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

| Tipo de partida | Projeto Firebase | Coleção principal | Casos |
|---|---|---|---|
| **A Mesa** | `mosaico-game` | `mosaico/{codigo}` | todos |
| **A Noite** | `mosaico-noite` | `noite/{codigo}` | todos |

Casos diferentes compartilham a infraestrutura do modo e gravam `caseId` para impedir que um código de outro caso seja aceito na página errada.

### Invariante técnico

Uma página marcada como `data-project="mesa"` deve carregar somente as credenciais Web do projeto `mosaico-game`. Uma página marcada como `data-project="noite"` deve carregar somente as credenciais Web do projeto `mosaico-noite`. Não reutilizar `apiKey`, `messagingSenderId` ou `appId` entre os dois projetos.

## Casos abrangidos

Este padrão vale, no mínimo, para:

- A Mesa — A Casa da Costa
- A Noite — A Casa da Costa
- A Mesa — A Manhã do Carro-Forte
- A Noite — A Manhã do Carro-Forte
- futuros casos multiplayer do MOSAICO

Não criar fluxos paralelos de login, identificação, QR ou lobby sem decisão explícita de projeto.
