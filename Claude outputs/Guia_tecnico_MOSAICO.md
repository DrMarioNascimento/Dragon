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

| Id | Fato | Eixo | Fixo ou varia por partida | Capítulo em que aparece | Fonte (quem ou o que revela) | Degrau da escada | Usado em |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | Há quanto tempo / Onde / Como / Quem / Qual e que tipo / Perspectiva | | | | 1 a 6 | cenas, perguntas, peças de RA, frases prontas, quadros |

- Todo capítulo precisa ter pelo menos um fato em cada eixo.
- **Id:** cada fato, pista e cena tem um identificador fixo. A coluna *Usado em* é o mapa de dependências da revisão (seção 19.2).
- **Degrau:** em que degrau da escada de revelação (Guia da história, 7.4) o fato pode chegar ao jogador. Nunca antes.

---

## 4. A matriz de perspectivas

Para cada momento-chave de cada capítulo:

| Momento | Personagem | Onde estava | O que viu | O que ouviu | O que conclui | Por quê (posição e curiosidade) |
| --- | --- | --- | --- | --- | --- | --- |

Regras:

- Ninguém percebe o que a geografia não permite: confira as linhas de visão e de som da seção 5.
- O vigia de fora percebe só o que se vê de longe, sem rostos.
- Numa janela crítica, cada partida tem a sua tabela de percepção.
- **Ponto de vista na narração do jogo:** a narração do sistema também não antecipa o que nenhum personagem poderia saber naquele momento. A versão de cada jogador mostra só o que o personagem dele pode perceber, da posição em que está.
- **Curiosidade da ficha:** o que cada personagem percebe bate com a curiosidade descrita na ficha (Guia da história, 4.5 e 4.6).

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

## 14. Ações encenáveis e peças de realidade aumentada

**Tabela de ações encenáveis.** É a passagem da literatura encenável (Guia da história, seção 1) para o jogo. Uma linha por ação relevante da história:

| Id da cena | Personagem | Ação (o que toca, abre, gira, esconde, desloca) | Objeto (id) | Posto ou cômodo | Tempo | Vira no jogo |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | gesto de RA / evento da narração / som / peça / nada |

- Os gestos de RA saem desta tabela (regra 6); nenhum gesto é inventado sem uma ação da história por trás.
- Ação que vira gesto ou evento leva junto a consequência humana da cena, na narração que vem depois.

**Peças de realidade aumentada.** Para cada peça:

| Capítulo | Peça | O que mostra | O que não pode mostrar ainda | Gesto novo ensinado | Saída se o jogador não agir |
| --- | --- | --- | --- | --- | --- |

- A peça é modelada a partir da geografia técnica e do inventário da história.
- Ela só mostra o que o capítulo pode revelar; o resto fica para depois.
- Cada peça funciona também sozinha, fora da partida, para demonstração.

### Diretriz de criação da realidade aumentada

**Princípio central.** A RA transforma uma evidência, um ambiente ou uma relação lógica da história em investigação visual. Não é ilustração decorativa, cena animada nem atalho para a solução: oferece ao jogador matéria concreta para observar, comparar, organizar e interpretar, preservando o suspense e o direito de formular hipóteses.

**Objeto ou ambiente dominante.** Cada experiência parte de uma peça material reconhecível e coerente com o capítulo, que a história já tornou importante (Guia da história, 10.6): um móvel, um recipiente, um registro, um instrumento de medida, uma reconstrução do espaço. O cenário é vazio, sem pessoas, rostos ou avatares. Quando uma perspectiva humana for necessária, ela aparece por funções, cartões, vestígios, campos de visão e registros.

**Interação compatível com celular.** Todas as ações essenciais ocorrem por toque, seleção, ampliação, abertura de compartimentos e arraste na tela. **A solução nunca depende** de som, fala, deslocamento do jogador, movimento do aparelho, reconhecimento de pessoas, precisão corporal, animação ou gesto. Movimento pode existir como ambiente; gesto pode existir, mas a narração assume se o jogador não agir (regra 6). Informação que na história é sonora vira transcrição, metadado, padrão visual ou cartão comparativo.

**Momento de ativação.** A RA só é liberada depois que o texto público apresentou os objetos, registros e vestígios necessários. Nenhum compartimento, cartão, rótulo ou opção antecipa uma descoberta, uma prova ainda inexistente, a autoria, o mecanismo completo ou o desfecho (seção 15, a escada). Elementos posteriores ficam ocultos e são liberados em etapas, conforme a investigação avança.

**Função dedutiva.** Cada RA responde a uma pergunta limitada do capítulo e mantém ao menos uma interpretação concorrente plausível. Pode eliminar hipóteses incompatíveis, demonstrar oportunidade, confirmar correspondências físicas ou revelar uma discrepância. Não converte indício em culpa nem apresenta como certeza o que a narrativa ainda trata como hipótese.

**Progressão e persistência.** A sequência avança de orientação espacial para inspeção, comparação, cruzamento de versões e reconstrução. Resultados confirmados viram cartões persistentes (no inventário) e reaparecem nas experiências de convergência, sem obrigar a repetir inspeções concluídas. A RA final reorganiza evidências já conquistadas; não recomeça a investigação.

**Coerência técnica e narrativa.** Medidas, horários, pesos, denominações, rotas, nomes de ambientes, campos de visão, acessos e estados dos objetos correspondem ao cânone e aos ids da geografia técnica (seção 5). Toda conclusão respeita a diferença entre fato observado, interpretação do personagem e segredo periférico. Cálculo físico usa a composição declarada na história, não equivalências genéricas.

**Integração com o MOSAICO.** Big Five e 5DC orientam o que cada perspectiva nota, insiste em investigar, tolera ou evita, mas nunca aparecem como rótulos para o jogador. A RA materializa limites de percepção: posições diferentes podem produzir versões verdadeiras ao mesmo tempo, incompletas ou aparentemente contraditórias (seção 4).

**Critério de encerramento.** O que a RA mostra sozinha é **pista fraca**; uma conclusão decisiva exige uma evidência material e uma confirmação de outra fonte, independente (pista forte, seção 7). Autoria material, auxílio involuntário, falha de procedimento, mentira periférica e encobrimento posterior continuam categorias separadas. A experiência termina quando o jogador sustenta uma relação entre provas, não quando o sistema aponta uma resposta.

**Checklist de validação.** Antes de aprovar uma RA:

- [ ] o objeto central pertence organicamente à história;
- [ ] a interação funciona só no celular e sem som;
- [ ] a solução não depende de animação nem de gesto;
- [ ] todas as peças já foram apresentadas pela narrativa;
- [ ] nenhuma opção revela o caso antes da hora;
- [ ] a atividade produz dedução, não leitura passiva;
- [ ] as falsas pistas continuam justificáveis;
- [ ] o resultado persiste para os capítulos seguintes;
- [ ] os dados coincidem com o cânone;
- [ ] existe alternativa em texto para toda informação visual;
- [ ] a experiência acrescenta uma forma nova de investigar, sem repetir a mecânica do capítulo anterior.

---

## 15. Plantações, colheitas, escada de revelação e palavras proibidas

**Plantações e colheitas:**

| Planta (capítulo e cena) | O que é | Degrau | Colhe (capítulo e pergunta) |
| --- | --- | --- | --- |

Toda pergunta de capítulo tem a sua resposta plantada antes ou no próprio capítulo. Toda revelação do final tem plantação.

**A escada de revelação no jogo** (Guia da história, 7.4):

- Cada capítulo registra **em que degrau está**.
- Nenhuma pergunta, título, cartão, chamada ou frase pronta chega a um degrau antes da hora, nem pelo conteúdo nem pela forma de perguntar.
- A pergunta pode derrubar a hipótese anterior sem apontar a correta (o parecer que cai).
- No Cap. 8, **autoria, mecanismo e intenção são perguntas separadas**.

**Direção interna fora da tela** (Guia da história, 1.1):

- O jogo lê só o texto público. A direção interna (solução, fichas, cronologia, quadros) nunca vai para arquivos que o jogo mostra.
- **Palavras proibidas por capítulo:** termos que antecipam o que só aparece depois. Exemplos de categoria: o nome de um lugar ainda não descoberto, o documento que só aparece no fim, o segredo de um personagem. A lista é verificada por teste automático em todas as combinações de partida e personagem, e cobre também **títulos, chamadas, cartões, a página de entrada e o sumário**.

**O recorte das 900 palavras.** Cada capítulo registra quais trechos da história vão para a mesa e quais ficam de reserva. Nenhuma pista, pergunta ou exclusão pode depender de um trecho que ficou fora do jogo.

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
   - [ ] peça de RA × narração, aprovada pelo checklist de validação da seção 14
   - [ ] ensino do gesto
   - [ ] o jogador em cada papel, inclusive quem já estava
   - [ ] vazamentos para capítulos futuros (palavras proibidas)
   - [ ] plantações exigidas adiante
   - [ ] personagens ausentes nas casas menores
   - [ ] as cinco dimensões de curiosidade alimentadas
   - [ ] a mistura útil × conversa
   - [ ] degrau da escada registrado, e nada passou dele (perguntas, títulos, cartões)
   - [ ] ações encenáveis registradas; gestos e eventos com ação da história por trás
   - [ ] narração sem antecipar o que nenhum personagem poderia saber
   - [ ] recorte do capítulo registrado; nenhuma pista depende de trecho de reserva
   - [ ] falas de cada personagem fiéis à ficha (Big Five/HEXACO e "nunca diria") nas 6 versões
   - [ ] o que cada personagem percebe bate com a curiosidade da ficha (5DC)
5. **Testes automáticos a cada mudança:**
   - todas as combinações de partida e personagem;
   - fichas de texto sem trocar e valores vazios;
   - personagem ausente que aparece falando;
   - palavras proibidas;
   - perguntas que não montam;
   - erros de execução;
   - uma partida inteira de cada, do começo ao placar.
6. **Substituição formal:** o que sai fica guardado e marcado como substituído, com data.

---

## 19. Revisão e auditoria sem perda de qualidade

Toda revisão corre dois riscos: **a correção lógica que achata a prosa** (o narrador ganha uma frase de explicação para tapar o buraco) e **a mudança local que quebra algo longe** (um objeto muda de cômodo e mexe em rotas, linhas de visão, maquete e peças). Estas regras valem para revisões, auditorias e ajustes, feitos por pessoa ou por IA.

### 19.1 Classificar a mudança antes de mexer

| Camada | Exemplo | O que reconferir |
| --- | --- | --- |
| Cânone | um fato, uma rota, um objeto, um cômodo | seis eixos, perspectivas, linha do tempo, pistas, perguntas, ações encenáveis, RA, maquete |
| Núcleo lógico | quem veste qual papel numa partida | aquela partida inteira, critérios de papel (seção 8), exclusões |
| Texto literário | uma cena, uma fala | as cenas vizinhas, voz, escada, palavras proibidas, recorte |
| Superfície | o tom de um tipo de personalidade | o "nunca diria", a exceção de prova |

### 19.2 Mapa de dependências

Pela coluna *Usado em* da matriz dos seis eixos (seção 3), mudou um fato, sai a lista do que reconferir: cenas, perguntas, peças de RA, frases prontas, quadros. Nada é revisado sem essa lista.

### 19.3 Invariantes

Conferidos ao fim de toda revisão:

- o cânone e o final;
- as viradas e os degraus da escada;
- o "nunca diria" de cada personagem;
- as regras consolidadas (seção 1);
- o mínimo de 900 palavras de texto público, do prólogo ao Cap. 8;
- toda mentira essencial desmontada por uma pista forte.

Correção que exige quebrar um invariante não é aplicada: volta como proposta, para decisão.

### 19.4 Correção lógica não vira explicação

Todo conserto de lógica entra como cena, com ação observável, percepção situada e consequência humana (Guia da história, 10.1), nunca como frase do narrador. Depois do conserto, a cena passa de novo pelos dois testes, literatura e encenação (Guia da história, 10.4).

### 19.5 Duas passadas e uma leitura corrida

1. Passada da **direção interna:** lógica, tempo, pistas, papéis.
2. Passada do **texto público:** voz, ritmo, subtexto, ponto de vista.
3. **Leitura corrida** do capítulo inteiro, não só do trecho mexido.

### 19.6 Ordem fixa de propagação

História → técnico → jogo → RA e maquete → documentos. Nunca ao contrário. Se o problema apareceu no jogo, a correção começa na história.

### 19.7 Versão de referência e comparação

Antes de revisar, a versão atual é congelada como referência. Depois, compara-se:

- palavras por capítulo;
- número de pistas fortes;
- proporção útil × conversa;
- degraus da escada;
- vazamentos (palavras proibidas).

Nenhum desses números piora sem uma decisão registrada.

### 19.8 O leitor sem a direção

Alguém lê só o texto público, sem a solução: uma pessoa, ou um agente instruído a não abrir a direção interna. Ao fim de cada capítulo, registra de quem desconfia e por quê. Isso mostra se o caso se entrega cedo demais, se as viradas funcionam e se o jogo é limpo.

### 19.9 Conferência de voz

Cada personagem tem algumas falas de referência. Depois de revisar, as falas novas são comparadas com elas: fiéis à ficha (escalas e "nunca diria"), e o que o personagem percebe continua explicado pela sua curiosidade.

### 19.10 Registro de cada revisão

| Data | O que mudou | Por quê | Camada | O que foi reconferido | Resultado |
| --- | --- | --- | --- | --- | --- |

O que saiu fica marcado como substituído, com data (regra 10).
