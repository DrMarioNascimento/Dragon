# Dragon Games

Casa de jogos. O primeiro é o **MOSAICO**.

**Entrar:** [drmarionascimento.github.io/Dragon/](https://drmarionascimento.github.io/Dragon/)

---

# MOSAICO — A Verdade é um Fragmento

> Jogo de dedução distribuída com experiências presenciais, multitelas e individuais. Projeto autoral proprietário em desenvolvimento.

O **MOSAICO** transforma uma realidade factual em informações fragmentadas entre os participantes. Ninguém recebe sozinho todos os fatos. Os jogadores observam, encenam, negociam, recordam, relacionam, interpretam, arriscam e deduzem.

**Entrar:** [drmarionascimento.github.io/Dragon/](https://drmarionascimento.github.io/Dragon/)

O hub segue o recorte visual do [Learning-lab](https://github.com/DrMarioNascimento/Learning-lab), com a paleta da noite.

## Essência canônica do MOSAICO

> **A perspectiva muda a pergunta. Não muda o que aconteceu.**

Cada história possui uma **realidade factual única e canônica**. Os fatos não são trocados, sorteados novamente ou contraditos para produzir replay. O que muda entre partidas é o **ângulo de análise**: a pergunta feita sobre a mesma realidade.

Uma partida pode perguntar **quem** articulou um acontecimento; outra, **quanto** foi retirado; outra, **quando** determinada ação ocorreu; outra, **o que aconteceu durante uma janela temporal**; outra, **quem tinha acesso**; outra, **qual foi o percurso de um objeto**; outra, **por que um personagem se atrasou**; outra, **qual decisão ou falha tornou um evento possível**.

Assim, **dedução não é sinônimo de descobrir culpado**. O modelo `autor → motivo → ação → prova → lacuna` é uma perspectiva possível, não um formulário universal do MOSAICO. Os campos finais, as atividades e a própria natureza da resposta devem nascer da perspectiva específica de cada partida.

### Fato não é interpretação

O jogo distingue:

**FATO → INTERPRETAÇÃO → RELAÇÃO → INFERÊNCIA**

Um fato prova apenas aquilo que efetivamente pode provar. Se o pneu de um personagem furou, por exemplo, isso não o torna automaticamente inocente nem culpado. O pneu pode ter furado independentemente de sua participação ou não em outro acontecimento.

> **O jogo não engana artificialmente o jogador. O jogador pode interpretar errado um fato verdadeiro.**

Por isso, a dúvida deve surgir preferencialmente de relações possíveis entre fatos verdadeiros — coexistência × causalidade, presença × participação, oportunidade × autoria, coincidência × planejamento — e não de *red herrings* arbitrariamente falsos.

Nem todo acontecimento precisa ter relação com a pergunta principal. Uma pessoa pode caminhar com seu cachorro diante do banco e isso simplesmente ter acontecido. **O mundo da história é maior do que o mistério investigado.**

### Fatos são do universo; pistas são da perspectiva

Um mesmo fato pode ser central em uma partida, complementar em outra, gerar dúvida em uma terceira e ser incidental em uma quarta. Sua verdade não muda; muda sua relevância diante da pergunta.

Isso permite que a mesma manhã sustente várias partidas sem trocar a realidade. Conhecer quem articulou um crime não significa saber quanto saiu, o que ocorreu durante uma janela de 87 segundos, qual foi o percurso de um objeto ou por que determinado procedimento falhou.

> **Conhecer uma resposta não significa conhecer a história inteira.**

### Regra de criação

Antes de criar ou revisar uma partida, seguir esta ordem conceitual:

`REALIDADE CANÔNICA → PERSPECTIVA → PERGUNTA → FRAGMENTOS → RELAÇÕES → INFERÊNCIA → DECISÃO`

A criação não deve começar por “quais são os cinco campos?” nem por “qual atividade ainda não usamos?”. A mecânica, os campos, a economia, o risco e a pontuação devem servir ao tipo de raciocínio exigido pela perspectiva.

**No MOSAICO, a verdade não precisa mudar para que a experiência mude.**

---

## Catálogo jogável

| Experiência | Pasta | Jogar |
|---|---|---|
| **A Mesa — A Casa da Costa** | [`v1/`](./v1) | [Abrir a mesa](https://drmarionascimento.github.io/Dragon/v1/MOSAICO-mesa.html) |
| **A Noite — A Casa da Costa** | [`mosaico-web/`](./mosaico-web) (código) · [`v2/`](./v2) (site) | [Abrir a noite](https://drmarionascimento.github.io/Dragon/v2/) |
| **Modo Solo — A Casa da Costa** | [`solo/`](./solo) | [Jogar sozinho](https://drmarionascimento.github.io/Dragon/solo/) |
| **A Mesa — A Manhã do Carro-Forte** | [`carro-forte/`](./carro-forte) | [Iniciar investigação](https://drmarionascimento.github.io/Dragon/carro-forte/) |

O endereço antigo [`MOSAICO-mesa.html`](./MOSAICO-mesa.html) redireciona para **A Mesa — A Casa da Costa**.

**Casos:** *A Casa da Costa* · *A Manhã do Carro-Forte*<br>
**Participantes:** Casa da Costa: 1 a 12 · Carro-Forte: 2, 3, 4 ou 6<br>
**Situação:** experiências jogáveis em evolução e playtest

## Autoria

**Concepção:** Mário César Nascimento e Osana Melo Nascimento  
**Perfil:** [DrMarioNascimento](https://github.com/DrMarioNascimento)

---

## A Mesa — A Casa da Costa

HTML + Firebase. Telão opcional. QR na sala.

- **Com telão:** código, QR, cronologia, revelação, apuração e pódio.
- **Sem telão:** o criador joga no celular; os controles de mestre ficam em **Sala**.

Áudio canônico em `v1/audio/`. Sirene e anúncios só no aparelho do mestre. `encerramento.mp3` entre acusação e revelação.

### Barra móvel

**Caso | Sala | Arquivo** — rodada e cronologia; comandos do mestre; pistas privadas.

### Ritmo

Na criação da sala: **Automaticamente** (avança quando todos terminam) ou **Com minha liberação**. Nos dois, o mestre pode pausar e retomar.

### Fluxo

1. criação da sala e abertura  
2. Encenação — Entenda, Faça, Fale  
3. voto da cena  
4. **A Janela do Norte**  
5. **O Vidro Embaçado** ou **A Sala às Escuras**  
6. encontro dos Fragmentos pela cor  
7. reconstrução coletiva  
8. mercado de pistas  
9. acusação  
10. revelação e pódio  

Fragmentos: Névoa, Tempestade, Farol, Noite. Cronômetro dourado na formação. 1–3 pessoas = um Fragmento, todos Portadores. 4–12 = grupos de 2 ou 3, um Portador sorteado.

### Pontuação — máximo 100

| Componente | Técnico | Máximo |
|---|---|---:|
| Encenação | Performance | 5 |
| J × J | Tempo | 32 |
| J + J | Cooperação | 30 |
| Mercado | Economia | 20 |
| Caso | Qualidade | 13 |

Pontos inteiros. O escore Z não entra no placar.

### Arquitetura da mesa

| Arquivo | Responsabilidade |
|---|---|
| `v1/MOSAICO-mesa.html` | interface, fluxo, Firebase |
| `v1/casos/casa-da-costa.json` | caso piloto |
| `v1/js/mosaico-v5.js` | pontuação |
| `v1/js/qr.js` | QR local |
| `v1/js/tarefa-sensor.js` | protocolo das lanternas |
| `v1/MOSAICO-26-a-janela-do-norte.html` | janela |
| `v1/MOSAICO-26-vidro-embacado.html` | vidro |
| `v1/MOSAICO-26-a-sala-as-escuras.html` | sala escura |
| `firestore.rules` | autorização (raiz) |
| `v1/sw.js` | cache — desligado |
| `tests/` | motor, QR, caso, regras |
| `FIREBASE-SECURITY.md` | segurança |
| `HANDOFF.md` | continuidade |

```bash
npm install
npm test
```

O motor, o QR e a sincronia `v1/casos/casa-da-costa.json` ↔ HTML rodam sem
emulador. As regras do Firestore precisam do emulador (`npm run test:regras`).
Para executar as duas verificações em sequência, use `npm run test:tudo`.

---

## A Noite — A Casa da Costa

App em [`mosaico-web/`](./mosaico-web) (React / Vite). **Não substitui A Mesa.**

- criação da mesa: **noite curta** (~20 min) ou **noite cheia** (~40 min)
- QR na sala
- encene, lanternas, procura da cor, foto partida (encaixe), tarja no ímpar
- acusação em três linhas, a casa reparte o campo
- cronômetro âmbar com glow; a casa vira sozinha
- arquétipo (emoji) em vez de nome de personagem na porta

O GitHub Pages serve o build estático em [`v2/`](https://drmarionascimento.github.io/Dragon/v2/). Código-fonte: [`mosaico-web/`](./mosaico-web).

```bash
cd mosaico-web && MOSAICO_PAGES=1 npx vite build
# copiar dist/client para ../v2/, e depois, dentro de v2/:
#   cp _shell.html index.html   — a casca do roteador é a página de entrada
#   cp _shell.html 404.html
#   touch .nojekyll             — senão o Pages ignora /__grok e afins
```

No Pages o roteador anda por hash (`.../v2/#/noite`): só existe arquivo na
raiz do app, então endereço de rota digitado à mão devolve 404. Quem precisa
mandar alguém para uma rota manda `.../v2/?ir=noite`.

Caminho de mídia em JavaScript nunca começa com `/`: o site mora em
`/Dragon/v2/`, e `"/media/foto.jpg"` cai na raiz do domínio. O Vite reescreve
a base dentro do CSS, mas não dentro de string — use `import.meta.env.BASE_URL`.

---

## Modo Solo — A Casa da Costa

Pasta **própria**. Não misturar com A Mesa nem com A Noite. Não é o arquivo `v3.ts` de A Noite.

Cada pista nasce em quatro fragmentos. Só a carta inteira entra no mosaico.

- pasta: [`solo/`](./solo) → [solo/](https://drmarionascimento.github.io/Dragon/solo/)

O endereço antigo [`v3/`](./v3) redireciona para o modo solo.

---

## A Mesa — A Manhã do Carro-Forte

Experiência jogável em HTML, CSS e JavaScript, sem dependência de Firebase. Os
investigadores alternam perspectivas no mesmo dispositivo e montam Fragmentos
rotacionáveis sob pressão de tempo.

### Fluxo

1. prólogo e oito fragmentos narrativos
2. montagem das perspectivas distribuídas
3. três rodadas de investigação: observar, cruzar e autenticar
4. Hipótese I
5. Mercado Cego
6. Mosaico coletivo e escolha da rota probatória
7. dedução final nos campos próprios desta perspectiva
8. revelação modular e placar fechado em 100 pontos

> Os campos desta experiência pertencem à perspectiva específica da partida e não constituem um formulário universal do MOSAICO.

### Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| `carro-forte/index.html` | estrutura e telas do jogo |
| `carro-forte/styles.css` | identidade visual, profundidade e responsividade |
| `carro-forte/game.js` | estado, quebra-cabeça, investigação e pontuação |
| `carro-forte/assets/` | cenas das seis perspectivas |
| `carro-forte/tiles/` | imagens do card no catálogo |
| `carro-forte/README.md` | documentação específica do caso |

O estado da partida é salvo localmente pelo navegador. A Noite e o Modo Solo
de A Manhã do Carro-Forte ainda não estão publicados.

---

## Estado

- **A Casa da Costa:** A Mesa, A Noite e Modo Solo jogáveis.
- **A Manhã do Carro-Forte:** A Mesa jogável; A Noite e Modo Solo em construção.

> **Tudo se adapta, nada se perde.**

Antes de mudar regra, narrativa ou pontuação: consultar este README, `HANDOFF.md` e o histórico Git. Ao criar uma nova perspectiva, preservar a realidade factual e redefinir a pergunta antes de definir campos ou atividades.

## Licença e uso

Repositório público para consulta e GitHub Pages — **não é código aberto**. A visibilidade não autoriza copiar, adaptar, redistribuir, comercializar, treinar IA ou criar obra derivada. Ver [Licença Proprietária](LICENSE.md).

---

**Prof. Mário César Nascimento, PhD ©**
