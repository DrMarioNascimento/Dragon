# MOSAICO — Acessibilidade Cognitiva e Papéis

**Status:** diretriz consolidada de design  
**Projeto:** MOSAICO  
**Autores:** Mário César Nascimento e Osana Melo Nascimento  
**Data da consolidação:** 6 de setembro de 2026

---

## 1. Princípio central

O MOSAICO deve atingir públicos com diferentes níveis de experiência, velocidade de raciocínio, memória de trabalho e capacidade de acompanhar inferências sem simplificar a verdade do caso, reduzir a ambiguidade legítima ou entregar a solução ao participante.

> **A acessibilidade do MOSAICO deve reduzir a dificuldade de organizar o raciocínio, nunca a dificuldade de chegar à conclusão.**

As três camadas de acessibilidade utilizam a **mesma realidade canônica, os mesmos fatos, as mesmas pistas e o mesmo desfecho**. O que muda é apenas a quantidade de apoio oferecida para organizar e testar o raciocínio.

O sistema não deve dizer ao jogador qual hipótese está correta nem produzir probabilidades de acerto. Deve funcionar como **andaime cognitivo**.

---

## 2. Camadas de acessibilidade

| Camada | Objetivo | Comportamento |
|---|---|---|
| **Livre** | Preservar a experiência integral para jogadores que desejam máxima autonomia. | O jogador recebe as informações do caso e organiza sozinho relações, hipóteses, cronologia e decisão. |
| **Assistida** | Reduzir carga de memória de trabalho e dificuldade de organização. | O sistema oferece estruturas visuais, classificação, agrupamento, linha temporal e comparação, sem interpretar as evidências pelo jogador. |
| **Guiada** | Permitir participação efetiva de quem tem dificuldade para acompanhar o raciocínio complexo. | O sistema acrescenta perguntas socráticas e alertas de coerência, conduzindo o processo de análise sem fornecer a conclusão. |

### 2.1 Regra de invariância

Mudar de Livre para Assistida ou Guiada **não altera**:

- fatos canônicos;
- pistas disponíveis;
- cronologia real;
- solução;
- regras de causalidade;
- critérios de conclusão do caso.

Altera somente a **interface de apoio cognitivo**.

---

## 3. Papéis cognitivos permanentes

Os papéis cognitivos representam competências transferíveis entre histórias. A identidade narrativa pode mudar conforme o caso, mas a função cognitiva permanece reconhecível.

| Papel cognitivo | Competência principal |
|---|---|
| **Investigador** | Relacionar pistas e formular hipóteses. |
| **Cético** | Testar a hipótese dominante, procurar contradições e explicações concorrentes. |
| **Arquivista** | Separar fatos, interpretações e dúvidas; controlar o estado das evidências. |
| **Cronista** | Reconstruir sequência, duração e compatibilidade temporal dos acontecimentos. |
| **Decisor** | Sintetizar alternativas, avaliar sustentação e transformar análise em decisão. |

Os papéis não devem funcionar como classes rígidas nem limitar o acesso às evidências necessárias para resolver o caso. Eles determinam principalmente **responsabilidade cognitiva e forma de apresentação do painel**.

---

## 4. Matriz consolidada — Papel × História × Camada × Painel

| Papel cognitivo | Papel narrativo nas três histórias | **Livre — painel** | **Assistida — painel** | **Guiada — painel** |
|---|---|---|---|---|
| **Investigador** | **A Casa da Costa:** Investigador de campo — conecta vestígios, pessoas e acontecimentos. **A Manhã do Carro Forte:** Analista da ocorrência — relaciona movimentações, registros e evidências. **A Noite:** Investigador noturno — procura relações entre acontecimentos e elementos observados. | Pistas disponíveis; **Minha hipótese**; anotações e conexões livres. | Tudo do Livre + **Pistas relacionadas**; agrupamentos criados pelo jogador; indicador de pistas ainda não examinadas. | Tudo da Assistida + **Qual evidência sustenta sua hipótese?**; seleção de evidências; **Esta evidência prova ou apenas é compatível?**; provocações socráticas progressivas. |
| **Cético** | **A Casa da Costa:** Contestador — questiona a narrativa aparentemente mais óbvia. **A Manhã do Carro Forte:** Analista crítico — procura explicações concorrentes. **A Noite:** Contraponto — procura inconsistências na reconstrução predominante. | Hipótese atual da mesa; pistas disponíveis; **Minha objeção**. | Tudo do Livre + **Evidências a favor / Evidências contrárias**; **Outra explicação possível**; **O que não encaixa?** | Tudo da Assistida + **O que teria de ser verdadeiro para essa hipótese funcionar?**; **Existe outra explicação para os mesmos fatos?**; contradições ainda não discutidas. |
| **Arquivista** | **A Casa da Costa:** Custódio dos registros — controla o que efetivamente foi constatado. **A Manhã do Carro Forte:** Analista documental — organiza registros, comunicações e evidências. **A Noite:** Controlador de evidências — mantém separado o observado do interpretado. | Todas as pistas reveladas; notas e marcadores próprios. | Tudo do Livre + três áreas: **FATOS / INTERPRETAÇÕES / DÚVIDAS**, com classificação das informações pelo jogador. | Tudo da Assistida + **Isso foi observado ou inferido?**; itens ainda não classificados; conflitos de classificação para revisão. |
| **Cronista** | **A Casa da Costa:** Reconstrutor da sequência — determina o que pode ter acontecido antes/depois. **A Manhã do Carro Forte:** Analista temporal — cruza horários, deslocamentos e acontecimentos. **A Noite:** Reconstrutor da noite — organiza a sucessão dos eventos. | Pistas disponíveis + espaço para cronologia livre. | Tudo do Livre + **linha do tempo visual**; eventos confirmados; horários aproximados; lacunas; posicionamento de pistas. | Tudo da Assistida + **Há uma lacuna aqui**; **A ordem desses eventos é compatível?**; **Esse horário é confirmado ou estimado?** |
| **Decisor** | **A Casa da Costa:** Coordenador da investigação — consolida a interpretação adotada pela mesa. **A Manhã do Carro Forte:** Coordenador da resposta — transforma análise em decisão da equipe. **A Noite:** Coordenador operacional — escolhe qual interpretação orientará a próxima ação. | Hipóteses apresentadas; área de decisão; justificativa. | Tudo do Livre + comparação **Hipótese A / B / C**; evidências favoráveis; contrárias; dúvidas pendentes; sustentação construída pela própria mesa. | Tudo da Assistida + **Qual hipótese explica mais fatos?**; **Qual exige mais suposições?**; **O que permanece sem explicação?**; justificativa obrigatória antes da confirmação. |

---

## 5. Identidade narrativa e competência permanente

O nome narrativo deve aumentar a imersão sem esconder a competência que o jogador está exercitando. No celular, a apresentação recomendada é:

> **ANALISTA TEMPORAL**  
> *Papel cognitivo: Cronista*  
> Sua função é reconstruir a ordem dos acontecimentos.

Mapa de equivalência:

| Função permanente | A Casa da Costa | A Manhã do Carro Forte | A Noite |
|---|---|---|---|
| **Investigador** | Investigador de campo | Analista da ocorrência | Investigador noturno |
| **Cético** | Contestador | Analista crítico | Contraponto |
| **Arquivista** | Custódio dos registros | Analista documental | Controlador de evidências |
| **Cronista** | Reconstrutor da sequência | Analista temporal | Reconstrutor da noite |
| **Decisor** | Coordenador da investigação | Coordenador da resposta | Coordenador operacional |

---

## 6. Painel comum a todos os jogadores

Independentemente do papel e da camada, uma faixa de orientação deve permanecer consistente.

| Elemento | Conteúdo |
|---|---|
| **Rodada** | Rodada/fase atual da investigação. |
| **Tempo** | Tempo disponível quando a fase possuir limite. |
| **Pistas** | Pistas reveladas/disponíveis, sem revelar conteúdo ainda não adquirido. |
| **Hipótese da mesa** | Interpretação atualmente registrada pelo grupo, quando houver. |
| **Questão central** | Pergunta que precisa ser enfrentada naquela etapa. |
| **Meu papel** | Papel cognitivo e identidade narrativa do jogador. |
| **Assistência** | Livre, Assistida ou Guiada. |

A finalidade dessa faixa é eliminar a carga cognitiva desnecessária de descobrir **“o que devo fazer agora?”**, sem reduzir a complexidade da investigação.

---

## 7. Mestre Socrático

Na camada Guiada, o sistema não corrige a conclusão diretamente. Ele conduz o jogador por perguntas progressivas.

Exemplos:

1. **Essa conclusão depende de qual evidência?**
2. **Essa evidência prova isso ou apenas é compatível com essa interpretação?**
3. **Existe algum fato revelado que também poderia ser explicado por outra hipótese?**
4. **O que teria de ser verdadeiro para essa hipótese funcionar?**
5. **Qual fato permanece sem explicação?**

A progressão pode ser adaptativa: sucessivas decisões contraditórias, repetidos tempos esgotados ou várias rodadas sem avanço podem aumentar discretamente o apoio. O mecanismo deve auxiliar a organização do raciocínio, nunca indicar a solução.

---

## 8. O que o painel pode e não pode mostrar

### Permitido

O sistema pode representar quantitativamente o **trabalho realizado pelos próprios jogadores**.

Exemplo:

- Hipótese A;
- evidências vinculadas: 5;
- contradições registradas: 2;
- questões abertas: 3.

### Proibido

O sistema não deve apresentar inferências próprias que funcionem como resposta disfarçada, por exemplo:

- **Hipótese A — 78% provável**;
- **hipótese mais provável**;
- **87% de confiança**;
- ranking automático de hipóteses baseado na solução canônica;
- indicação de que uma pista é decisiva antes de isso ser estabelecido pelo jogo ou pelos participantes.

> O painel pode organizar o raciocínio do jogador. Não pode raciocinar no lugar dele.

---

## 9. Mesas heterogêneas

Uma mesma mesa pode combinar papéis e níveis diferentes, por exemplo:

- Investigador — Livre;
- Cético — Livre;
- Arquivista — Guiada;
- Cronista — Assistida;
- Decisor — Assistida.

Todos continuam submetidos à mesma realidade canônica. A assistência deve ser preferencialmente individual e discreta no celular para evitar que o suporte destinado a um jogador revele inferências aos demais.

A configuração pode ser coletiva ou individual. A configuração individual é preferível para mesas heterogêneas, desde que não produza vantagem informacional sobre os fatos do caso.

---

## 10. Rotação e desenvolvimento cognitivo

O sistema pode registrar quais papéis cognitivos cada participante já desempenhou, sem transformar isso em pontuação de acerto/erro.

Exemplo:

`Jogador: Investigador ✓ | Cético ✓ | Arquivista — | Cronista ✓ | Decisor —`

A rotação permite que sucessivas partidas exercitem competências diferentes:

- formulação de hipóteses;
- pensamento crítico;
- organização factual;
- raciocínio temporal;
- síntese e tomada de decisão.

Esse histórico deve servir ao Mestre para distribuir ou sortear funções em novas partidas, não para rotular capacidade cognitiva do participante.

---

## 11. Relação com os princípios protegidos do MOSAICO

A arquitetura de acessibilidade deve preservar os princípios narrativos e epistemológicos do projeto:

> **O MOSAICO deve explorar a distância entre aquilo que parece ter acontecido e aquilo que os fatos permitem concluir.**

> **No MOSAICO, um fato verdadeiro pode estar associado à interpretação errada.**

> **No MOSAICO, os jogadores constroem decisões com base nas evidências disponíveis. Novas evidências podem alterar a interpretação sem alterar nenhum fato já revelado.**

Consequentemente, assistência cognitiva nunca pode transformar interpretação em fato, antecipar evidência futura ou alterar retrospectivamente uma informação verdadeira já revelada.

---

## 12. Critério de implementação

A implementação deve separar três dimensões independentes:

1. **Caso** — define fatos, pistas, cronologia e realidade canônica;
2. **Papel cognitivo** — define a responsabilidade analítica e o painel especializado;
3. **Camada de acessibilidade** — define a intensidade do apoio oferecido.

Conceitualmente:

`painelDoJogador = caso + papelCognitivo + camadaAcessibilidade + estadoDaPartida`

Essa separação permite adicionar novos casos sem reescrever o sistema de acessibilidade e permite alterar o nível de apoio sem criar versões fácil/média/difícil da narrativa.

---

## 13. Regra de ouro

> **Mesma verdade. Mesmas evidências. Diferentes andaimes cognitivos.**

O MOSAICO não deve tornar o mistério mais simples para incluir jogadores diferentes. Deve tornar **o processo de pensar sobre o mistério mais acessível**.


---

## 14. Onde a UI vive (implementação)

**Modo · Papel · Camada** (set/2026):

| Peça | Arquivo |
|---|---|
| Módulo compartilhado (papéis, aliases, camadas, seletor, chips, andaimes) | `papel-camada.js` (raiz) |
| Landing só com 3 CTAs | `casa-da-costa/index.html`, `carro-forte/index.html` |
| Seletor no lobby Celular (Carro + ensaio) | `firebase-room.js` → formulário de entrada / ensaio |
| Seletor Casa Celular | `v1/MOSAICO-mesa.html` → tela de entrar |
| Seletor Solo Casa | `solo/solo-auto.js` (antes de “Começar”) |
| Chip no HUD + andaime Assistida/Guiada | `MosaicoPapelCamada.aplicarEmJogo` / `htmlAndaime` |
| Telão (sem papel/camada; pede `?sala=`) | `telao.html` |

Camadas **não** alteram fatos, pistas nem pontuação. Assistida/Guiada são andaimes estruturais + perguntas socráticas (processo), sem veredito.

### 14.1 Hipóteses / respostas por camada

**Próximo degrau** (invariância MOSAICO): as mesmas hipóteses e os mesmos campos de decisão existem em Livre, Assistida e Guiada. A camada só muda o **andaime** — como o jogador organiza e testa o raciocínio.

| Peça | Arquivo |
|---|---|
| Catálogo player-facing (sem `resposta` / sem `canonica`) | `hipoteses-por-camada.json` |
| API de apresentação + HTML por densidade | `hipoteses-por-camada.js` → `MosaicoHipotesesCamada` |
| Integração no andaime (substitui slots vazios do MVP) | `papel-camada.js` → `htmlAndaime` / `trocarCamada` |
| Carro · fase HIPÓTESE com scaffold Assistida/Guiada | `carro-forte/game.js` → `renderHypothesis` |
| Testes de invariância / densidade / proibições | `tests/hipoteses-por-camada.test.mjs` |

| Camada | Densidade do painel de hipóteses |
|---|---|
| **Livre** | Lista crua / selects dos campos (chrome mínimo). |
| **Assistida** | + comparação A/B/C, buckets a favor/contra, marcador “não examinadas”; ênfase por papel. |
| **Guiada** | Assistida + prompts socráticos progressivos e checagem de coerência de *processo* (sem dizer a resposta). |

**Proibido no painel:** `%`, “mais provável”, ranking keyed à solução. Papel muda ênfase do painel, não o conjunto de hipóteses/campos.

### 14.2 Persistência Assistida/Guiada + A/B/C no placar

O andaime Assistida/Guiada agora **persiste por jogador** (`localStorage` chave `mosaico_hpc_scaffold:caso:partida:playerId`, com hook `roomPlayerFields` para campos da sala quando o multiplayer expuser):

| Campo | Conteúdo |
|---|---|
| `compare` A/B/C | ids do catálogo ou rótulo livre |
| `notes` favor/contra (+ papel) | evidências/notas atribuídas pelo jogador |
| `unexamined` | marcadores “não examinada” que **grudam** no toggle |
| `socratic.answers` / `acknowledged` | Guiada: anotações curtas por prompt |
| classificação / timeline / justificativa | ênfase Arquivista / Cronista / Decisor |

No **fecho/relatório** (Carro `renderScore`, Solo `result`, Casa `telaMinhaPontuacao`) aparece o bloco **PROCESSO · COMPARAÇÃO A/B/C** com contagens de trabalho do jogador (ex.: 3 em comparação, a favor: 2, contra: 1). Isso é métrica de **processo**, não bônus que revele a hipótese correta. Telão: só snippet opcional do tipo “N hipóteses em comparação” via `processMetrics().telaoSnippet` — sem ids.

**Livre** esconde o chrome estrutural; `trocarCamada` re-renderiza o painel mantendo o scaffold persistido.
