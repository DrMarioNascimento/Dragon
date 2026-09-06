# MOSAICO — A Noite · A Manhã do Carro-Forte

Primeira implementação do **Captura** como versão noturna de **A Manhã do Carro-Forte**.

**Entrada:** `index.html`

**URL:** https://drmarionascimento.github.io/Dragon/carro-forte/noite/

## Continuidade Manhã → Noite (Noite rica)

Deep link: `?from=celular&sala=CODIGO&pergunta=peso` (ids: peso, janela, roubo, antes, quem, proteger).

A Manhã grava em `mosaico/{sala}` (projeto **mosaico-noite**). A ponte (`celular-para-noite.js`) semeia `noite/{sala}` com:

- `partida.pergunta` congelada;
- `partida.origem = celular` + `partida.continuidade`;
- `partida.handoff` — payload rico (schema v1) para refresh/rejoin.

O lobby mostra o cartão **CONTINUIDADE · MANHÃ → NOITE** com pergunta e resumo curto do fecho. Solo/offline guarda o mesmo payload em `sessionStorage` (`mosaico-carro-handoff:…`).

**Entrada avulsa** (sem `from=celular`) permanece válida: marcada como *partida só de fechamento*, economia experimental legada.

### Campos do handoff (v1)

| Campo | Uso |
|---|---|
| `v` | versão do schema (`1`) |
| `from` | sempre `celular` |
| `pergunta` / `sala` | continuidade de sessão |
| `jogadores` / `nomes` | quem jogou a manhã |
| `fecho` | eixos de `pontuar()` (`total`, `campos`, `hipotese`, `relacoes`, `leitura`, `sensorial`, `revisao`, `acertos`) |
| `hipoteseFinal` / `hipoteseProv` | decisão da Manhã (H1–H10), sem spoiler canônico |
| `fragmentosRevelados` | ids `Fxx` revelados/marcados — banner + **semente do baralho Captura** (via `MANHA_PARA_CAPTURA`) |
| `emMs` | carimbo do handoff |

### Economia / Captura — regra v1.1

Leitura do código: **Arriscar** devolve as 3 moedas no acerto; o orçamento paga erros, **Comprar (4)** e **Capturar (2)**. O ciclo exploratório mínimo (falha + compra + captura) custa **9** — por isso o piso/teto subiram face à v1 (8–12 → 9–13).

Quando a Noite abre com `from=celular` e o handoff traz `fecho.total`:

- **moedas** = `clamp(9 + floor(total / 25), 9, 13)`
- **mão inicial** = `2` se `total < 40`, senão `3`

Sem fecho numérico (só deep link antigo): semente justa **10 moedas · 3 fragmentos**.
Entrada standalone: **12 moedas · 3 fragmentos** (experimental legado).
Custos de Arriscar (3) / Capturar (2) / Comprar (4) **não mudam**. A pontuação da Manhã não é reescrita — só escala o orçamento inicial do fechamento.

### Semente de fragmentos (Captura)

Quando `from=celular` e o handoff traz `fragmentosRevelados`:

1. Cada id `Fxx` da Manhã mapeia para um cartão condensado `Fx` (`MANHA_PARA_CAPTURA` em `celular-para-noite-contrato.mjs`).
2. `seedCapturaDeck` monta o baralho como `shuffle(semeados) + shuffle(resto)`.
3. A mão inicial e o pool de compra saem do topo — a mesa joga em torno do que a manhã revelou (ids + rótulos no log/banner).

Standalone (sem `from=celular`) e ponte sem fragmentos: baralho padrão embaralhado por completo.

## Enquadramento narrativo

Após um dia inteiro de levantamento de evidências, o grupo se reúne para consolidar o dossiê antes do encerramento do caso.

> **A manhã aconteceu. A noite decide o que ela significou.**

Os fatos são verdadeiros; as interpretações ainda estão em disputa. Cada partida seleciona uma pergunta diferente sobre a mesma realidade canônica.

## Perguntas implementadas

1. **O Peso do Malote 41** — QUANTO + QUANDO
2. **Os 87 Segundos** — O QUÊ + COMO
3. **Foi um roubo?** — QUAL / QUE TIPO
4. **Antes das 8h02** — QUANDO
5. **Quem construiu a janela?** — QUEM COMPOSTO
6. **O que estava sendo protegido?** — POR QUÊ

## Ritmo

- **Sob pressão:** 30 s por mão
- **Calma:** 60 s por mão

## Mecânica inicial implementada

- carteira individual;
- mão de fragmentos;
- estado público dos outros dossiês;
- **Comprar** fragmento da mesa;
- **Capturar** fragmento de outro dossiê, com transferência sem clonagem;
- **Arriscar** resposta de um campo;
- acerto trava o campo para a mesa e devolve o custo;
- erro queima o campo apenas para o jogador;
- tabela de pontuação consultável em modal, sem ranking ao vivo.

Os valores econômicos da entrada **avulsa** continuam **experimentais**. Na **Noite rica** (`from=celular`), o orçamento inicial segue a regra v1.1 acima — playável e ligada ao fecho da manhã, ainda não o balanceamento final do Captura.

## Identidade visual

A Noite reutiliza a linguagem de **A Mesa — A Manhã do Carro-Forte**: azul-petróleo, cinza, papel, ouro velho, vermelho de risco, garoa e a imagem `carro-forte/assets/carro-forte-hero.png` como base atmosférica.

A interface é mobile-first e mantém o padrão MOSAICO de **caixas e botões com profundidade física**: borda, luz interna, sombra de base e deslocamento ao pressionar.

Os ambientes internos do banco ainda poderão receber imagens próprias posteriormente sem alterar a arquitetura funcional.

## Arquivos

- `index.html` — telas e estrutura;
- `styles.css` — identidade visual, profundidade, mobile e responsividade;
- `game.js` / `game-fixed.js` — perguntas, mãos, economia (standalone ou herdada do handoff), captura, risco e cronômetro;
- `../celular-para-noite.js` (+ `celular-para-noite-contrato.mjs`) — ponte Manhã→Noite, schema do handoff e regra v1.1 de economia + semente de fragmentos.

**Prof. Mário César Nascimento, PhD ©**
