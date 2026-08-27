| `firestore.rules` | autorização por Sala, mestre e participante |
| `sw.js` | cache de mídia entre partidas — escrito e desligado, ver o topo do arquivo |
| `tests/` | motor, QR, sincronia do caso e matriz de segurança |
| `js/mosaico-v5.js` | cálculo puro e testável da pontuação |
| `js/qr.js` | geração local do QR da sala, sem serviço externo |
| `js/tarefa-sensor.js` | protocolo com a Mesa e ativação de sensor, comuns às três tarefas |
# MOSAICO — A Verdade é um Fragmento

> Jogo híbrido de dedução distribuída para smartphones, com telão opcional. Projeto autoral proprietário em desenvolvimento.

O **MOSAICO** transforma um caso em informações fragmentadas entre os participantes. Ninguém recebe sozinho todos os fatos, a cronologia e a relevância das evidências. Os jogadores precisam encenar, competir, cooperar, negociar pistas e construir uma acusação final — enquanto cada desempenho também produz uma classificação individual.

**Jogar:** [drmarionascimento.github.io/Dragon/MOSAICO-mesa.html](https://drmarionascimento.github.io/Dragon/MOSAICO-mesa.html)

Há um protótipo React separado em [`mosaico-web/`](./mosaico-web). Ele não substitui esta mesa.

**Caso implementado:** *A Casa da Costa*

**Participantes:** 1 a 12 (1 participante funciona como modo integral de teste)

- **1 participante:** Mestre e jogador/testador na mesma experiência; todas as telas ficam acessíveis e as votações impossíveis são ignoradas.
- **2–3 participantes:** um Fragmento único; todos são Portadores e editam o mesmo rascunho sincronizado, sem voto interno.
- **4–12 participantes:** múltiplos Fragmentos de 2 ou 3 pessoas, com um Portador sorteado por Fragmento.

**Situação:** protótipo jogável em construção e playtest

## Autoria

**Concepção e autoria do projeto:** Mário César Nascimento e Osana Melo Nascimento

**Desenvolvimento e perfil responsável:** [DrMarioNascimento](https://github.com/DrMarioNascimento)

## Experiência atual

O jogo funciona diretamente no navegador, sem instalação obrigatória, em dois modos:

- **Com telão:** o painel coletivo apresenta código, QR, cronologia, revelação, apuração e pódio.
- **Sem telão:** o criador também joga pelo celular e recebe os controles exclusivos de mestre no botão **Sala**.

Ao entrar pelo celular, o participante pode assistir à abertura vertical ou pulá-la. A abertura horizontal permanece destinada ao telão. A sirene de mudança de fase e os anúncios narrados são emitidos somente no aparelho do mestre para evitar eco entre vários celulares. Os arquivos canônicos ficam em `audio/`; o anúncio correspondente começa depois da sirene e o pódio recebe uma chamada própria ao final da apuração. `audio/encerramento.mp3` toca depois das acusações e antes da revelação, com **Pular narração** disponível ao mestre.

### Barra móvel

A navegação inferior utiliza **Caso | Sala | Arquivo**:

- **Caso:** rodada atual, orientação do momento e cronologia pública;
- **Sala:** comandos exclusivos do mestre; para os demais jogadores, acesso às informações comuns da sala;
- **Arquivo:** pistas privadas e adquiridas.

O menu **Sala** do mestre é organizado em acordeões. A ação necessária recebe destaque vermelho; QR e participantes permanecem recolhidos quando não são necessários. A lista de participantes fica ao final do menu.

### Ritmo da partida

Na criação da sala, o mestre escolhe:

- **Automaticamente — recomendado:** o jogo avança quando todos terminam;
- **Com minha liberação:** a Sala avisa quando é hora de avançar.

Nos dois ritmos, o mesmo controle alterna entre **Pausar partida** e **Retomar partida**. Assim, o mestre pode intervir mesmo depois de escolher avanço automático.

## Fluxo consolidado

1. criação da Sala, orientação e abertura audiovisual;
2. apresentação/Encenação individual — **Entenda a cena, Faça e Fale**;
3. **Jogador contra Jogador** e voto cego;
4. tarefa sensorial **A Janela do Norte**, marcando a chegada à casa;
5. tarefa interna alternada entre partidas: **O Vidro Embaçado** ou **A Sala às Escuras**;
6. encontro dos **Fragmentos** pela cor da tela e confirmação individual;
7. **Jogador com Jogador** — reconstrução coletiva e voto interno;
8. **Mercado de pistas** — compra e venda de informações;
9. **Jogadores contra o caso** — acusação final;
10. revelação, apuração progressiva e pódio.

Durante a Encenação, somente o participante ativo recebe as instruções. Os demais veem o fundo do jogo e **AGUARDE...**, sem nomear quem está atuando. Os três cartões possuem funções distintas:

- **Entenda a cena:** explica diretamente o que acontecerá;
- **Faça:** apresenta as ações físicas;
- **Fale:** fornece texto suficiente para uma pequena atuação, sem substituir a cena por silêncio.

Na formação dos grupos, nomes não são necessários. Cada participante recebe um **Fragmento da Névoa, Tempestade, Farol ou Noite** e procura pessoas com a mesma cor de tela. O cronômetro dourado começa junto da formação; o botão **OK, ENCONTREI MEU FRAGMENTO!** é liberado após cinco segundos e alimenta o contador. No ritmo automático, a reconstrução abre quando todos confirmam.

Cada Fragmento recebe as seis peças da cronologia distribuídas entre os Arquivos de seus integrantes e, por sorteio, um **Portador**. Ninguém recebe sozinho o conjunto. Os demais integrantes veem horários e dicas, consultam os próprios Arquivos e conversam presencialmente; somente o Portador recebe a peça dourada pulsante, seleciona as pistas e envia a resposta coletiva. Durante essa fase, Caso e Mural não repetem a cronologia. Pistas já utilizadas desaparecem das escolhas vazias. Ao revisar uma associação, todas reaparecem com o horário ocupado e podem ser trocadas entre si. O rascunho é sincronizado no Firestore e sobrevive à reconexão.

Em mesas de 1 a 3 participantes existe um único Fragmento e todos atuam como Portadores. Não há procura por cores nem voto interno. O envio é único e definitivo. Cada posição correta vale 3 pontos, até 18; o tempo acrescenta 2 pontos quando a entrega ocorre em até 2min30s, 1 ponto até 5min e nenhum bônus depois disso. Assim, a quantidade de acertos permanece sempre mais importante que a velocidade.

Em mesas de 4 a 12 participantes, cada Fragmento também faz um único envio definitivo. A classificação considera primeiro a quantidade de posições corretas e, somente entre Fragmentos com o mesmo número de acertos, o menor tempo. A colocação fornece a base coletiva de 20, 16, 12, 8 ou 4 pontos. O máximo geral permanece em 100 pontos.

Todas as telas móveis obedecem a uma reserva inferior única, calculada com a área segura do aparelho. Conteúdo, botões de envio e comandos de retorno rolam até uma posição visível acima da barra fixa **Caso | Sala | Arquivo**; modais que ficam acima da barra possuem rolagem interna limitada à altura dinâmica da tela.

## Pontuação V5 — máximo de 100

| Componente exibido | Componente técnico | Máximo |
|---|---|---:|
| Encenação | Performance | 5 |
| J × J | Tempo de resolução | 32 |
| J + J | Cooperação | 30 |
| Mercado | Economia e risco | 20 |
| Caso | Qualidade da resolução | 13 |

Todos os pontos do jogo são inteiros. Empates de envio dentro de três segundos são tratados pelo motor. O escore Z é utilizado apenas em simulações e análise de dispersão; ele não integra o placar nem altera a classificação.

Na apuração, as colunas surgem progressivamente e permanecem visíveis. A classificação é reordenada a cada componente. Quando entram os pontos do **Caso**, a animação segue diretamente para o pódio, sem exibir uma coluna separada de soma.

## Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| `MOSAICO-mesa.html` | interface, fluxo, estados e integração Firebase |
| `casos/casa-da-costa.json` | fonte canônica do caso piloto |
| `js/mosaico-v5.js` | cálculo puro e testável da pontuação |
| `js/qr.js` | geração local do QR da sala, sem serviço externo |
| `js/tarefa-sensor.js` | protocolo com a Mesa e ativação de sensor, comuns às três tarefas |
| `MOSAICO-26-a-janela-do-norte.html` | primeira rodada sensorial |
| `MOSAICO-26-vidro-embacado.html` | tarefa interna alternada |
| `MOSAICO-26-a-sala-as-escuras.html` | tarefa interna alternada |
| `firestore.rules` | autorização por Sala, mestre e participante |
| `sw.js` | cache de mídia entre partidas — escrito e **desligado**, ver o topo do arquivo |
| `tests/` | motor, QR, sincronia do caso e matriz de segurança |
| `FIREBASE-SECURITY.md` | implantação e verificação de segurança |
| `HANDOFF.md` | continuidade técnica e decisões consolidadas |

O jogo não depende de nenhum serviço de terceiros em tempo de execução além do próprio Firebase e do Google Fonts. O QR passou a ser gerado no aparelho.

### Verificação

```bash
npm install && npm run test:tudo
```

O motor de pontuação, o codificador de QR e a sincronia entre `casos/casa-da-costa.json` e a cópia embutida no HTML rodam sem emulador. A matriz de segurança do `FIREBASE-SECURITY.md` roda contra o emulador do Firestore.

O projeto utiliza HTML, CSS e JavaScript estáticos, Firebase Authentication anônimo e Firestore. A proteção dos dados depende da implantação das regras versionadas em `firestore.rules`; o jogo não deve operar com regras abertas em modo de teste.

## Estado do desenvolvimento

O repositório contém uma experiência jogável, mas a proposta continua em construção. Decisões antigas, hipóteses de design, testes de equilíbrio de Nash e simulações permanecem como memória técnica quando não tiverem sido formalmente substituídos. A regra documental é:

> **Tudo se adapta, nada se perde.**

Antes de alterar regras, narrativa ou pontuação, consulte `HANDOFF.md` e o histórico Git. Testes físicos com diferentes aparelhos continuam necessários para validar sensores, áudio, ritmo da Sala, mercado, reconexão e resultado final.

## Licença e uso

Este é um repositório público para consulta e funcionamento do GitHub Pages, mas **não é um projeto de código aberto**. A visibilidade dos arquivos não concede autorização para copiar, adaptar, redistribuir, republicar, comercializar, treinar sistemas de inteligência artificial ou criar obra derivada.

É permitido participar normalmente de partidas pelo endereço oficial e avaliar o projeto nos limites descritos na [Licença Proprietária](LICENSE.md). Qualquer uso adicional depende de autorização prévia e escrita dos titulares.

---

**Prof. Mário César Nascimento, PhD ©**
