# MOSAICO — Documento de Passagem

**Para:** quem for auditar, testar ou dar continuidade ao projeto  
**Estado de referência:** 23 de agosto de 2026 · branch `main`  
**Autores do projeto:** Mário César Nascimento e Osana Melo Nascimento

Este documento descreve o estado real do MOSAICO, separando:

1. o que já funciona no código;
2. as regras de design consolidadas;
3. o que ainda depende de implementação ou playtest.

A especificação de pontuação mais recente é o **Documento Consolidado V5**. Regras antigas de pontuação, simulações anteriores e referências ao antigo Capítulo 24 são consideradas superadas quando contradizem esta passagem.

---

## 1. O que é o MOSAICO

Jogo híbrido de **dedução distribuída**, jogado em smartphones com painel ou telão opcional.

Um caso é fragmentado entre os participantes. Ninguém recebe sozinho todos os fatos, a cronologia ou a relevância das evidências. A missão é coletiva, mas o resultado individual depende de resolução, cooperação, economia informacional e participação.

O caso atualmente implementado é **A Casa da Costa**: seis convidados permanecem em uma casa isolada durante uma tempestade; durante uma queda de energia de dois minutos, algo acontece.

### Princípios protegidos

- o acerto do caso é o grande filtro da reta final;
- a cooperação real deve produzir vantagem;
- free-riding deve ser desvantajoso;
- compra e venda de pistas constituem decisões sob incerteza;
- velocidade importa, mas não deve substituir a precisão;
- o personagem permanece segredo até a revelação;
- o jogo deve continuar compreensível e executável sem build complexo.

---

## 2. Publicação e infraestrutura

**Jogo publicado:**  
https://drmarionascimento.github.io/Dragon/MOSAICO-mesa.html

**Repositório:**  
https://github.com/DrMarioNascimento/Dragon

**Visibilidade:** público, necessário para manter o GitHub Pages no plano gratuito.

**Firebase:** projeto `mosaico-game`, plano Spark.

- Firestore em `southamerica-east1`;
- Authentication com login anônimo;
- domínio `drmarionascimento.github.io` autorizado;
- HTML estático + Firebase por CDN;
- sem build, npm ou framework.

O `firebaseConfig` no HTML é público por natureza. A proteção efetiva dos dados depende das regras do Firestore.

---

## 3. Estrutura canônica atual

```
Dragon/
├── MOSAICO-mesa.html
├── MOSAICO-24.5-vidro-embacado.html
├── MOSAICO-24.5-a-janela-do-norte.html
├── casos/
│   └── casa-da-costa.json
├── js/
│   └── mosaico-v5.js
├── img/
│   ├── abertura.mp4
│   ├── aguardando.jpg
│   ├── capa-vertical.jpg
│   ├── fundo-painel.jpg
│   ├── icone-192.png
│   └── icone-512.png
├── manifest.json
├── README.md
├── LICENSE.md
└── HANDOFF.md
```

### Módulos sensoriais canônicos

| Módulo | Arquivo | Situação |
|---|---|---|
| O Vidro Embaçado | `MOSAICO-24.5-vidro-embacado.html` | rodada sensorial integrada e recalibrada |
| A Janela do Norte | `MOSAICO-24.5-a-janela-do-norte.html` | rodada sensorial integrada e recalibrada |

Os dois arquivos são autocontidos e independem do próprio nome para funcionar. Os nomes canônicos atuais são **O Vidro Embaçado** e **A Janela do Norte**. As versões substituídas permanecem recuperáveis pelo histórico Git.

Os módulos abrem incorporados por `?embed=1`, notificam a mesa por `postMessage`, registram a conclusão no Firestore e liberam um fragmento no Arquivo. O botão **Ativar movimento** pede a permissão dentro do gesto do jogador e a tarefa só abre após a primeira leitura válida. Se a permissão for negada, o sensor estiver indisponível ou não responder em cinco segundos, aparece **Tentar novamente**. Esses estados ficam registrados em `tarefas`; o Menu do mestre mostra quantos concluíram e quantos estão sem resposta. Cada rodada avança quando todos concluem ou após 180 segundos, portanto uma incompatibilidade não bloqueia a partida.

---

## 4. O que já está implementado

O código atual entrega a primeira experiência jogável:

- abertura audiovisual;
- criação de sala;
- código e QR;
- autenticação anônima;
- entrada por nome;
- escolha da forma de tratamento;
- sorteio equilibrado de um dos seis arquétipos, em até dois ciclos;
- botão individual de prontidão;
- controle de início pelo painel;
- ordem determinada pela entrada;
- roteiro individual;
- segredo do personagem;
- revelação posterior;
- flexão de gênero;
- pista privada armazenada no Firestore;
- acesso móvel **Arquivo**, no canto inferior direito, exibido somente após o primeiro fragmento ser guardado;
- acesso móvel **Caso** para todos os jogadores, com rodada atual, orientação da fase e cronologia pública, sem pontuação ou informação secreta;
- cronologia pública;
- voto cego de Performance sem auto-voto;
- divisão automática em núcleos de 2 ou 3 participantes;
- Mosaico Coletivo com colocação registrada pelo servidor;
- voto interno cego, restrito ao núcleo e sem auto-voto;
- Mercado Cego com 9 moedas iniciais e preços configuráveis de 1/3/5;
- compra transacional de pistas e transferência de moedas;
- formulário completo de Dedução Final;
- registro temporal da resposta no servidor;
- pontuação V5 inteira e placar consolidado;
- calibração ex post da Confiabilidade, com bloqueio da Qualidade do Gasto quando negativa;
- encerramento da sala;
- carregamento opcional de caso por `?caso=nome`;
- manifesto para instalação;
- solicitação de tela cheia quando suportada.
- abertura em modo **Com telão** ou **Sem telão**;
- no modo Sem telão, o criador também joga; seu celular é igual aos demais, exceto pelo botão compacto **Menu**, ao lado de **Arquivo**;
- o Menu do mestre abre e fecha pelo mesmo botão e reúne QR/código, lista de conectados, controles necessários da fase, pular apresentação e encerrar sala;
- com o Menu fechado, nenhum indicador, painel ou controle de mestre pode permanecer visível; toda a experiência jogável deve ser idêntica à dos demais celulares;
- formação dos núcleos ocorre automaticamente quando todos votam ou termina o prazo de Performance;
- cálculo e publicação do placar ocorrem automaticamente quando todos enviam a Dedução Final ou termina o prazo;
- todos recebem um mural coletivo móvel com relógio e cronologia quando não há telão;

### Máquina de fases implementada

No Firestore:

`sala` → `encenacao` → `votacao` → `constelacao` → `inclinacao` → `mosaico` → `cooperacao` → `mercado` → `deducao` → `resultado`

Telas locais:

`inicio`, `entrar`, `esperando`, `encenacao`, `revelacao`, `votacao`, `constelacao`, `inclinacao`, `mosaico`, `cooperacao`, `mercado`, `deducao`, `resultado`, `encerrada`, `painel`.

O resultado final utiliza o placar V5 completo descrito nas seções seguintes; o voto de Performance permanece cego e integrado ao peso de 5%.

---

## 5. Regras narrativas que não podem ser quebradas

### 5.1 Personagem secreto

O personagem é segredo inclusive para quem o interpreta. O roteiro apresenta rubrica, tom e fala sem revelar o arquétipo. A pessoa descobre quem era somente ao encerrar sua vez.

### 5.2 A surpresa não deve ser anunciada

Antes da vez da pessoa, a interface não deve usar “encenação”, “interpretação” ou texto equivalente. O painel utiliza **Começar o jogo**.

Antes de publicar alterações de texto, conferir:

```bash
grep -i "encena\|interpreta" MOSAICO-mesa.html
```

No modo **Com telão**, durante a abertura/encenação, o painel não mostra nem destaca a pessoa da vez. Exibe apenas **“Observe o ambiente e escute os sons!”**. O celular individual é o único indicador de quem deve agir.

O topo da interface identifica sempre a rodada atual, em cor contrastante e tipografia ampliada:

| Fases internas | Nome exibido |
|---|---|
| `sala` | Preparação da mesa |
| `encenacao` e `votacao` | Apresentação |
| `constelacao` | O Vidro Embaçado |
| `inclinacao` | A Janela do Norte |
| `mosaico` e `cooperacao` | Jogador ajuda seu grupo |
| `mercado` | Jogador contra jogador |
| `deducao` | Jogador contra o caso |
| `resultado` | Resultado final |

No modo Sem telão, o mesmo cabeçalho aparece nos celulares.

O celular permanece com cada jogador durante toda a encenação. A pessoa lê sua instrução no próprio aparelho e mantém a tela voltada somente para si, protegendo a pista privada. Nunca orientar que o celular seja deixado sobre a mesa.

Comandos de ação devem explicitar ação e consequência. Na revelação da pista, usar **“Toque para adicionar a pista ao Arquivo e seguir com o caso”** e o botão **“Adicionar ao Arquivo”**; evitar “Guarde” isolado, que pode ser confundido visualmente com “Aguarde”.

Na apresentação, o botão de conclusão usa **“Toque para concluir sua apresentação!”**. No Mosaico coletivo, a orientação temporal é **“Quanto mais rápido o seu grupo concluir, melhor será sua colocação.”**

Outros textos operacionais consolidados:

- **“Pular a apresentação atual”**, em vez de “Avançar se necessário”;
- **“Voto registrado”**, em vez de “voto guardado”;
- **“Colocar a pista à venda”**, deixando claro que “cego” se refere à importância oculta, não ao vendedor;
- explicar a Confiabilidade em linguagem comum: ao final, o jogo compara o preço cobrado com a importância real da pista;
- confirmar que resposta e horário de envio foram registrados;
- avisar antes da Dedução Final que a resposta não poderá ser alterada.

### 5.3 O nome desaparece

Antes da tarefa, o telão mostra o nome. Durante o mistério e nas votações, mostra apenas o arquétipo. No placar final, quando o caso já terminou, o nome do jogador volta a aparecer junto do personagem e dos pontos.

### 5.4 Flexão por escolha do jogador

A entrada oferece formas masculina, feminina ou indiferente. O marcador `{masculino|feminino}` é resolvido pela função `flex()`.

Jornalista e Policial exigem flexão de artigo, não alteração automática do sufixo.

### 5.5 Um caso = um arquivo

A história e os dados específicos vivem em `casos/casa-da-costa.json`. O motor deve permanecer reutilizável.

Novo caso:

1. copiar o JSON;
2. substituir os dados;
3. abrir com `?caso=nome-do-arquivo`.

O caso padrão também permanece embutido na mesa para funcionamento resiliente.

---

## 6. Placar proporcional consolidado

Os valores são **pesos invariáveis**, não autorização para um componente ultrapassar o próprio limite.

| Componente | Peso | Fechamento |
|---|---:|---|
| Tempo de Resolução | 32% | Dedução Final |
| Qualidade da Resolução | 13% | Dedução Final |
| Cooperação | 30% | após o Mosaico Coletivo |
| Economia e Risco | 20% | Dedução Final |
| Performance | 5% | após A História que Pula |

Nenhum componente pode ultrapassar o próprio peso. O placar do jogo utiliza apenas números inteiros.

### 6.1 Tempo de Resolução — 32%

Somente pontua quem acertar o Suspeito Principal.

| Colocação | Índice |
|---|---:|
| 1º | 32 |
| 2º | 29 |
| 3º | 26 |
| 4º | 23 |
| 5º | 20 |
| 6º | 17 |
| 7º ou mais | 14 |

Diferença de até três segundos caracteriza empate. Utiliza-se a média dos índices das posições ocupadas, arredondada para baixo.

### 6.2 Qualidade da Resolução — 13%

Somente pontua quem acertar o Suspeito Principal.

Campos avaliados:

- Motivo;
- Ação Decisiva;
- Prova-chave;
- Lacuna Resolvida.

| Campos corretos | Índice |
|---|---:|
| 4 | 13 |
| 3 | 10 |
| 2 | 6 |
| 1 | 3 |
| 0 | 0 |

---

## 7. Cooperação — 30%

### 7.1 Coletiva — até 20

Os núcleos são classificados pela ordem de conclusão correta da carta do Mosaico, registrada pelo servidor.

| Colocação do núcleo | Pontos por integrante |
|---|---:|
| 1º | 20 |
| 2º | 16 |
| 3º | 12 |
| 4º | 8 |
| 5º ou mais | 4 |
| não concluiu | 0 |

Regras:

- todos partem da mesma referência temporal;
- montagem incorreta não encerra o cronômetro;
- não há faixa artificial de empate;
- o acerto posterior do suspeito não altera Cooperação;
- o componente fecha após o Mosaico.

### 7.2 Individual — até 10

Após a montagem, cada integrante responde secretamente:

> Quem mais colaborou com o grupo nesta tarefa?

- um voto por pessoa;
- ninguém pode votar em si;
- somente integrantes do núcleo aparecem;
- o mais votado recebe 10 pontos;
- empates dividem por divisão inteira;
- sobras não são distribuídas;
- núcleo de duas pessoas: 5 pontos para cada, sem votação;
- votos ausentes não bloqueiam o encerramento após o tempo-limite;
- vencedor, votos e parcela individual não são revelados.

Como o voto é cego e não verificável, acordos de reciprocidade são estrategicamente frágeis.

---

## 8. Economia e Risco — máximo de 20%

| Subcomponente | Faixa |
|---|---:|
| Moedas restantes | 0 a 8 |
| Qualidade do Gasto | 0 a 5 |
| Confiabilidade | −7 a +7 |
| Economia final | 0 a 20 |

Fórmula:

```
Economia = limitar(Moedas + Qualidade do Gasto + Confiabilidade, 0, 20)
```

### 8.1 Moedas restantes

| Moedas | Pontos |
|---|---:|
| 9 ou mais | 8 |
| 7–8 | 7 |
| 5–6 | 5 |
| 3–4 | 3 |
| 1–2 | 1 |
| 0 | 0 |

### 8.2 Qualidade do Gasto

| Situação | Pontos |
|---|---:|
| acertou e utilizou pista adquirida | 5 |
| acertou sem utilizar pista adquirida | 2 |
| errou o suspeito | 0 |

O formulário final deverá registrar quais pistas fundamentaram a solução.

### 8.3 Confiabilidade

**Confiabilidade é o índice de calibração da precificação sob incerteza.**

O vendedor atribui preço ex ante com base em sinais incompletos. O comprador aceita ou recusa segundo o valor esperado. A qualidade real só é revelada na conclusão, quando ocorre a validação ex post.

Não mede honestidade, moralidade ou intenção.

| Qualidade revelada | Preço baixo | Preço justo | Preço alto |
|---|---:|---:|---:|
| boa | +3 | +2 | +1 |
| mediana | +1 | 0 | −2 |
| ruim | 0 | −2 | −3 |

Regras:

- somente negociações concluídas entram no cálculo;
- o efeito é aplicado à precificação do vendedor;
- ofertas recusadas não alteram Confiabilidade;
- cada combinação jogador + pista pontua uma vez;
- a qualidade permanece oculta até a revelação final;
- a soma é limitada entre −7 e +7;
- Confiabilidade final negativa bloqueia Qualidade do Gasto.

No lado comprador, moedas restantes e Qualidade do Gasto registram ex post a eficiência da aquisição.

---

## 9. Performance — 5%

Após A História que Pula, a mesa vota secretamente:

> Quem mais contribuiu para o clima e a diversão neste início?

- um voto por pessoa;
- ninguém vota em si;
- mais votado recebe 5;
- empates dividem por divisão inteira;
- sobras não são distribuídas;
- votos ausentes não bloqueiam o encerramento;
- resultado detalhado não é revelado.

Performance reconhece envolvimento social; não é avaliação técnica de atuação.

---

## 10. Formação dos núcleos

| Jogadores | Distribuição |
|---:|---|
| 6 | 3–3 |
| 7 | 3–2–2 |
| 8 | 3–3–2 |
| 9 | 3–3–3 |
| 10 | 3–3–2–2 |
| 11 | 3–3–3–2 |
| 12 | 3–3–3–3 |

A primeira implementação é planejada para seis jogadores, com expansão até doze. A antiga simulação com quinze participantes não representa configuração atualmente suportada.

---

## 11. Análise estratégica bilateral

Foi realizada uma varredura paramétrica com:

- três distribuições prévias de qualidade;
- seis níveis de precisão dos indicadores;
- três estruturas de preços;
- cinco valores de pista mediana;
- cinco valores de pista boa;
- quatro valores marginais das moedas.

Total:

- **16.200 estados estratégicos**;
- **5.400 configurações completas**.

### Equilíbrios observados

| Resultado | Frequência |
|---|---:|
| compra por preço baixo | 51,35% |
| compra por preço justo | 19,49% |
| compra por preço alto | 15,78% |
| recusa da compra | 13,38% |

### Conforme o indicador

| Indicador | Recusa | Baixo | Justo | Alto |
|---|---:|---:|---:|---:|
| provavelmente ruim | 34,17% | 53,89% | 8,50% | 3,44% |
| provavelmente mediana | 5,02% | 59,94% | 24,91% | 10,13% |
| provavelmente boa | 0,94% | 40,20% | 25,07% | 33,78% |

### Separação informacional

| Resultado | Configurações | Percentual |
|---|---:|---:|
| separação monotônica | 3.430 | 63,52% |
| pooling | 1.964 | 36,37% |
| contrário aos indicadores | 6 | 0,11% |

Conclusões:

- comprar todas as pistas não é resposta geral ótima;
- cobrar sempre o máximo não é resposta geral ótima;
- sinais melhores sustentam preços maiores;
- preço alto com sinal ruim representa aposta de avaliação, não oportunismo moral;
- a validação definitiva ocorre na conclusão.

**Limite:** trata-se de análise de robustez, não prova definitiva de equilíbrio. Moedas iniciais, preços reais e dados de playtest deverão substituir os intervalos paramétricos.

---

## 12. Simulação consolidada e escore Z

A simulação válida atual utiliza doze jogadores, quatro núcleos de três, Economia limitada a vinte e Cooperação exclusivamente temporal.

Resultados totais simulados:

| Jogador | Total | Z populacional |
|---|---:|---:|
| Ana | 93 | +1,85 |
| Carla | 78 | +1,23 |
| Elena | 65 | +0,70 |
| Hugo | 65 | +0,70 |
| João | 64 | +0,65 |
| Diego | 55 | +0,28 |
| Karla | 39 | −0,38 |
| Iris | 32 | −0,67 |
| Bruno | 29 | −0,79 |
| Fábio | 24 | −1,00 |
| Lucas | 20 | −1,16 |
| Gabriela | 14 | −1,41 |

- média: **48,17**;
- desvio-padrão populacional: **24,19**.

O escore Z é análise estatística e pode utilizar casas decimais. Ele não integra o placar do jogo.

---

## 13. Pendências técnicas prioritárias

### 13.1 Reconexão

Implementada. O aparelho preserva localmente a identidade vinculada ao UID anônimo do Firebase. Ao recarregar ou reabrir o navegador, consulta a sala e o documento do jogador, restaura personagem, pistas, moedas, núcleo, fase e ouvintes. O aparelho mestre também recupera o painel ou o Menu conforme o modo da sala.

O código da sala isoladamente não permite assumir outro jogador. Se a sala estiver inativa, o vínculo é apagado e a reconexão é recusada. Depois de encerrar uma sala, uma nova abertura sempre gera outro código.

### 13.2 Segurança do Firestore

A senha do mestre no cliente continua sendo apenas uma barreira de abertura. A segurança dos dados foi versionada em `firestore.rules`: o criador é identificado por `mestreUid`; somente ele altera a sala, as fases e o placar; jogadores escrevem apenas ações autorizadas; votos e deduções ficam legíveis somente pelo autor e pelo mestre; compras são validadas como transações completas.

A conclusão da apresentação passou a ser uma solicitação em `acoes`: o jogador confirma no próprio celular e somente o mestre avança a fase e publica a cronologia. A atualização do próprio jogador também autoriza os campos `fragmentoPronto` e `fragmentoProntoMs`, necessários ao botão **OK, ENCONTREI MEU FRAGMENTO!**. Consulte `FIREBASE-SECURITY.md` para implantação, matriz de testes e o limite conhecido relativo às pistas ainda presentes nos documentos públicos dos jogadores.

### 13.3 Limite de jogadores

A entrada admite de dois a doze participantes. Até seis, cada arquétipo aparece uma vez. Do sétimo ao décimo segundo, começa um segundo ciclo equilibrado; nenhum arquétipo recebe uma terceira cópia e, com doze pessoas, existem exatamente duas de cada.

A duplicidade é uma regra narrativa: duas pessoas com o mesmo personagem representam fragmentos da mesma identidade e são igualmente vinculadas à culpa ou inocência do arquétipo. Elas não conhecem antecipadamente a duplicidade, não formam equipe e continuam pontuando individualmente. Na votação de Performance e na Confiabilidade, cópias iguais recebem os rótulos `fragmento 1` e `fragmento 2`; no placar final, os nomes reais são revelados.

### 13.4 História final

Implementada como uma revelação sincronizada em cinco etapas: **A verdade**, **Como aconteceu**, **Evidências**, **Confiabilidade** e **Placar**. O mestre avança cada etapa; todos os celulares e o telão acompanham pelo campo `revelacaoEtapa` da sala. Os votos cegos permanecem ocultos.

O placar usa artes próprias: `img/resultado-mobile.jpg` no celular e `img/resultado-telao.jpg` no telão. Os três primeiros jogadores aparecem em caixas com nome, personagem e pontos sobre os respectivos degraus do pódio. Do quarto colocado em diante, a classificação fica em lista lateral no telão e abaixo da arte no celular.

### 13.5 Placar consolidado

Tempo, Qualidade, Cooperação, Economia, Performance, Dedução Final, mercado, núcleos e escore completo estão implementados em `MOSAICO-mesa.html` e `js/mosaico-v5.js`.

### 13.6 Parâmetros de playtest

O caso define valores iniciais configuráveis: 9 moedas; preços baixo/justo/alto de 1/3/5; limites de 60 segundos para Performance, 180 segundos para cada rodada sensorial, 60 segundos para Cooperação, 480 segundos para o Mercado e 300 segundos para a Dedução; e qualidade objetiva das pistas. Os valores são parâmetros de playtest, não constantes irreversíveis do motor.

### 13.7 Consolidação visual e audiovisual

A navegação móvel usa uma barra inferior fixa **Caso | Sala | Arquivo**. A Sala do mestre é central, funciona em acordeões exclusivos e deixa a lista de participantes por último, em duas colunas quando houver largura suficiente. Ações necessárias recebem alerta vermelho sem substituir a cor funcional do botão.

A encenação apresenta somente ao ator os três blocos coloridos **Entenda a cena**, **Faça** e **Fale**; os demais aparelhos exibem o papel de parede escuro e **AGUARDE...**, sem revelar quem está atuando. Ao trocar de rodada, a rolagem volta ao início.

A abertura possui vídeo horizontal H.264/AAC de 1280 × 720 para telão e vídeo vertical H.264/AAC de 1080 × 1920 para participantes em modo retrato. O vídeo móvel exige o toque em **Assistir à abertura**, com **Pular** disponível, porque navegadores móveis bloqueiam reprodução automática com som.

O resultado final abre uma tabela progressiva com **Encenação**, **J × J**, **J + J**, **Mercado** e **Caso**. As colunas permanecem visíveis, a classificação muda após cada etapa e o pódio substitui a tabela ao final. O Caso entra por último sem exibir uma coluna separada de soma durante a animação.

Os módulos sensoriais canônicos são `MOSAICO-24.5-vidro-embacado.html` e `MOSAICO-24.5-a-janela-do-norte.html`. Ambos comunicam conclusão e estado do sensor à mesa, oferecem interação por toque quando o sensor falha e preservam os identificadores internos `constelacao` e `inclinacao` para compatibilidade com Firestore e salas anteriores.

---

## 14. Segurança e integridade do caso

O repositório é público. Personagens, roteiros, pistas e solução podem ser inspecionados no JSON ou no HTML.

A licença protege autoria, mas não impede consulta antecipada. Para produto ou competição, o caso deverá ser servido de maneira que segredos não sejam enviados integralmente ao cliente antes do momento correto.

Mesas de teste antigas no Firestore devem ser removidas periodicamente.

---

## 15. Limitações de plataforma

| Limitação | Situação |
|---|---|
| áudio automático | exige gesto do usuário |
| tela cheia no iPhone | Safari não implementa Fullscreen API geral |
| instalação no iPhone | usar Adicionar à Tela de Início |
| iPad | Fullscreen API disponível |
| QR com localhost | celular tenta abrir a si mesmo |
| navegador de TV | exige navegação por foco e botões acessíveis |

---

## 16. Ordem recomendada de implementação

1. publicar e validar `firestore.rules` no projeto Firebase;
2. teste físico da ativação e da nova tentativa em iOS Safari e Android Chrome;
3. proteção efetiva das pistas em backend confiável;
4. testes de integração da reconexão, duplicidade e revelação final com o Firestore;
5. playtest presencial completo.

---

## 17. Convenções

- comentários de código em português;
- commits devem explicar o que mudou e por quê;
- testar contra o Firestore real antes de publicar;
- interface sem jargão de sistema;
- não revelar antecipadamente a surpresa narrativa;
- cores e tipografia vêm das variáveis CSS da mesa;
- manter HTML estático enquanto essa simplicidade continuar vantajosa.

---

## 18. Fonte de verdade

Em caso de conflito:

1. decisões consolidadas no Documento Técnico MOSAICO atualizado;
2. este HANDOFF;
3. arquivo de caso canônico;
4. comportamento implementado no código;
5. documentos históricos.

O motor V5 implementa as regras consolidadas de pontuação. As limitações restantes estão registradas na seção 13 e não alteram os pesos do placar.

---

**Prof. Mário César Nascimento, PhD ©**
