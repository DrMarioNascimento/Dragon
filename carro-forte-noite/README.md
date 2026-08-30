# MOSAICO — A Noite · A Manhã do Carro-Forte

Primeira implementação do **Captura** como versão noturna de **A Manhã do Carro-Forte**.

**Entrada:** `index.html`

**URL:** https://drmarionascimento.github.io/Dragon/carro-forte-noite/

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

Os valores econômicos atuais são **experimentais** e ainda não constituem o balanceamento final do Captura.

## Identidade visual

A Noite reutiliza a linguagem de **A Mesa — A Manhã do Carro-Forte**: azul-petróleo, cinza, papel, ouro velho, vermelho de risco, garoa e a imagem `carro-forte/assets/carro-forte-hero.png` como base atmosférica.

A interface é mobile-first e mantém o padrão MOSAICO de **caixas e botões com profundidade física**: borda, luz interna, sombra de base e deslocamento ao pressionar.

Os ambientes internos do banco ainda poderão receber imagens próprias posteriormente sem alterar a arquitetura funcional.

## Arquivos

- `index.html` — telas e estrutura;
- `styles.css` — identidade visual, profundidade, mobile e responsividade;
- `game.js` — perguntas, mãos, economia experimental, captura, risco e cronômetro.

**Prof. Mário César Nascimento, PhD ©**
