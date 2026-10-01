# O Impostor · A Casa da Costa — Auditoria de ponta a ponta

30/09/2026 · revisão 2 do caso comparada com tudo o que já existe: a mesa (prólogo e Caps. 1 a 4), as peças de RA, a maquete, as plantas, os modelos 3D e o que os Caps. 5 e 6, a Acusação, a Revelação e o Epílogo vão exigir.

Foram 4 frentes de auditoria:

- geografia × modelos;
- textos × cânone, em 156 combinações de partida × papel geradas e lidas;
- conteúdo das peças de RA × narração;
- dependências do que falta escrever.

**Boa notícia:** as tabelas da matriz já implementadas (Caps. 1 a 4, postos, voz) batem célula por célula com o documento. Os furos estão em outro lugar: na casa, nos papéis do jogador, no que as peças mostram e no que o cânone ainda não escreveu.

---

## 1. Por que o furo do jardim passou

Fomos capítulo a capítulo, a partir do texto, e cada peça de RA foi conferida só contra o seu capítulo. Ninguém conferiu as peças entre si, nem contra a casa inteira.

A maquete, as plantas, a bandeja, a escrivaninha e o quarto vêm de versões anteriores à revisão 2. Desenham outra casa e contam detalhes de outra história. Faltava um mapa-mestre (a casa, os papéis, o que cada um percebe, o que cada peça mostra) para conferir antes de programar.

O item 6 propõe o processo para isso não se repetir.

---

## 2. Bloqueios — decidir antes de qualquer código novo

### B1 · A casa: a maquete e as plantas contradizem o apagão inteiro

A maquete e as três plantas desenham a mesma casa: um bloco de 16 × 6,5 m com um corredor leste-oeste. Essa casa não comporta o cânone.

| # | O cânone precisa de | A maquete / plantas têm | Consequência |
|---|---|---|---|
| G1 | Biblioteca vizinha da sala do relógio, porta de correr com degrau (B, 8 s) | Biblioteca do outro lado do corredor, porta de abrir de frente para a guarda | As rotas de B (P2, P5, P11, P12) passam no colo da guarda |
| G2 | Passagem no térreo, da despensa até a portinhola atrás do painel, por trás do quarto (E 9 s, F 12 s) | `passagem-oculta` é um túnel no porão até a guarita; "portinhola" é o vidro do mostrador | E e F não alcançam o relógio (P4, P7, P8, P15 quebram) |
| G3 | Sala de jantar a 14 s e cozinha a 16 s | A sala de jantar tem porta direta para a sala do relógio (~5 s); cozinha ~8 s | H e G passam a alcançar; o gabarito quebra |
| G4 | Jardim interno, pátio cercado pela casa, varanda coberta (C, 10 s na chuva) | Jardim atrás da casa, com sebe; as varandas são alpendres externos | Cap. 4 e posto C impossíveis |
| G5 | Janela dos retratos (D) no fim do corredor, vendo o jardim e a mesa da ata | O corredor termina em parede cega | As exclusões de P1, P7, P9, P10, P14 ficam sem base |
| G6 | Vestíbulo (rádio VHF) e patamar enxergam o corredor | O hall não tem porta para o corredor; escada fechada; rádio = antena da guarita, telefone vermelho na torre | I e J cegos; o trajeto L→I com a tela acesa não existe |
| G7 | Quadro de luz no porão; escadinha sai da despensa e range | Quadro no corredor do térreo; alçapão na cozinha | O Eletricista não tem por que descer |
| G8 | Copa entre a cozinha e a sala de jantar; quarto com portinha para a copa (fuga do Cap. 6) | Não há copa; o quarto abre por sacada direto para o jardim | A fuga do Cap. 6 fica sem caminho |
| G14 | Sala de estar (L, 17 s) | Não existe | — |

**Furos no próprio cânone, que a casa nova precisa resolver por escrito:**

- **G9 · degrau dentro da parede, ouvido da janela D** (P1, e as marteladas na P9). A passagem passa por trás do quarto, do outro lado do pátio. Ou a passagem corre junto ao corredor dos retratos, ou P1 e P9 são reescritas.
- **G10 · por onde se sai do pátio para fora.** A pessoa foge no Cap. 6 e não é mais achada.
- **G11 · "frestas do painel" vistas da porta do quarto** (P4). O painel fica junto ao relógio, longe de E.
- **G12 · "porta de vidro da biblioteca".** Falta dizer se é a porta-janela para o pátio ou uma porta envidraçada para o corredor.
- **G13 · o farol vê o pátio, a vidraça da sala e a janela D.** Falta a direção do farol e a altura das alas, para o feixe entrar.

**Recomendação:** adotar como mestre a casa em pátio do cânone. A disposição da peça do jardim já respeita quase tudo. Com ela:

1. desenhar a planta-mestre do térreo e aprovar;
2. depois refazer a maquete (térreo, porão, telhado e andar de cima) e as três plantas;
3. retestar o prólogo.

### B2 · O jogador pode receber o personagem do impostor

- **O sorteio não olha o papel.** `P_R2` sorteia a partida só pela casa, sem considerar o papel humano.
  - Com o papel padrão (Investigador) numa casa de 8, a P13 sai uma vez em três, e nela o Investigador é o impostor.
  - Nesses casos o jogador "diz" as mentiras do impostor. Já acontece hoje nos Caps. 3 e 4.
- **A tela de abertura contradiz a regra.** "Como jogar" e o fim do prólogo dizem **"Um de vocês não é quem diz"**, mas o cânone diz que nenhum humano é traidor.
- **Os papéis que deveriam ir para o humano não vão.** O cânone manda dar ao humano o **ajudante** e o **falso culpado** "enquanto houver humano para eles". Nada no código faz isso.
- **Mentiras deliberadas:**
  - **P5:** o Tabelião é ajudante consciente e mente de propósito. Não pode ser humano.
  - **P1:** o Policial mente sobre a porta.

### B3 · O Cap. 5 não está escrito para quem não é da P12

- **O cânone só narra a P12 inteira.** Nas outras partidas há só fragmentos (Postos e exclusões, Ausência, diálogos).
- **Falta a tabela de percepção.** Antes de programar, é preciso uma tabela do que cada posto percebe nos 122 s (clarões em +12, 32, 52, 72, 92 e 112; sons; a tela acesa da mensagem do escuro), por partida.
- **O mecanismo de pausa não serve aqui.** Os portões do Cap. 3 param a história, e o Cap. 5 é cronometrado: a louça precisa cair junto com o raspado, aos 80 s.
- **Faltam regras para o humano no escuro:**
  - o que ele faz quando a matriz manda o seu personagem agir (sair da porta, derrubar a louça, martelar, andar com a tela acesa);
  - se o chat fica travado durante o apagão.

### B4 · O Cap. 6 depende de coisas que os capítulos anteriores não plantaram

- **Saída deixada aberta:** a pergunta "Quem deixou a saída aberta?" precisa de um gesto plantado antes. Só a P12 (a Herdeira abre a varanda) e a P6 (a portinhola encostada) têm esse gesto. Faltam as outras 11 partidas.
- **Deslocamentos durante o apagão:** L→I, J→K, E→F→E e I→I não estão guardados.
- **Caderno, adendo e "quem estava onde":** o conteúdo existe só em fragmentos para a maioria das partidas.

### B5 · A peça do quarto é de outra versão e sai da mesa

- **Abre fora da mesa:** a peça abre por `href`, e quem a abre perde todo o estado (respostas, apostas, marcas).
- **O conteúdo é antigo:**
  - e-mails de cartório com "lacres de papel";
  - porta-comprimidos;
  - uma chave de corda duplicada;
  - "armadilhas" que não ligam nada.
- **Falta o que o cânone pede:**
  - o caderno azul e a folha dos três lembretes;
  - a lâmpada tirada do bocal;
  - o gato, o jasmim de verdade;
  - a portinha para a copa.

---

## 3. O que já está feito e precisa de ajuste (por capítulo)

### Prólogo e Cap. 1

- **ALTA · A pergunta principal fica trivial quando a resposta é um funcionário** (P2, P4, P8, P10, P12, P15). Com a véspera, todos os funcionários "voltaram à casa" à vista de todos. É preciso reformular a pergunta ("com a casa fechada", "antes de ontem") ou as falas.
- **ALTA · A xícara.**
  - O cânone tem uma xícara sozinha, no aparador, de borda verde, com café frio e película.
  - A narração fala em "sete xícaras" e a janela da bandeja em "seis".
  - Na peça, a intrusa tem o mesmo filete azul e o "fundo limpo" (ou seja, sem café).
  - A marca da intrusa é um **jasmim pintado**, o que antecipa o "quarto do jasmim" do Cap. 4.
- **MÉDIA:**
  - Na casa de 6, alguém diz "ninguém de nós chegou à tarde", mas o cânone diz que as chegadas foram à tarde.
  - Contar os números do grupo já no Cap. 1 antecipa a voz a mais do Cap. 2.
  - O funcionário humano vê narração que é só dos convocados.
  - "Porão, um ótimo esconderijo!" sugere alguém escondido no porão.
  - A bandeja não ensina raspar nem a ideia de ordem.

### Cap. 2

- **ALTA · A escrivaninha não tem gancho na narração da revisão 2.**
  - A peça abre em silêncio.
  - A dica da conta de celular ficou órfã: era ligada ao Cap. 2 antigo.
  - Ela pode alimentar o debate "por que ninguém sabe o número do dono".
- **MÉDIA · Papéis da escrivaninha que contradizem ou entregam:**
  - "o relógio adianta, acertar depois" contradiz "como ele deixava" e a P15;
  - "trocar a lâmpada que pisca" explica de antemão a luz do corredor;
  - "pagar o faroleiro" tira a neutralidade dele;
  - a "ração p/ gato" antecipa o gato do Cap. 6;
  - "mostrar a ela" puxa a suspeita para uma mulher;
  - "a lista fica com o Tabelião" aparece em mesa de 6, que não tem Tabelião.
- **MÉDIA · "Escritório" não existe no cânone.** O mesmo vale para "hall" (no cânone é vestíbulo) e "sala" (que hoje vale tanto para a sala do relógio quanto para a sala de estar).
- **BAIXA:** a mensagem privada do prólogo cita o bilhete da escrivaninha antes de ela abrir.

### Cap. 3

- **ALTA · Vazamento.** A fala do chat "Tem alguma coisa atrás daquele fundo" sai da boca de inocentes e de impostores e entrega o mecanismo. Trocar por algo sem mecanismo.
- **ALTA · O portão pode travar a história.** Se o jogador não fizer o gesto, o capítulo acaba sem a cena. Precisa de uma saída: a narração assume depois de N segundos, ou o relógio do capítulo para.
- **ALTA · Gestos não ensinados:** porta de vidro, segurar o pêndulo, puxar e soltar, portinhola, chave.
- **MÉDIA:**
  - A marca da mão é sempre a mesma na peça, mas a matriz muda por partida (tinta, lã, barro, cal).
  - No modo "só olhar", dá para abrir a gaveta, mas no cânone quem a abre é o condutor, com a caneta.
  - Detalhes de marca inventados:
    - Policial "luva de couro" (o cânone diz que ele foi ligar no jardim);
    - Jardineiro "oleado" (o oleado está seco no cabide);
    - Governanta "sabão" (o cânone diz janela do jasmim).
- **BAIXA:** na P9, o trecho do Jornalista filmando entra antes das palavras na carta.

### Cap. 4 (você vai pedir para voltar)

- Falta a saída aberta (B4).
- A fala do Residente sobre os segundos foi inventada. Na P1 ele é o impostor.
- "Porta da despensa" e "porta de serviço" podem ser a mesma porta: no cânone o posto F é "despensa e porta de serviço".
- Falta, na P12, "a Observadora com ele, a convite do próprio Tabelião".
- A dica do capítulo cita as trilhas, mas elas não vão para o inventário.
- **A peça do jardim combina com o cânone.** Pode ser mantida se a casa-mestre for a do pátio.

### Transversais

- **O jogador "fala" falas fixas.** São 190 casos de "disse você", "perguntou você": o jogador confessa a passagem, lê marcas, guarda a porta sem ter escolhido. É preciso uma regra:
  - **(a)** o narrador fala por ele;
  - **(b)** a fala chega como sugestão no privado ("Você pode dizer: …");
  - **(c)** reescrever em terceira pessoa neutra.
- **Ensino:** é preciso uma regra única. Hoje fotografar é explicado três vezes e outros gestos nenhuma.
- **Envios extras:** o achado entre capítulos se perde, porque o capítulo seguinte zera para 3.
- **Pontuação:**
  - o texto do "Não sei" promete pontos, mas no cânone vale 0/0;
  - faltam os pesos (×0,5, ×1, ×2, ×3), o placar, o faro e os títulos.
- **Formato das respostas:** hoje é sempre uma certa entre quatro. O que vem depois precisa de:
  - várias respostas certas (P12);
  - conjunto exato (marque todos);
  - opções fora da casa ("a pessoa escondida", "a voz").
- **Multijogador (depois):** hoje cada aparelho sorteia a sua partida. Quando houver sala, a partida precisa vir dela.
- **Livro do farol:** continua no laboratório. Arquivar como fora do caso.

---

## 4. O que falta criar (visão geral)

| Bloco | Situação |
|---|---|
| Cap. 5: roteiro de 122 s, percepção por posto, ações do humano, sons, clarões, perguntas (incl. marque todos) | Falta, e falta também no cânone, salvo a P12 |
| Cap. 6: quarto, fuga, caderno, adendo, relógio em 21h34 com papel na gaveta, "quem estava onde" | Falta. Os modelos têm parte; a peça do quarto precisa ser refeita |
| Acusação, Revelação, Epílogo | Só a P12 está escrita |
| Pontuação, faro, títulos, estilo declarado, código, palavra da personagem, argumento de exclusão, pergunta de valor | Falta |

---

## 5. Decisões, na ordem em que destravam o resto

1. **Casa-mestre:** a casa em pátio do cânone vira mestre, com planta aprovada antes do 3D, e maquete e plantas são refeitas a partir dela? (Recomendado: sim.)
2. **Furos de geografia no cânone** (G9 a G13): eu proponho as soluções na planta-mestre e você aprova?
3. **Papel do jogador:** o sorteio nunca dá o impostor ao humano, e o humano recebe de preferência o ajudante ou o falso culpado? (Recomendado: sim. O Tabelião da P5 fica sempre com o sistema.)
4. **Falas do personagem do jogador:** narrador, sugestão no privado ou terceira pessoa?
5. **Cap. 5:**
   - 122 s em tempo real, com tela escura e clarões, ou narrado?
   - Ações do humano numa janela de tempo, com a narração assumindo se ele não agir?
   - Chat travado no escuro?
6. **Tabela de percepção do Cap. 5 nas 13 partidas:** eu derivo e você revisa, e ela entra no cânone antes do código?
7. **Saída aberta no Cap. 4** para as 11 partidas que faltam: plantar por volta de 21h20?
8. **Ensino:** regra única (cada gesto novo explicado uma vez, na primeira peça que o usa)?
9. **Xícara e escrivaninha:** alinhar as peças ao cânone ou ajustar o cânone às peças?
10. **Pontuação:** visível, com os pesos do cânone? E corrigir o "Não sei".

---

## 6. Processo para não haver mais retrabalho

1. **Bíblia de produção antes do código.** Um único documento-mestre com:
   - a planta aprovada, com nomes fixos dos cômodos;
   - a tabela de papéis por partida (impostor, ajudante, falso culpado, quem pode ser humano);
   - a tabela de percepção do Cap. 5;
   - o inventário de cada peça de RA: o que mostra, em que capítulo, o que não pode mostrar ainda;
   - as plantações e as colheitas (o que um capítulo planta e qual capítulo usa).
2. **Checklist por capítulo, antes de programar:**
   - geografia;
   - peça de RA × narração;
   - ensino do gesto;
   - jogador em cada papel;
   - vazamento para capítulos futuros;
   - plantações exigidas adiante;
   - personagens ausentes na casa de 6 e de 8.
3. **Teste automático a cada mudança:** gerar as 156 combinações de partida × papel e procurar personagem ausente, "disse você" em fala-chave, palavras proibidas (21h34 antes da hora, jasmim antes do Cap. 4, etc.) e erros de JS.
4. **Uma decisão por vez, mas com o mapa inteiro à vista:** cada decisão nova é conferida contra a bíblia antes de virar código.
