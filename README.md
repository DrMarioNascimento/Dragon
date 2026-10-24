# Dragon Games

## Situação atual — 24 de outubro de 2026

Este repositório mantém o portal Dragon Games e materiais de desenvolvimento, históricos e de compatibilidade. A manutenção dos jogos separados ocorre em `casa-da-costa`, `carro-forte` e `eco-do-amanha`; Mosaico Card e Eita! também têm repositórios próprios. Consulte [a organização atual](documentos/ORGANIZACAO-DRAGON.md). O catálogo usa imagens locais em `brand/jogos/`, incluindo as do Eco do Amanhã. As histórias MOSAICO e Mosaico Card permanecem em testes fechados; **Eita! está em testes abertos**, com licença própria.

## Desenvolvimento e acesso

As histórias MOSAICO e Mosaico Card estão em testes fechados, com condução autorizada. **Eita! está aberto ao público desde 20 de outubro de 2026**: qualquer conta Google pode conduzir uma partida; participantes entram pelo código, sem cadastro. A abertura do Eita! não libera os outros jogos.

Enquanto os jogos estiverem em desenvolvimento, regras, interfaces e funcionalidades poderão mudar. Algumas páginas poderão apresentar demonstrações do projeto, mas isso não significa que os jogos estejam disponíveis para participação do público.

Mário César Nascimento estuda **Game Design e desenvolvimento de jogos**. Estes projetos acompanham esse percurso de formação e experimentação. As autorias e condições de uso de cada projeto estão identificadas em [LICENSE.md](LICENSE.md).

**Availability:** Eita! is in open public testing (Google sign-in for hosts; room code for participants). MOSAICO stories and Mosaico Card remain in closed testing. Each project retains its own license.


## Endereços oficiais

| Projeto | Endereço |
|---|---|
| Portal do Prof. Mário | https://www.drmarionascimento.com.br/ |
| Dragon Games | https://dragongames.dev.br/ |
| Mosaico Card | https://mosaico-card.dragongames.dev.br/ |
| A Casa da Costa | https://casa-da-costa.dragongames.dev.br/ |
| A Manhã do Carro-Forte | https://carro-forte.dragongames.dev.br/ |
| O Eco do Amanhã | https://eco-do-amanha.dragongames.dev.br/ |

## Organização atual

Cada história possui repositório e subdomínio próprios. Consulte [a organização dos jogos](documentos/ORGANIZACAO-DRAGON.md). Os caminhos locais citados na documentação técnica abaixo registram a estrutura de origem e materiais de compatibilidade; para manutenção atual, consulte o repositório de cada jogo.

## Organização do portal

O catálogo reúne **A Casa da Costa**, **A Manhã do Carro-Forte**,
**O Eco do Amanhã — VestChip**, **Mosaico Card — Novo Testamento e Filmes e Séries** e **Eita!**.
As histórias do MOSAICO têm entradas por versão em
[`historias/`](historias/README.md). Esse mapa identifica as entradas
e as pastas de implementação de cada história.

O bloco **Solo / Ensaiar neste aparelho** saiu do catálogo principal. O antigo
atalho para **LAB-RA** e seus links ativos foram removidos deste repositório.
As experiências complementares e seus recursos continuam preservados; as
entradas antigas dos jogos funcionam por redirecionamento. Telão e opções de O Impostor
ficam nas páginas de acesso de cada versão. **O Eco do Amanhã — VestChip
existe somente na versão O Impostor.**

## Outros jogos da Dragon Games

O portal também apresenta jogos mantidos em repositórios independentes:

- **Mosaico Card — duas versões:** [Página do projeto](https://mosaico-card.dragongames.dev.br/) · [Repositório](https://github.com/DrMarioNascimento/Mosaico-Card). Pistas, negociação e dedução nas versões Novo Testamento e Filmes e Séries.
- **Eita!:** [Página do projeto](https://eita.dragongames.dev.br/). Quiz em aliança para enfrentar o chefão; testes abertos.

Esses cards têm imagens locais em `brand/jogos/` e links para os sites dos jogos;
suas implementações não são copiadas nem alteradas neste repositório.

## Onde encontrar os arquivos

| Conteúdo | Pasta |
|---|---|
| Implementações por história e versão | [jogos/](jogos/README.md) |
| Entradas de escolha do portal | [historias/](historias/README.md) |
| Documentação técnica | [documentos/](documentos/README.md) |
| Roteiros, matrizes, imagens e modelos de referência | [desenvolvimento/](desenvolvimento/README.md) |
| Cópias substituídas e mapa de movimentações | [arquivo/](arquivo/README.md) |
| Marca e avatar | `brand/` |
| Verificações automáticas | `tests/` e `.github/` |

Os jogos estão em `jogos/<história>/<versão>/`. As entradas antigas preservam
os convites e os endereços usados pelo portal pessoal. A fonte de A Noite da
Casa fica em `desenvolvimento/casa-da-costa/a-noite/` e sua publicação em
`jogos/casa-da-costa/a-noite/`. Veja o [mapa de compatibilidade](jogos/compatibilidade.json).

## O voo da Dragon

> A tecnologia tece o seu próprio universo,  
> Na tela escura onde o código desperta.  
> A lógica fria em mágica se liberta,  
> E cada comando pulsa, feito um verso.  
>
> Linha por linha, eu construo um sonho,  
> De mundos invisíveis, de lendas e luz.  
> Um reino onde a imaginação nos conduz,  
> E a cada nova fase, a alma eu exponho.  
>
> Assim nasce a Dragon Games, forjada na chama,  
> Da paixão por jogar, de criar, de inovar.  
> Um portal infinito para quem ousa explorar,  
> Onde o herói se levanta e a aventura nos chama.  
>
> Deixo aqui o meu voo, a minha melhor arte,  
> O suor da rotina virando uma nova história.  
> Um pedaço de mim entregue à sua memória...  
> Espero que curta, e também faça parte...  

*Primavera de 2026*

---

## Registro anterior de manutenção — 12 de outubro de 2026

O catálogo apresenta três histórias do MOSAICO, Mosaico Card nas versões Novo Testamento e Filmes e Séries e Eita!. A Mesa e O Impostor são versões das duas primeiras histórias; VestChip tem somente O Impostor. Telão e opções de acesso ficam nas páginas de cada versão. Solo e A Noite permanecem como experiências complementares, sem card principal. Materiais históricos não são entradas atuais de jogo.

Para manutenção, consulte [o padrão de salas](documentos/PADRAO-SALA-MULTIPLAYER.md), [a separação entre modo, papel e camada](documentos/MOSAICO-ACESSIBILIDADE-PAPEIS.md) e [a segurança do Firebase](documentos/FIREBASE-SECURITY.md). A suíte de regras e integridade existe no repositório; ela não substitui partidas com pessoas, verificação de reconexão e teste de todas as perspectivas do mistério. A autoria conjunta de Mário César Nascimento e Osana Melo Nascimento permanece conforme [LICENSE.md](LICENSE.md).


**English** · [Português](#português)

Dragon Games is a home for deduction and investigation games. The first title is **MOSAICO — A Verdade é um Fragmento** ("The Truth Is a Fragment"), a distributed-deduction mystery for groups on smartphones, with an optional shared screen. No one holds all the facts: players observe, trade, negotiate and deduce.

**Catalog (access status shown for each game):** [dragongames.dev.br/](https://dragongames.dev.br/)

Proprietary project in development. The repository is public so that GitHub Pages can serve the game; it is **not** open source.

## Who it is for

- Groups of 1 to 12 people in the same room, each on their own phone.
- Game hosts who want to project the table on a TV or projector (optional).
- Players who want the preserved complementary Solo experience, outside the main catalog.

## What is available from the hub

| Game / story | Versions and access |
|---|---|
| **A Casa da Costa** | [A Mesa](https://casa-da-costa.dragongames.dev.br/a-mesa/) · [O Impostor](https://casa-da-costa.dragongames.dev.br/o-impostor/) |
| **A Manhã do Carro-Forte** | [A Mesa](https://carro-forte.dragongames.dev.br/a-mesa/) · [O Impostor](https://carro-forte.dragongames.dev.br/o-impostor/) |
| **O Eco do Amanhã — VestChip** | [O Impostor](https://eco-do-amanha.dragongames.dev.br/o-impostor/) only |
| **Mosaico Card** | [New Testament](https://mosaico-card.dragongames.dev.br/novo-testamento/) · [Movies and Series](https://mosaico-card.dragongames.dev.br/filmes-e-series/) |
| **Eita!** | [Alliance quiz](https://eita.dragongames.dev.br/) |

The shared-screen option is inside each A Mesa access page. Solo and A Noite are
preserved complementary experiences, listed in [jogos/README.md](jogos/README.md).

After the morning investigation, A Manhã do Carro-Forte continues into
[A Noite](jogos/a-manha-do-carro-forte/a-noite/), keeping the room code.

## How it works

- **One canonical reality per case.** Facts never change between sessions; what changes is the question asked about them (who, what, how much, when, where, how, why, what kind).
- **Fact is not interpretation.** A true fact may support a wrong reading. Doubt comes from possible relations between true facts, not from arbitrary false clues.
- **Characters are archetypes**, never proper names. A character stays secret, even from the player who performs it, until the reveal.
- **Sensory tasks** (pointing the phone, wiping a fogged glass, searching a dark room with a flashlight) are isolated HTML pages opened by the table.
- **Cognitive roles and support layers** (Free / Assisted / Guided) change the scaffolding, never the facts or the answer keys.

## Technology

Static HTML, CSS and JavaScript published on GitHub Pages; 3D and AR with three.js (WebXR on Android, the 8th Wall engine on iPhone); multiplayer rooms on Firebase (Firestore + Authentication: anonymous sign-in for players, Google sign-in for the host who opens a room), one Firebase project per case. A separate React/Vite client lives in `desenvolvimento/casa-da-costa/a-noite/`. Automated checks (`npm test`, `npm run test:regras`, and `typecheck`/`test` in `desenvolvimento/casa-da-costa/a-noite/`) run on GitHub Actions. Details in the Portuguese section.

## Authors, license and contact

**Created by** Mário César Nascimento and Osana Melo Nascimento. Maintained by [DrMarioNascimento](https://github.com/DrMarioNascimento).

**MOSAICO license:** see [LICENSE.md](LICENSE.md). Eita! is a separate project and follows [its own license](https://github.com/DrMarioNascimento/eita-quiz/blob/main/LICENSE.md), including public testing permissions.

---

## Português

**Dragon Games** — casa de jogos de dedução e investigação. O primeiro é o **MOSAICO — A Verdade é um Fragmento**.

**Página do projeto:** [dragongames.dev.br/](https://dragongames.dev.br/)

## Visão geral

> Jogo de dedução distribuída com experiências presenciais, multitelas e individuais. Projeto autoral proprietário em desenvolvimento.

O **MOSAICO** transforma uma realidade factual em informações fragmentadas entre os participantes. Ninguém recebe sozinho todos os fatos. Os jogadores observam, encenam, negociam, recordam, relacionam, interpretam, arriscam e deduzem.

Cada pessoa joga no próprio celular; um telão (TV ou projetor) é opcional. O repositório é público para que o GitHub Pages sirva o jogo — **não é código aberto** (ver [Licença](#autoria-licença-e-contato)).

## Acesso

O [portal Dragon Games](https://dragongames.dev.br/) apresenta:

| Jogo / história | Versões e acesso |
|---|---|
| **A Casa da Costa** | [A Mesa](https://casa-da-costa.dragongames.dev.br/a-mesa/) · [O Impostor](https://casa-da-costa.dragongames.dev.br/o-impostor/) |
| **A Manhã do Carro-Forte** | [A Mesa](https://carro-forte.dragongames.dev.br/a-mesa/) · [O Impostor](https://carro-forte.dragongames.dev.br/o-impostor/) |
| **O Eco do Amanhã — VestChip** | Somente [O Impostor](https://eco-do-amanha.dragongames.dev.br/o-impostor/) |
| **Mosaico Card** | [Novo Testamento](https://mosaico-card.dragongames.dev.br/novo-testamento/) · [Filmes e Séries](https://mosaico-card.dragongames.dev.br/filmes-e-series/) |
| **Eita!** | [Quiz em aliança](https://eita.dragongames.dev.br/) |

- Telão e opções de acesso ficam nas páginas de cada versão.
- Solo e A Noite continuam preservados como experiências complementares, fora do catálogo principal; consulte [jogos/README.md](jogos/README.md).
- A Noite do Carro-Forte é aberta ao fim da Manhã, com o mesmo código de sala e a continuidade da partida.
- As entradas antigas preservam convites, consultas e fragmentos. As duas imagens usadas em links anteriores do portal pessoal também permanecem disponíveis. Veja [jogos/compatibilidade.json](jogos/compatibilidade.json).

## Para quem

- Grupos de **1 a 12 pessoas** na mesma sala, cada uma com seu celular.
- Quem conduz a mesa (**Mestre**) e quer, opcionalmente, projetar código da sala, QR, cronologia, revelação e pódio num telão.
- Quem quer acessar a experiência complementar **Solo**, preservada fora do catálogo principal.

## O que tem

### A Casa da Costa — Celular (A Mesa)

HTML + Firebase. Telão opcional. QR na sala.

- **Com telão:** código, QR, cronologia, revelação, apuração e pódio.
- **Sem telão:** o criador joga no celular; os controles de mestre ficam em **Sala**.
- **Barra móvel:** **Caso | Sala | Arquivo** — rodada e cronologia; comandos do mestre; pistas privadas.
- **Ritmo**, escolhido na criação da sala: **Automaticamente** (avança quando todos terminam) ou **Com minha liberação**. Nos dois, o mestre pode pausar e retomar.
- Áudio de abertura em `jogos/casa-da-costa/a-mesa/audio/`. A sirene toca só no aparelho do mestre, para evitar eco entre os celulares.

**Fluxo:**

1. criação da sala e abertura;
2. apresentação — Entenda, Faça, Fale;
3. voto da cena;
4. **A Janela do Norte**;
5. **O Vidro Embaçado** ou **A Sala às Escuras** (alternam entre partidas);
6. encontro dos Fragmentos pela cor;
7. reconstrução coletiva;
8. mercado de pistas;
9. acusação;
10. revelação e pódio.

**Fragmentos:** Névoa, Tempestade, Farol e Noite. Com 1–3 pessoas, um único Fragmento; de 4 a 12, grupos de 2 ou 3, cada um com um Portador.

**Pontuação — máximo 100** (motor `jogos/casa-da-costa/a-mesa/js/mosaico-v5.js`):

| Componente | Máximo |
|---|---:|
| Tempo de resolução | 29 |
| Cooperação | 28 |
| Economia (mercado) | 20 |
| Qualidade da resolução | 13 |
| Rodadas sensoriais | 5 |
| Performance (apresentação) | 5 |

Pontos inteiros. O escore Z não entra no placar.

### A Casa da Costa — Telão

`telao.html?jogo=casa-da-costa`: tela somente de exibição, que entra com o código da sala aberta pelo Mestre.

### A Casa da Costa — Solo

Pasta própria ([`jogos/casa-da-costa/solo/`](jogos/casa-da-costa/solo)): adaptação individual da sequência canônica da Mesa, sem segunda realidade factual — caso, fragmentos, relações, perguntas e respostas vêm de `jogos/casa-da-costa/a-mesa/casos/casa-da-costa.json`. Ações que na Mesa dependem de várias pessoas viram decisão, revisão ou execução individual. O progresso fica vinculado ao usuário (`usuarios/{uid}` no Firestore). Não misturar com A Mesa.

### A Casa da Costa: O Impostor — em construção

Nova experiência sobre a mesma casa. No hub estão disponíveis:

- **Celular — Prólogo** ([`jogos/casa-da-costa/o-impostor/mesa.html`](jogos/casa-da-costa/o-impostor/mesa.html)): vídeo, maquete em RA, a chave, os papéis e o telefone;
- **Laboratório de RA** ([`jogos/casa-da-costa/o-impostor/`](jogos/casa-da-costa/o-impostor)): objetos do caso em 3D (relógio, livro, farol, quarto e outros) para ver no celular, sobre a mesa.

### A Manhã do Carro-Forte — Celular (A Mesa)

Partida coletiva e investigativa sobre uma única manhã num banco, com **seis perguntas-mãe** sobre a mesma realidade — entre elas *O Peso do Malote 41* —, cobrindo as naturezas QUANTO, QUANDO, O QUÊ/COMO, QUAL/QUE TIPO, QUEM (composto) e POR QUÊ. **A mesa não escolhe a pergunta: o sistema sorteia**, sem repetir nenhuma antes que as seis tenham saído.

1. prólogo — investigadores, ritmo e duração (Curta, Padrão ou Longa);
2. abertura audiovisual e pauta sorteada: pergunta-mãe, dossiê, campos e atividades;
3. atividades sensoriais próprias da pergunta, em fila;
4. dossiê em três terços;
5. hipótese provisória, com apoio e contraprova visíveis;
6. mosaico de relações;
7. decisão final nos campos próprios da pergunta;
8. revelação pelo corte daquela pergunta;
9. relatório em 100 pontos.

| Eixo | Máximo |
|---|---:|
| Campos da pergunta | 45 |
| Relações costuradas | 20 |
| Hipótese sustentada no fechamento | 15 |
| Leitura do dossiê | 10 |
| Atividades sensoriais | 10 |
| Revisão de hipótese | +5 |

> Os campos desta experiência pertencem à perspectiva específica da partida e não constituem um formulário universal do MOSAICO.

### A Manhã do Carro-Forte: O Impostor — em construção

A mesma manhã da Agência 0688, no modo impostor: o impostor não é um jogador, é o sistema, escondido num dos personagens. Tudo numa página, [`jogos/a-manha-do-carro-forte/o-impostor/mesa.html`](jogos/a-manha-do-carro-forte/o-impostor/mesa.html):

- **sozinho ou em grupo** (`?grupo=1`: gate Abrir mesa | Entrar, projeto `oimpostor-c30e0`, caseId `carro-forte-impostor`); os personagens sem jogador são conduzidos pelo sistema;
- **prólogo** com a planta de evacuação (desenhada a partir da maquete) e **Capítulos 1 a 8**, cada um com relógio, envios contados, debate em voz alta, perguntas com grau de certeza e aposta num número ou num personagem;
- **maquete em RA** a partir do Capítulo 1 (`maquete.js`, modelos em `modelos/`), abastecida com as peças de cada capítulo;
- **fechamento:** argumento de exclusão, estilo declarado, títulos, código e cartão de faro; no grupo, ranking, pódio e títulos da mesa.

### A Manhã do Carro-Forte — Telão, Solo e A Noite

- **Telão:** `telao.html?jogo=carro-forte`, somente exibição.
- **Solo:** a mesma página Celular em modo de ensaio (`?soloLab=1&bots=max&modo=sem-telao`): você ocupa uma vaga e as demais são preenchidas por bots de teste.
- **A Noite** (`jogos/a-manha-do-carro-forte/a-noite/`): fechamento com economia de fragmentos (comprar, capturar, arriscar). Aberta a partir da Manhã, herda a pergunta e um resumo do fecho; o orçamento inicial deriva do resultado da Manhã. Os valores econômicos da entrada avulsa ainda são experimentais. Detalhes em [`jogos/a-manha-do-carro-forte/a-noite/README.md`](jogos/a-manha-do-carro-forte/a-noite/README.md).

## Como funciona

### Essência canônica do MOSAICO

> **A perspectiva muda a pergunta. Não muda o que aconteceu.**

Cada história possui uma **realidade factual única e canônica**. Os fatos não são trocados, sorteados novamente ou contraditos para produzir replay. O que muda entre partidas é o **ângulo de análise**: a pergunta feita sobre a mesma realidade — **quem** articulou um acontecimento, **quanto** foi retirado, **quando** algo ocorreu, **o que aconteceu durante uma janela temporal**, **quem tinha acesso**, **qual foi o percurso de um objeto**, **por que** um personagem se atrasou, **qual decisão ou falha** tornou um evento possível.

Assim, **dedução não é sinônimo de descobrir culpado**. O modelo `autor → motivo → ação → prova → lacuna` é uma perspectiva possível, não um formulário universal. Os campos finais, as atividades e a própria natureza da resposta nascem da perspectiva de cada partida.

### Fato não é interpretação

**FATO → INTERPRETAÇÃO → RELAÇÃO → INFERÊNCIA**

Um fato prova apenas aquilo que efetivamente pode provar. Um pneu furado não torna ninguém automaticamente inocente nem culpado.

> **O MOSAICO deve explorar a distância entre aquilo que parece ter acontecido e aquilo que os fatos permitem concluir.**

> **No MOSAICO, um fato verdadeiro pode estar associado à interpretação errada.**

> **No MOSAICO, os jogadores constroem decisões com base nas evidências disponíveis. Novas evidências podem alterar a interpretação sem alterar nenhum fato já revelado.**

A dúvida deve surgir preferencialmente de relações possíveis entre fatos verdadeiros — coexistência × causalidade, presença × participação, oportunidade × autoria, coincidência × planejamento — e não de *red herrings* arbitrariamente falsos. Nem todo acontecimento precisa ter relação com a pergunta principal: **o mundo da história é maior do que o mistério investigado.** A surpresa deve ser retrospectivamente justa: ao final, o jogador deve poder reconhecer que os fatos necessários já estavam disponíveis.

### Fatos são do universo; pistas são da perspectiva

Um mesmo fato pode ser central numa partida, complementar em outra, gerar dúvida numa terceira e ser incidental numa quarta. Sua verdade não muda; muda sua relevância diante da pergunta. Por isso a mesma realidade sustenta várias partidas.

> **Conhecer uma resposta não significa conhecer a história inteira.**

### Regra de criação

`REALIDADE CANÔNICA → PERSPECTIVA → PERGUNTA → FRAGMENTOS → RELAÇÕES → INFERÊNCIA → DECISÃO`

A criação não começa por "quais são os cinco campos?" nem por "qual atividade ainda não usamos?". Mecânica, campos, economia, risco e pontuação servem ao tipo de raciocínio exigido pela perspectiva.

**No MOSAICO, a verdade não precisa mudar para que a experiência mude.**

### Pergunta-mãe e natureza da incógnita

A pergunta da partida é também a **venda psicológica da experiência**: diz com precisão o que se procura, sem revelar o caminho, e provoca uma hipótese antes de todos os fragmentos estarem disponíveis. A incógnita não precisa ser uma pessoa:

- **QUEM** — pessoa, grupo, papel funcional ou cadeia de papéis;
- **O QUÊ** — evento, objeto, ação, informação, estado ou natureza da ocorrência;
- **QUANTO** — valor, quantidade, duração, diferença ou magnitude;
- **ONDE** — origem, destino, posição, percurso ou local;
- **QUANDO** — momento, janela crítica, ordem ou sincronização;
- **COMO** — processo, mecanismo, percurso ou modo de execução;
- **POR QUÊ** — finalidade, motivo, causa explicativa ou razão de uma escolha;
- **QUAL / QUE TIPO** — classificação ou natureza correta de um fenômeno.

A própria ocorrência pode estar em dúvida: "a joia não está na caixa" não prova furto; "há diferença no caixa" não prova roubo.

Em perguntas **QUEM**, é obrigatório definir a relação procurada: quem decidiu, ordenou, iniciou, coordenou, executou, sabia, ocultou, poderia impedir ou esteve presente. A partida pode investigar uma posição ou a cadeia completa — `MANDANTE / CONTRATANTE → INTERMEDIÁRIO → EXECUTOR`. Identificar o executor não resolve quem ordenou; identificar quem tinha interesse não prova quem executou.

Os **campos de resolução não são universais**: **os campos nascem da pergunta.**

Uma boa pergunta-mãe deve:

1. criar uma lacuna informacional clara;
2. prometer uma resposta demonstrável;
3. ter consequência narrativa;
4. não entregar a solução;
5. fazer o jogador formular uma hipótese cedo;
6. ser sustentada pela realidade canônica e pelas relações entre evidências.

### Personagens e elenco

- Personagens são apresentados por **arquétipos e funções**, nunca por nomes próprios, e sem marcação obrigatória de gênero; a entrada oferece forma masculina, feminina ou indiferente.
- O personagem é segredo **inclusive para quem o interpreta**, até o fim de sua vez. Antes da vez da pessoa, a interface não anuncia a surpresa.
- Durante o mistério, o telão mostra apenas o arquétipo; o nome do jogador volta no placar final.
- Nenhum README, commit ou material público deve revelar soluções de casos.

### Modo · Papel · Camada

Fluxo: hub → caso → **Celular / Telão / Solo**. Em Celular e Solo, cada aparelho escolhe um **papel cognitivo** e uma **camada** (Livre / Assistida / Guiada). Implementação: `papel-camada.js` — ver `MOSAICO-ACESSIBILIDADE-PAPEIS.md` §14.

**Hipóteses por camada:** as mesmas chaves de hipótese e decisão valem em Livre, Assistida e Guiada; a camada só muda o andaime (`hipoteses-por-camada.js` + §14.1–14.2). Assistida e Guiada persistem A/B/C, favor/contra e "não examinada"; o placar mostra métricas de **processo**, sem spoiler, sem probabilidades nem ranking de solução.

### Atividades sensoriais

Cada atividade exige um gesto próprio, sem atalho: apontar o aparelho (**A Janela do Norte**; sem bússola, a roda é girada com o dedo), passar o dedo sobre o vidro (**O Vidro Embaçado**) ou procurar com o facho de luz (**A Sala às Escuras**).

- **A Casa da Costa:** cada tarefa é um HTML isolado, embutido por `iframe` (`?embed=1`), que recebe pela URL a semente e o identificador da execução (`s`, `run`) e devolve à Mesa por `postMessage` apenas o tempo de conclusão, validado contra esse identificador.
- **A Manhã do Carro-Forte:** as atividades recebem pela URL o lote de fragmentos da partida e devolvem o que a mesa alcançou; o que ficar para trás não entra no dossiê. O texto de um fragmento não existe na página antes de ser alcançado.

## Tecnologia

- **HTML, CSS e JavaScript estáticos**, publicados pelo GitHub Pages, sem etapa de build (exceto o cliente `desenvolvimento/casa-da-costa/a-noite/`).
- **Firebase** (Firestore + Authentication), carregado por CDN. Jogadores entram com login anônimo; quem **abre** a sala entra com Google e precisa constar em `config/mestres` do projeto correspondente. O gate de sala (Abrir mesa | Entrar) é compartilhado em `firebase-room.js`.
- **Um projeto Firebase por caso**: `mosaico-game` (A Casa da Costa) e `mosaico-noite` (A Manhã do Carro-Forte), com coleções de sala `mosaico/{codigo}` e `noite/{codigo}`; os dois jogos no modo impostor usam `oimpostor-c30e0`, separados pelo caseId da sala (regras em `jogos/casa-da-costa/o-impostor/firestore-impostor.rules`). Ver `FIREBASE-SECURITY.md`, `FIREBASE-ISOLAMENTO.md` e `FIREBASE-NOITE.md`.
- **QR code** gerado localmente (`jogos/casa-da-costa/a-mesa/js/qr.js`), sem serviço externo.
- **3D e RA** com three.js (cópias locais) e, no laboratório de RA de O Impostor, o componente `<model-viewer>` por CDN. A RA das maquetes usa WebXR no Android e, no iPhone, o motor 8th Wall (Niantic Spatial), baixado do CDN só quando a RA é aberta, com a atribuição exigida pela licença dele nas páginas que o usam.

O `firebaseConfig` presente no HTML é público por natureza; a proteção dos dados depende das regras do Firestore (`firestore.rules`).

## Estrutura (manutenção)

| Caminho | Conteúdo |
|---|---|
| `index.html` | hub Dragon Games |
| `telao.html` | Telão dos dois casos (`?jogo=casa-da-costa` / `?jogo=carro-forte`) |
| `firebase-room.js` · `firebase-user.js` | gate de sala compartilhado · sessão do usuário (Solo) |
| `papel-camada.js` · `hipoteses-por-camada.js/.json` | papéis cognitivos, camadas e hipóteses por camada |
| `jogos/casa-da-costa/a-mesa/MOSAICO-mesa.html` | A Casa da Costa — Celular (interface, fluxo, Firebase) |
| `jogos/casa-da-costa/a-mesa/casos/casa-da-costa.json` | caso canônico da Casa da Costa |
| `jogos/casa-da-costa/a-mesa/js/mosaico-v5.js` | motor de pontuação V5 |
| `jogos/casa-da-costa/a-mesa/js/tarefa-sensor.js` | protocolo das tarefas sensoriais |
| `jogos/casa-da-costa/a-mesa/MOSAICO-26-*.html` | Janela do Norte, Vidro Embaçado, Sala às Escuras |
| `jogos/casa-da-costa/a-mesa/AC-*.html` | módulos auxiliares da Casa (percurso, maquete, papéis, escrivaninha, RA) |
| `jogos/casa-da-costa/a-mesa/sw.js` | service worker — desligado |
| `jogos/casa-da-costa/solo/` | A Casa da Costa — Solo |
| `jogos/casa-da-costa/o-impostor/` | O Impostor: Prólogo (`mesa.html`), laboratório de RA, modelos 3D, mídia |
| `jogos/a-manha-do-carro-forte/a-mesa/` | A Manhã do Carro-Forte — Celular (`celular.html`, `game.js`, `fragmentos.js`, atividades) |
| `jogos/a-manha-do-carro-forte/a-noite/` | A Noite do Carro-Forte |
| `jogos/a-manha-do-carro-forte/o-impostor/` | A Manhã do Carro-Forte: O Impostor — mesa (`mesa.html`), maquete em RA (`maquete.js`, `modelos/`), mídia e bonecos de contato |
| `jogos/o-eco-do-amanha/o-impostor/` | O Eco do Amanhã — VestChip, somente O Impostor |
| `desenvolvimento/casa-da-costa/a-noite/` · `jogos/casa-da-costa/a-noite/` | cliente React/Vite de A Noite da Casa da Costa (fonte) · build publicado |
| `casos/` | material de histórias em desenvolvimento |
| `ferramentas/` | bancadas de economia e duração, teste das regras, laboratório de bots |
| `tests/` | testes automatizados da raiz |
| `firestore.rules` · `.firebaserc` · `firebase.json` | regras e aliases Firebase (`mesa` → `mosaico-game`, `noite` → `mosaico-noite`) |
| `brand/` | marca Dragon Games |
| `documentos/HANDOFF.md` | documento de passagem e continuidade |
| `documentos/MOSAICO-ACESSIBILIDADE-PAPEIS.md` · `documentos/PADRAO-SALA-MULTIPLAYER.md` · `documentos/OVERLAP-DECISOES.md` | normas de papéis, de sala multiplayer e de sobreposição |

### A Noite da Casa da Costa (`desenvolvimento/casa-da-costa/a-noite/` → `jogos/casa-da-costa/a-noite/`)

A Mesa (`jogos/casa-da-costa/a-mesa/`) e A Noite (`desenvolvimento/casa-da-costa/a-noite/`, publicada em `jogos/casa-da-costa/a-noite/`) são **experiências distintas**: possuem fluxos próprios, mas compartilham componentes e algumas mídias. O cliente publicado de A Noite da Casa configura `mosaico-game`, como A Mesa, usando a coleção `noite` para as salas noturnas. O build em `jogos/casa-da-costa/a-noite/` **não é porta de produção** — o hub e o redirect `casa-da-costa/` não apontam para ele.

```bash
cd desenvolvimento/casa-da-costa/a-noite
npm install
npm run dev        # desenvolvimento (abrir no celular por HTTPS — sem HTTPS o iPhone bloqueia o giroscópio)
npm run publicar   # build de Pages e cópia limpa para jogos/casa-da-costa/a-noite/
```

- Nada se escreve à mão em `jogos/casa-da-costa/a-noite/`: a pasta é apagada inteira a cada publicação. Arquivos que precisam chegar lá moram em `desenvolvimento/casa-da-costa/a-noite/public/`.
- No Pages o roteador anda por hash (`.../jogos/casa-da-costa/a-noite/#/noite`); para mandar alguém a uma rota, use `.../jogos/casa-da-costa/a-noite/?ir=noite`.
- Caminho de mídia em JavaScript nunca começa com `/` (o site mora em `/Dragon/jogos/casa-da-costa/a-noite/`): use `import.meta.env.BASE_URL`.

### Testes e CI

Na raiz:

```bash
npm install
npm test               # motor, QR, caso sincronizado, fluxos e integridade (sem emulador)
npm run test:regras    # regras do Firestore no emulador (requer Java)
npm run test:tudo      # as duas verificações em sequência
npm run economia       # bancada da economia do mercado
npm run duracao        # bancada da duração sensorial
```

Em `desenvolvimento/casa-da-costa/a-noite/`:

```bash
cd desenvolvimento/casa-da-costa/a-noite
npm install
npm run typecheck
npm test
```

O GitHub Actions (`.github/workflows/ci.yml`, Node 24) roda três verificações a cada push, pull request ou disparo manual: `npm test`; `npm run test:regras` no emulador do Firestore (Java 17); e `typecheck` + `test` de `desenvolvimento/casa-da-costa/a-noite/`.

### Publicação das regras

```bash
firebase deploy --only firestore:rules -P mesa    # A Casa da Costa (mosaico-game)
firebase deploy --only firestore:rules -P noite   # A Manhã do Carro-Forte (mosaico-noite)
```

Quando a alteração valer para os dois casos, publique nos dois projetos.

### Antes de mudar regra, narrativa ou pontuação

> **Tudo se adapta, nada se perde.**

Consultar este README, `HANDOFF.md` e o histórico Git. Ao criar uma nova perspectiva, preservar a realidade factual e redefinir a pergunta antes de definir campos ou atividades. Uma nova história não copia automaticamente a estrutura de acusação de outro caso: nasce da sua pergunta e dos seus campos.

## Autoria, licença e contato

**Concepção e autoria:** Mário César Nascimento e Osana Melo Nascimento  
**Manutenção e publicação:** [DrMarioNascimento](https://github.com/DrMarioNascimento)

**Licença MOSAICO:** ver [LICENSE.md](LICENSE.md) (todos os direitos reservados; testes internos limitados aos titulares e colaboradores autorizados; demais usos dependem de autorização prévia e escrita). A visibilidade pública do repositório não autoriza copiar, adaptar, redistribuir, comercializar, treinar IA ou criar obra derivada.

**Contato:** pelo perfil [github.com/DrMarioNascimento](https://github.com/DrMarioNascimento).

---

**Prof. Mário César Nascimento, PhD ©**

## Recursos educacionais públicos

Simuladores de Fisiologia, Casos Éticos 1 e 2, Bonde, laboratórios de pesquisa e outros acessos estão reunidos no [portal do autor](https://www.drmarionascimento.com.br/#acesso-publico). O catálogo Dragon não substitui a licença de cada obra.
