# Dragon Games

Casa de jogos. O primeiro é o **MOSAICO**.

**Entrar:** [drmarionascimento.github.io/Dragon/](https://drmarionascimento.github.io/Dragon/)

---

# MOSAICO — A Verdade é um Fragmento


> Jogo de dedução distribuída com experiências presenciais, multitelas e individuais. Projeto autoral proprietário em desenvolvimento.

O **MOSAICO** transforma um caso em informações fragmentadas entre os participantes. Ninguém recebe sozinho todos os fatos. Os jogadores encenam, apontam, cooperam e acusam.

**Entrar:** [drmarionascimento.github.io/Dragon/](https://drmarionascimento.github.io/Dragon/)

O hub segue o recorte visual do [Learning-lab](https://github.com/DrMarioNascimento/Learning-lab), com a paleta da noite.

## Catálogo jogável

| Caso | Versão | Pasta | Jogar |
|---|---|---|---|
| **A Casa da Costa** | A mesa | [`v1/`](./v1) | [Abrir a mesa](https://drmarionascimento.github.io/Dragon/v1/MOSAICO-mesa.html) |
| **A Casa da Costa** | A noite | [`mosaico-web/`](./mosaico-web) (código) · [`v2/`](./v2) (site) | [Abrir a noite](https://drmarionascimento.github.io/Dragon/v2/) |
| **A Casa da Costa** | Modo solo | [`solo/`](./solo) | [Jogar sozinho](https://drmarionascimento.github.io/Dragon/solo/) |
| **A manhã do Carro-Forte** | A mesa | [`carro-forte/`](./carro-forte) | [Iniciar investigação](https://drmarionascimento.github.io/Dragon/carro-forte/) |

O endereço antigo [`MOSAICO-mesa.html`](./MOSAICO-mesa.html) redireciona para a mesa (v1).

**Casos:** *A Casa da Costa* · *A manhã do Carro-Forte*<br>
**Participantes:** Casa da Costa: 1 a 12 · Carro-Forte: 2, 3, 4 ou 6<br>
**Situação:** experiências jogáveis em evolução e playtest

## Autoria

**Concepção:** Mário César Nascimento e Osana Melo Nascimento  
**Perfil:** [DrMarioNascimento](https://github.com/DrMarioNascimento)

---

## A manhã do Carro-Forte — A mesa

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
7. dedução final em cinco campos
8. revelação modular e placar fechado em 100 pontos

### Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| `carro-forte/index.html` | estrutura e telas do jogo |
| `carro-forte/styles.css` | identidade visual, profundidade e responsividade |
| `carro-forte/game.js` | estado, quebra-cabeça, investigação e pontuação |
| `carro-forte/assets/` | cenas das seis perspectivas |
| `carro-forte/tiles/` | imagens do card no catálogo |
| `carro-forte/README.md` | documentação específica do caso |

O estado da partida é salvo localmente pelo navegador. A noite e o modo solo
do Carro-Forte ainda não estão publicados.

---

## Versão 1 — A mesa

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

### Pontuação V5 — máximo 100

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

## Versão 2 — A noite

App em [`mosaico-web/`](./mosaico-web) (React / Vite). **Não substitui a mesa.**

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

## Modo solo

Pasta **própria**. Não misturar com a mesa nem com a noite. Não é o arquivo `v3.ts` da noite.

Cada pista nasce em quatro fragmentos. Só a carta inteira entra no mosaico.

- pasta: [`solo/`](./solo) → [solo/](https://drmarionascimento.github.io/Dragon/solo/)

O endereço antigo [`v3/`](./v3) redireciona para o modo solo.

---

## Estado

- **A Casa da Costa:** mesa, noite e modo solo jogáveis.
- **A manhã do Carro-Forte:** versão A mesa jogável; noite e solo em construção.

> **Tudo se adapta, nada se perde.**

Antes de mudar regra, narrativa ou pontuação: `HANDOFF.md` e o histórico Git.

## Licença e uso

Repositório público para consulta e GitHub Pages — **não é código aberto**. A visibilidade não autoriza copiar, adaptar, redistribuir, comercializar, treinar IA ou criar obra derivada. Ver [Licença Proprietária](LICENSE.md).

---

**Prof. Mário César Nascimento, PhD ©**
