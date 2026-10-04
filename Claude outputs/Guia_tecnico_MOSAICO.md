# MOSAICO · Guia técnico

Como transformar a história de um caso em jogo. Vale para qualquer caso do MOSAICO. Pressupõe a história escrita e conferida segundo o *Guia da história*.

---

## 1. Regras consolidadas (não se volta atrás)

Foram decididas e testadas. Valem para todo caso novo, sem nova discussão:

1. **O humano nunca é o impostor.** O oculto e o vigia de fora nunca são humanos.
2. **Sem nomes próprios:** personagens pela função.
3. **A personalidade muda só a forma da fala, nunca o fato.** Nunca é mostrada ao jogador.
4. **O texto que é prova fica fixo:** não varia com personalidade nem com sorteio.
5. **A superfície nunca altera o gabarito** (seção 2).
6. **Ensino de gestos:** cada gesto novo de realidade aumentada é ensinado uma vez, na primeira peça que o usa, e **a narração assume se o jogador não agir**. A história nunca trava esperando um gesto. **Os gestos saem das ações que a história descreve** (o que o personagem abre, gira, ilumina, observa); a história não ensina gestos.
7. **O segredo fica com o próprio personagem.** Só o testemunho pode ir para o vigia de fora.
8. **O vigia de fora** (e quem mais estiver fora da cena) fala só por canal remoto, não entra nos postos nem nos acontecimentos ao vivo, nunca é o impostor e não mente. Não confundir com *o olhar de fora*, que está na casa e não segue esta regra.
9. **Só humanos pontuam.** Personagens do sistema ficam fora do placar.
10. **Nada se apaga sem substituição formal.** O que sai fica guardado e marcado como substituído, com data.
11. **Uma peça de RA por capítulo**, aberta dentro da tela do jogo, sem perder o estado.

---

## 2. As três camadas de variação

| Camada | O que muda | Altera a solução? | Como se valida |
| --- | --- | --- | --- |
| 1. Núcleo lógico | Impostor, ajudante, falso culpado, rota, quem o viu não estar | Sim: cada partida tem o seu gabarito | Auditoria humana, partida por partida |
| 2. Mesa | Tamanho da casa, número de humanos, quem é humano | Não | Teste automático de todas as combinações |
| 3. Superfície | Personalidade de cada personagem, números, cores, códigos, posição de objetos | Não | Teste automático e regra 5 |

Todo caso novo declara a sua conta:

- quantas **partidas lógicas** (P1…Pn);
- quantas **mesas** possíveis por partida;
- quantas **variações de superfície** (por exemplo: 6 tipos de personalidade elevados ao número de personagens);
- o que exige **auditoria humana** (só a camada 1).

---

## 3. A matriz dos seis eixos

Cada fato da história entra numa linha:

| Fato | Eixo | Fixo ou varia por partida | Capítulo em que aparece | Fonte (quem ou o que revela) | Capítulo em que é usado |
| --- | --- | --- | --- | --- | --- |
| | Há quanto tempo / Onde / Como / Quem / Qual e que tipo / Perspectiva | | | | |

Todo capítulo precisa ter pelo menos um fato em cada eixo.

---

## 4. A matriz de perspectivas

Para cada momento-chave de cada capítulo:

| Momento | Personagem | Onde estava | O que viu | O que ouviu | O que conclui | Por quê (posição e curiosidade) |
| --- | --- | --- | --- | --- | --- | --- |

Regras:

- Ninguém percebe o que a geografia não permite: confira as linhas de visão e de som da seção 5.
- O vigia de fora percebe só o que se vê de longe, sem rostos.
- Numa janela crítica, cada partida tem a sua tabela de percepção.

---

## 5. Geografia técnica

O mapa narrado da história vira dados:

- **Identificadores fixos:** cada cômodo e objeto com um id único (minúsculas, sem acento, com hífen), igual no texto, no 3D, na RA e no código.
- **Tabela de rotas:** origem → destino, passagens atravessadas, tempo em segundos, obstáculos (degrau que range, porta que bate).
- **Postos:** letras para as posições dos personagens nas janelas críticas, com o tempo de cada posto até o ponto central.
- **Linhas de visão e de som:** de cada posto, o que se vê e o que se ouve.
- **Regra de alcance:** quem alcança o ponto central no tempo da janela e quem não alcança. A exclusão por distância depende disso.

O modelo 3D, a maquete e as plantas são feitos **a partir desta tabela**, nunca o contrário.

---

## 6. A linha do tempo mestra

- **Por capítulo:** a posição de cada personagem em blocos de tempo, alinhada ao quadro do capítulo na história.
- **Janelas críticas:** grade segundo a segundo, só onde a dedução depende disso, com a posição de cada personagem, cada som, cada clarão, cada mensagem.
- **Âncoras:** as horas que aparecem no texto precisam bater com a grade.
- A grade é escrita **antes** da narração das janelas críticas, e a narração é conferida contra ela.

---

## 7. Critérios de consolidação das pistas

| Tipo | Definição | Uso |
| --- | --- | --- |
| Pista forte | Confirmada por duas fontes independentes (dois personagens em lugares diferentes, ou um personagem e um objeto) | Sustenta a solução |
| Pista fraca | Sustentada por uma fonte só | Orienta, não prova |
| Pista plantada | Falsa ou enganosa, aponta para o falso culpado | Cria dúvida; precisa ser desmontável |
| Prova | Texto ou objeto que fecha um ponto; fica fixo (regra 4) | Revelação |
| Exclusão | Um inocente situado longe do ponto central por alguém além de si mesmo, ou por distância | Argumento de exclusão |

Regras da solução:

- **O culpado mente nos pontos essenciais**, e cada mentira essencial é desmontada por uma pista forte.
- **Os inocentes podem mentir por medo ou vergonha** em pontos periféricos, que o segredo inocente explica.
- **Todo inocente que alcança o ponto central é situado por outra pessoa ou fonte.** Ninguém é descartado só porque ninguém o viu sair.
- **O falso culpado** tem rastro e motivo aparentes, e uma exclusão que o salva.

---

## 8. Papéis por partida e sorteio

**Papéis da partida:**

- o **impostor**, sempre do sistema;
- o **ajudante**, consciente ou inconsciente; consciente quer dizer que mente de propósito, e nesse caso nunca é humano;
- o **falso culpado**.

**A casa por blocos:**

- **núcleo de 6**, a casa mínima;
- **três blocos de 2**, que formam as casas de 8, 10 e 12;
- **os que completam:** a testemunha técnica, só com a casa cheia; o oculto e o vigia de fora, sempre presentes.

Cada partida declara a casa mínima em que funciona. Lugares para humanos = personagens da casa − o impostor (− o ajudante consciente, se houver).

**Sorteio:**

- A partida é sorteada entre as que têm lugar para todos os humanos.
- Os humanos recebem primeiro as funções do núcleo, depois as dos blocos, na ordem.
- O ajudante e o falso culpado vão de preferência para humanos.
- Tudo o que o sistema sorteia (partida, semente, quem é quem, números) é gravado e não muda com recarga.

**Quem pode vestir cada papel.** A história é uma só (Guia da história, seção 1). Para que cada partida funcione sem reescrevê-la, os papéis vão para personagens cujas características permitem um ajuste pequeno:

| Papel | Critérios para o personagem |
| --- | --- |
| Impostor | Alcança o ponto central no tempo da janela (regra de alcance, seção 5); tem o conhecimento ou o acesso que o *como* exige; o rastro achado pode ser dele sem trocar o texto de prova; a história já lhe dá motivo ou interesse (o que tem a perder, a relação com a vítima); nunca é o vigia de fora nem o oculto; suas falas que são prova fixa não o desmentem |
| Falso culpado | Aparência forte: rastro, motivo e um segredo inocente que o compromete; tem uma exclusão vinda de outra fonte, e essa exclusão pode chegar numa das viradas (o parecer que cai) |
| Ajudante | Está perto do impostor no tempo ou no lugar; se consciente, nunca é humano |

- **Ajuste fácil:** prefira personagens cuja diferença para a versão escrita caiba em poucos pontos marcados (onde estava, quem o viu não estar, um detalhe do rastro). O resto do texto não muda.
- Cada partida registra quais pontos ajustou. Se o ajuste pedir mudar um fato do cânone ou o final, aquele personagem não serve para aquele papel.

**Quem já estava:** se houver personagens que já estavam no lugar, o humano que os recebe vive o outro começo, com o mesmo volume, até o núcleo comum.

---

## 9. Códigos e convenções

| Código | Significado |
| --- | --- |
| P1…Pn | Partidas lógicas |
| A, B, C… | Postos nas janelas críticas |
| Segundos (+20 s, +122 s) | Tempo desde o início de uma janela crítica |
| ids de cômodo e objeto | Minúsculas, sem acento, com hífen |
| ids de personagem | A função, em minúsculas, sem acento |
| Semente da partida | Gera números, cores, tipos de personalidade e posições |
| Números de contato | Dois dígitos por personagem, sorteados pela semente |
| Código de faro | Histórico do jogador entre partidas, gerado no aparelho, sem servidor |
| Parâmetros de teste | Forçam partida, personagem, número de humanos, tipo de personalidade e velocidade |

---

## 10. Personalidades

**Os 6 tipos** que o jogo aplica sobre as falas:

| Tipo | Perfil (Cinco Grandes e HEXACO) | Como aparece na fala |
| --- | --- | --- |
| Explosivo | Neuroticismo alto, amabilidade baixa | Acusa, exclama, reage na hora |
| Calmo opaco | Neuroticismo baixo, extroversão baixa | Frases curtas; não se abala, não se abre |
| Ingênuo | Amabilidade alta, abertura alta, honestidade alta | Acredita, conta demais sem perceber |
| Leal cego | Amabilidade alta, conscienciosidade alta | Defende quem confia, mesmo contra a evidência |
| Evasivo | Honestidade-humildade baixa, extroversão baixa | Desconversa, devolve pergunta, meia-verdade |
| Burocrata | Conscienciosidade alta, abertura baixa | Procedimento, registro, "conforme consta" |

**Os 5 traços (0 a 1)** e o fator correspondente:

| Traço | Fator correspondente |
| --- | --- |
| Reatividade | Neuroticismo |
| Confiança | Amabilidade e honestidade |
| Filtro | Conscienciosidade |
| Lealdade | Amabilidade |
| Esfriamento | Estabilidade emocional |

**Regras:**

- O tipo de cada personagem é sorteado pela semente da partida e nunca mostrado.
- Muda só a forma; a informação de cada fala é a mesma nas 6 versões.
- O teto de grosseria é médio: ofensa sem palavrão.
- **Exceção de prova:** quando a solução depende do texto exato ou do momento de uma fala, aquele personagem fica no tipo do cânone naquela partida.
- **A matriz de falas:** cada fala do jogo é escrita nas 6 versões numa planilha, que gera o arquivo que o jogo lê. Sem o arquivo, o jogo usa o texto original.
- A personalidade de fundo descrita na ficha (Guia da história, 4.5) orienta a escrita; o tipo sorteado só muda o tom por cima.
- **O "nunca diria" da ficha é limite:** as 6 versões de cada fala respeitam o que a ficha diz que o personagem nunca diria. Se um tipo exigir isso, a versão daquele tipo é reescrita dentro do limite.

---

## 11. A curiosidade de quem joga (5DC)

Cada capítulo deve alimentar as cinco dimensões de curiosidade de Kashdan, para que jogadores diferentes encontrem o seu motor:

| Dimensão | No jogo |
| --- | --- |
| Exploração prazerosa | Peças de RA e maquete para explorar sem pressa; achados escondidos |
| Sensibilidade à privação | A grande questão do capítulo; lacunas que só fecham depois; plantações e colheitas |
| Tolerância ao estresse | Relógio do capítulo, escuro, decisão sob incerteza |
| Curiosidade social | Grupo, privadas, debate da mesa, frases de conversa |
| Busca por emoção | Aposta com certeza (ganha ou perde mais), argumento que pode valer negativo, gesto na hora da cena |

No checklist de cada capítulo: *quais das cinco este capítulo alimenta, e como?*

---

## 12. Conversa e envios

- **Envios:** cada capítulo dá um número fixo de envios. Cada frase ou anexo enviado gasta um. Achados escondidos dão envios extras. No prólogo é livre.
- **Frases prontas:** o jogador não escreve livremente; escolhe entre frases que aparecem ao longo do capítulo, conforme a história chega nelas.
- **A mistura:** cerca de **metade útil, metade conversa**.
  - **Útil:** a resposta traz informação para a dedução.
  - **Conversa:** a resposta é verdadeira e coerente com a cena, mas não traz pista. Quem escolhe por engano ou desatenção perde o envio.
  - **Neutra:** uma por capítulo, claramente sem conteúdo ("vamos ficar juntos").
- **Regras das frases de conversa:**
  - nunca tocam em segredo de personagem;
  - nunca encostam no que é pista;
  - nunca contradizem o cânone;
  - nunca inventam fatos novos sobre o lugar.
- **Quem responde:** no grupo, um personagem do sistema escolhido pela semente; no privado, o número com quem se fala.

---

## 13. A mesa

- **De 1 a 12 humanos**, por código de sala. O sistema completa os personagens que faltam.
- **Ritmo:** capítulos sincronizados. O seguinte abre quando todos terminam, ou quando quem conduz a mesa avança.
- **Fala pronta de um personagem humano** sai como narração para todos ("o personagem disse…"), nunca como mensagem que ele não escreveu.
- **Entre humanos:** só frases prontas e anexos. O debate livre é em voz alta, na mesa.
- **Gestos de RA de um humano:** a história espera em todos os aparelhos até o gesto ser feito ou o prazo acabar.
- **Prólogo sem relógio;** capítulos com relógio comum; perguntas e aposta sem tempo.

---

## 14. Peças de realidade aumentada

Para cada peça:

| Capítulo | Peça | O que mostra | O que não pode mostrar ainda | Gesto novo ensinado | Saída se o jogador não agir |
| --- | --- | --- | --- | --- | --- |

- A peça é modelada a partir da geografia técnica e do inventário da história.
- Ela só mostra o que o capítulo pode revelar; o resto fica para depois.
- Cada peça funciona também sozinha, fora da partida, para demonstração.

---

## 15. Plantações, colheitas e palavras proibidas

**Plantações e colheitas:**

| Planta (capítulo e cena) | O que é | Colhe (capítulo e pergunta) |
| --- | --- | --- |

Toda pergunta de capítulo tem a sua resposta plantada antes ou no próprio capítulo. Toda revelação do final tem plantação.

**Palavras proibidas por capítulo:** termos que antecipam o que só aparece depois. Exemplos de categoria: o nome de um lugar ainda não descoberto, o documento que só aparece no fim, o segredo de um personagem. A lista é verificada por teste automático em todas as combinações de partida e personagem.

---

## 16. Pontuação e títulos

- **Perguntas:** com certeza, +4 ou −4; sem certeza, +2 ou −1; não sei, 0. A secundária vale metade, e as finais têm peso maior.
- **Argumento de exclusão:** opcional, um por capítulo a partir da metade do jogo. +1 com a pista certa, 0 com pista errada, −1 se o excluído for o impostor.
- **Títulos no solo:** por meta (faro, método, escuta, coração, sob suspeita).
- **Títulos no grupo:** comparativos entre humanos, com ranking; empate divide o título.
- **Referência:** o máximo possível nas perguntas; "boa noite" a partir da metade.
- **Estilo declarado:** o jogador escolhe antes do Capítulo 1 como pretende investigar, e o jogo mostra no fim se confirmou.
- **Cartão e código de faro:** imagem por partida e código que acumula o histórico, sem servidor.

---

## 17. Níveis de dificuldade (a definir)

Espaço reservado. Alavancas possíveis: dicas do capítulo, tempo do capítulo, número de envios, proporção de frases de conversa, lembretes da narração.

---

## 18. O processo

1. **Uma decisão por vez,** com o mapa inteiro à vista.
2. **Registro de decisões:** cada caso mantém o seu mapa de decisões e pendências.
3. **A bíblia antes do código:** história, mapa narrado, linha do tempo, matrizes e tabelas de papéis prontas antes de programar.
4. **Checklist por capítulo, antes de programar:**
   - [ ] geografia e linhas de visão conferidas
   - [ ] peça de RA × narração
   - [ ] ensino do gesto
   - [ ] o jogador em cada papel, inclusive quem já estava
   - [ ] vazamentos para capítulos futuros (palavras proibidas)
   - [ ] plantações exigidas adiante
   - [ ] personagens ausentes nas casas menores
   - [ ] as cinco dimensões de curiosidade alimentadas
   - [ ] a mistura útil × conversa
5. **Testes automáticos a cada mudança:**
   - todas as combinações de partida e personagem;
   - fichas de texto sem trocar e valores vazios;
   - personagem ausente que aparece falando;
   - palavras proibidas;
   - perguntas que não montam;
   - erros de execução;
   - uma partida inteira de cada, do começo ao placar.
6. **Substituição formal:** o que sai fica guardado e marcado como substituído, com data.
