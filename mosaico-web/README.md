# MOSAICO — cliente web (React)

**Versão 3 — a noite na mesa.** Caso *A Casa da Costa*.

Cada pessoa no próprio telefone. A mesa senta (personagem, vez, cor). 
O telefone é lanterna. No fim, cada um acusa sozinho.

A mesa HTML canônica continua em [`../MOSAICO-mesa.html`](../MOSAICO-mesa.html).  
Este cliente usa o **mesmo Firebase** (`mosaico-game`) e a mesma coleção `mosaico/`, 
com o fluxo da versão 3 (Encene → Janela → cômodo → cor → carta → óleo → acusação).

**Jogar a mesa HTML:** [drmarionascimento.github.io/Dragon/MOSAICO-mesa.html](https://drmarionascimento.github.io/Dragon/MOSAICO-mesa.html)

## Como jogar

1. **Abrir uma mesa** — gera o código. Os outros entram com o código.
2. **Entrar com o código** — nome, pronome, o código da sala.
3. **Ensaiar sozinho** — a noite inteira neste telefone, sem nuvem.
4. **A lanterna** — Janela, Sala, Vidro, Mapa, para praticar o rumo.

O telefone diz uma frase por vez: *Faça. Aponta. Procura a sua cor. Encosta. Compra ou guarda. Quem foi?*

## Firebase

Projeto `mosaico-game` (o mesmo da mesa HTML). Login anônimo. 
Domínios autorizados: o GitHub Pages e o Firebase Hosting da mesa.

Se a página atual não estiver autorizada no console do Firebase, 
a criação de sala falha — use **Ensaiar sozinho**, ou abra o jogo num domínio já liberado.

## Como rodar

```bash
cd mosaico-web
npm install
npm run dev
```

Abre no celular por HTTPS. Sem HTTPS o iPhone bloqueia o giroscópio.

Autoria: Mário César Nascimento e Osana Melo Nascimento.
