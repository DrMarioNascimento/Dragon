# MOSAICO — A Manhã do Carro-Forte · A MESA

## O que esta pasta é

A Mesa é a partida **coletiva e investigativa** do caso. Ela não é o Captura.
Aqui não há moeda, vez, carteira nem mercado: o que se administra é interpretação.
O Captura — economia, mãos e captura de evidência — vive em `../carro-forte-noite/`.

> **A perspectiva muda a pergunta. Não muda o que aconteceu.**

> **O MOSAICO deve explorar a distância entre aquilo que parece ter acontecido e aquilo que os fatos permitem concluir.**

## Realidade canônica

Onze dias antes, um depósito de R$ 96.000 é lançado duas vezes na consolidação; o cofre
passa a registrar R$ 96.000 que nunca tiveram existência física. Subgerente identifica a
duplicidade, não reporta e, diante de auditoria física integral, obtém R$ 96.000 de recursos
pessoais. Na manhã seguinte antecipa a coleta, prepara a falha da câmera 3, cria a janela de
87 segundos, rompe o lacre ML-8842, insere R$ 96.000 no malote 41, fecha com ML-8847 e
devolve o malote à custódia. Às 8h00 o malote sai com R$ 480.000; às 8h40 a tesouraria
confirma R$ 480.000 íntegros. **Naquela manhã, nenhum valor foi subtraído.**

O saco vazio, o lacre rompido, a câmera cega, Vigilância afastada, a coleta antecipada e a
etiqueta nova são fatos verdadeiros. A interpretação imediata de roubo é plausível e incorreta.

## Partidas disponíveis

| Partida | Foco | Pergunta-mãe |
|---|---|---|
| O Peso do Malote 41 | QUANTO + QUANDO | Quanto realmente desapareceu? |
| Os 87 Segundos | O QUÊ + COMO | O que aconteceu enquanto a câmera 3 ficou cega? |
| Foi um roubo? | QUAL / QUE TIPO | Houve realmente um roubo? |
| Antes das 8h02 | QUANDO | Quando nasceu a diferença que todos procuram? |
| Quem construiu a janela? | QUEM COMPOSTO | Quem colocou cada peça em movimento? |
| O que estava sendo protegido? | POR QUÊ | Se não era o dinheiro, o que alguém tentava salvar? |

Os campos finais são próprios de cada pergunta. Não existe formulário universal.

**A mesa não escolhe a pergunta — o sistema sorteia.** Escolher num menu ensinava a
decorar: quem já tinha fechado uma partida reconhecia os fragmentos e pulava a dedução.
O rodízio é um saco de seis: sorteia a ordem, entrega uma por vez e só reembaralha quando
acaba, empurrando para o fim a que acabou de sair — nenhuma pergunta se repete antes que
as seis tenham caído, e nenhuma cai duas vezes seguidas. O estado fica em `localStorage`,
na tela da mesa. O relatório mostra quantas das seis já foram fechadas, sem revelar qual
vem a seguir.

> Se um dia a Mesa for jogada em vários aparelhos na mesma sala, o sorteio precisa subir
> para o documento da sala — como A Noite faz em `sala-partida.js` —, senão cada aparelho
> abre uma pergunta diferente.

## Abertura

A Mesa usa a mesma abertura audiovisual de A Noite: tela de preparo (ativar o som), imagem
em cheio e narração, com pausar, reiniciar e pular. Ela roda **uma vez**, na primeira
entrada, e a pauta só é sorteada quando termina ou é pulada.

Duas telas, dois enquadramentos: o celular do Mestre recebe `AberturaCelular.jpg`; a tela
grande recebe `AberturaTelão.jpg`. O papel de parede do jogo segue a mesma regra — o hero
do caso no celular, o papel largo do telão a partir de 900px. Imagem, papel e áudio moram
numa cópia só, em `../carro-forte-noite/`.

## O que a V4 trouxe para esta Mesa

**Banco modular F01–F30.** Os fatos canônicos foram parcelados em trinta fragmentos de
distribuição. Cada um tem uma função declarada:

- **estrutural** — indispensável para o fechamento auditável da pergunta;
- **interpretativo** — sustenta ou enfraquece hipóteses sem fechá-las;
- **relacional** — vale sobretudo quando cruzado com outro fragmento;
- **contextual** — aprofunda horário, acesso, personagem e circunstância.

**Folga investigativa.** O dossiê abre em **três terços**. O primeiro nunca recebe pista de
fechamento; o segundo recebe no máximo duas. Nenhuma hipótese principal morre por uma
única pista antes do terço final.

**Duração modular.** Curta (13), Padrão (18) ou Longa (24) fragmentos em circulação,
escolhida no prólogo. Duas partidas com a mesma pergunta-mãe podem ter trajetos
informacionais diferentes e chegar à mesma resolução canônica.

**Hipóteses concorrentes H1–H10.** Nenhuma é pista falsa: cada uma nasce de fatos
verdadeiros interpretados de forma incompleta. A tela de hipótese mostra, para cada uma,
quais fragmentos daquela mesa a apoiam e quais a enfraquecem. Só H8, H9 e H10 sobrevivem
ao fechamento auditável.

**Relações R-A…R-G.** Uma relação só existe quando **as duas peças estão na mesa**. Sem o
par, o dado continua neutro — é exatamente o que R-A faz com os 5,1 kg.

**Revisão de hipótese pontua a favor.** Abandonar uma leitura plausível diante de nova
relação vale +5 no relatório. Erro é cicatriz, não sentença.

## Fluxo

1. prólogo — investigadores, ritmo e duração;
2. abertura audiovisual, e então a pauta sorteada: pergunta-mãe, dossiê dimensionado,
   campos e atividades daquela partida;
3. atividades sensoriais próprias da pergunta;
4. dossiê em três terços — marcar os fragmentos relevantes;
5. hipótese provisória entre H1–H10, com apoio e contraprova visíveis;
6. mosaico de relações e contraprova da hipótese registrada;
7. decisão final — campos da pergunta + hipótese sustentada;
8. revelação canônica pelo corte daquela pergunta;
9. relatório em 100 pontos, com a coleção das seis.

## Pontuação

| Eixo | Máximo |
|---|---:|
| Campos da pergunta | 45 |
| Hipótese sustentada no fechamento | 15 |
| Relações costuradas | 20 |
| Leitura do dossiê (fragmentos centrais marcados, menos o ruído) | 10 |
| Atividades sensoriais | 10 |
| Revisão de hipótese | +5 |

## Atividades sensoriais

Banco reutilizável de mecânicas: quais entram e o que revelam muda conforme a pergunta. Mas
**dentro de uma partida elas são uma fila, não um cardápio** — a mesa faz uma de cada vez,
todos juntos, na ordem que a partida declara. Só a atividade da vez tem ação; as seguintes
ficam apagadas e sem nada para clicar, e o dossiê só abre quando todas foram fechadas.

### As atividades são a distribuição

Elas não são interlúdio. **Cada atividade guarda um lote de quatro fragmentos, e só o que a
mesa descobrir com o gesto entra no dossiê.** O que ficar para trás não volta por nenhuma
outra porta: não entra pelo preenchimento, não entra por garantia de relação. O dossiê
encolhe, e com ele as relações que fecham.

Medido nas dezoito combinações de partida × duração. Em *O Peso do Malote 41*, na duração
padrão: descobrir tudo dá 18 fragmentos e 6 relações completas; metade dá 14 e 5; pular as
duas atividades dá 10 e 3. Pular é uma jogada legítima — pede confirmação e diz o preço.

Cada atividade exige o gesto que lhe é próprio, e nenhuma tem atalho:

- **A Janela do Norte** — cada setor tem um rumo, e só fixa quando o aparelho aponta para
  ele e **permanece** apontando. Sem bússola (telão, desktop, permissão negada no iOS), a
  mesma roda é girada com o dedo — continua um gesto por setor.
- **O Vidro Embaçado** — cada fragmento tem a sua faixa, e a faixa só abre com movimento
  continuado sobre ela. Limpar um canto e sair é jogada: você lê o peso e não lê a tabela,
  e sem o par R-A não fecha.
- **A Sala às Escuras** — o facho revela por proximidade. O que ele não tocar, você não leva.

O texto de um fragmento **não existe no DOM antes de ser alcançado**. O Vidro antigo
escrevia os quatro fatos no carregamento e cobria com um CSS embaçado: quem abrisse o
inspetor lia tudo sem passar o dedo.

A conclusão vale por partida e não é guardada entre elas: guardada, a atividade voltava
marcada na partida seguinte e em qualquer aparelho que já tivesse jogado — pronta sem
ninguém ter feito nada, que é o furo que a fila fecha.

| Partida | Janela do Norte | Vidro Embaçado | Sala às Escuras |
|---|:---:|:---:|:---:|
| O Peso do Malote 41 |  | ✓ | ✓ |
| Os 87 Segundos | ✓ | ✓ | ✓ |
| Foi um roubo? |  | ✓ | ✓ |
| Antes das 8h02 | ✓ |  |  |
| Quem construiu a janela? | ✓ |  | ✓ |
| O que estava sendo protegido? |  | ✓ |  |

## Identidade visual

A Mesa herdou o desenho de **A Noite**: fundo fotográfico rebaixado, placa flutuante no topo,
cartões com espessura e três cores de função — **ouro** para o dossiê, **verde** para decisão e
pergunta, **azul** para leitura sensorial e relações. Os fragmentos são cartões de papel; tudo o
mais é metal escuro. Alvos de toque de 44px sem engordar o desenho, como em A Noite.

O botão **SALA** do Mestre fica no cabeçalho, como em A Noite: o `#dragonSalaBtn` flutuante
do `firebase-room.js` continua existindo (é por ele que a página reconhece o aparelho do
Mestre, e é ele que recebe o clique), mas fica escondido — flutuando, cobria o dock.

O que **não** veio de A Noite: moeda, vez, carteira, ações de ARRISCAR/CAPTURAR/COMPRAR e
o HUD de partida. Isso é Captura, e Captura é outro jogo.

## Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | casca da Mesa, HUD, gaveta de regras e navegação entre telas |
| `styles.css` | identidade visual herdada de A Noite |
| `game.js` | banco F01–F30, hipóteses H1–H10, relações R-A…R-G, rodízio das perguntas, montagem do dossiê, decisão, revelação e relatório |
| `opening-flow.js` | abertura audiovisual; gêmeo do arquivo de mesmo nome em `../carro-forte-noite/` |
| `fragmentos.js` | banco F01–F30, fonte única lida pela Mesa e pelas três atividades |
| `atividade.js` / `atividade.css` | núcleo comum das atividades: lote pela URL, colheita de volta, placar e identidade visual |
| `janela-do-norte.html` | atividade sensorial temporal/espacial |
| `vidro-embacado.html` | atividade sensorial documental/física |
| `sala-as-escuras.html` | atividade sensorial de busca material |
| `iphone-guard.css` / `iphone-guard.js` | guarda de orientação e comportamento móvel |
| `assets/` | imagens do caso, inclusive o fundo compartilhado com A Noite |
| `tiles/` | imagens do card no catálogo |
| `fragmentos-em-dupla.html` | protótipo de fragmentação em dupla; preservado para reaproveitamento |

## Regra de design

`REALIDADE CANÔNICA → FOCO DA PARTIDA → PERGUNTA → FRAGMENTOS → RELAÇÕES → INFERÊNCIA → DECISÃO`

Nenhuma partida nova pode reescrever fatos para produzir replay. A multiplicidade está nas
perguntas, não em verdades alternativas.

**Prof. Mário César Nascimento, PhD ©**
