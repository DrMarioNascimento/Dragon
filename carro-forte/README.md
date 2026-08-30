# MOSAICO — A Manhã do Carro-Forte

## Mesa V4 — realidade única, partidas múltiplas

A Mesa publicada em `index.html` foi redesenhada segundo a Gramática MOSAICO.
A realidade factual é única; a pergunta da partida muda.

> **A perspectiva muda a pergunta. Não muda o que aconteceu.**

> **O MOSAICO deve explorar a distância entre aquilo que parece ter acontecido e aquilo que os fatos permitem concluir.**

A nova realidade canônica é **A Manhã do Carro-Forte — O Peso do Malote 41**. O anúncio inicial de falta de R$ 480.000 é uma interpretação feita antes da conferência. Na realidade, R$ 96.000 entram no malote durante os 87 segundos; a diferença de R$ 96.000 nasceu onze dias antes por duplicidade escritural.

## Partidas disponíveis

A Mesa V4 oferece seis perguntas diferentes sobre a mesma manhã:

1. **O Peso do Malote 41 — QUANTO + QUANDO**  
   *O banco anuncia que faltam quatrocentos e oitenta mil reais. Quanto realmente desapareceu?*
2. **Os 87 Segundos — O QUÊ + COMO**  
   *O que realmente aconteceu enquanto a câmera 3 ficou cega?*
3. **Foi um roubo? — QUAL / QUE TIPO**  
   *Todo mundo viu os sinais de um assalto. Mas houve realmente um roubo?*
4. **Antes das 8h02 — QUANDO**  
   *Quando nasceu a diferença que todos procuram?*
5. **Quem construiu a janela? — QUEM COMPOSTO**  
   *Quem colocou cada peça daqueles 87 segundos em movimento?*
6. **O que estava sendo protegido? — POR QUÊ**  
   *Se não era o dinheiro, o que alguém estava tentando salvar?*

Os campos finais são próprios de cada pergunta. Não existe mais um formulário universal de suspeito + motivo + ação + prova.

## Atividades sensoriais reutilizadas e reescritas

A Mesa utiliza um banco de mecânicas sensoriais MOSAICO. Elas são selecionadas conforme a pergunta e revelam fatos diferentes em cada partida.

- `janela-do-norte.html` — **A Janela do Norte** adaptada ao espaço e à cronologia da agência;
- `vidro-embacado.html` — **O Vidro Embaçado** com peso, lacres, valores e registros;
- `sala-as-escuras.html` — **A Sala às Escuras** no corredor dos arquivos durante a zona cega.

As três atividades possuem alternativa por toque e registram conclusão localmente no navegador. Elas não entregam uma conclusão pronta: apresentam fatos que precisam ser relacionados.

### Distribuição por partida

| Partida | Janela do Norte | Vidro Embaçado | Sala às Escuras |
|---|:---:|:---:|:---:|
| O Peso do Malote 41 |  | ✓ | ✓ |
| Os 87 Segundos | ✓ | ✓ | ✓ |
| Foi um roubo? |  | ✓ | ✓ |
| Antes das 8h02 | ✓ |  |  |
| Quem construiu a janela? | ✓ |  | ✓ |
| O que estava sendo protegido? |  | ✓ |  |

## Fluxo V4

1. prólogo;
2. escolha do número de investigadores;
3. escolha de ritmo — **Sob pressão (30 s)** ou **Calma (60 s)**;
4. escolha da partida/pergunta-mãe;
5. atividades sensoriais próprias da pergunta;
6. leitura e seleção de fragmentos factuais;
7. hipótese provisória;
8. Mosaico de relações e contraprova;
9. decisão final com campos específicos daquela partida;
10. revelação canônica pelo corte da pergunta;
11. placar em 100 pontos;
12. escolha de outra partida sobre a mesma realidade.

## Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Mesa V4 e navegação entre partidas |
| `styles.css` | identidade visual e responsividade |
| `game.js` | definições das seis partidas, evidências, relações, decisão, revelação e placar |
| `janela-do-norte.html` | atividade sensorial temporal/espacial |
| `vidro-embacado.html` | atividade sensorial documental/física |
| `sala-as-escuras.html` | atividade sensorial de busca material |
| `iphone-guard.css` / `iphone-guard.js` | proteção de orientação e comportamento móvel |
| `assets/` | imagens do caso |
| `tiles/` | imagens do card no catálogo |
| `fragmentos-em-dupla.html` | protótipo anterior de fragmentação em dupla; preservado para reaproveitamento futuro |

## Regra de design

`REALIDADE CANÔNICA → PERSPECTIVA → PERGUNTA → FRAGMENTOS → RELAÇÕES → INFERÊNCIA → DECISÃO`

A criação de uma nova partida deve começar pela pergunta. Atividades, campos e pontuação devem servir ao raciocínio que ela exige.

**Prof. Mário César Nascimento, PhD ©**
