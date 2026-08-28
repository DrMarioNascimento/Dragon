# MOSAICO — cliente web (React)

**Versão 3 — a noite na mesa.** Caso *A Casa da Costa*.

Cada pessoa no próprio telefone. A mesa senta (personagem, vez, cor). 
O telefone é lanterna. No fim, cada um acusa sozinho.

A mesa HTML canônica continua em [`../v1/MOSAICO-mesa.html`](../v1/MOSAICO-mesa.html).  
Este cliente é **independente dela**: projeto Firebase próprio (`mosaico-noite`) e
árvore própria (`noite/`), com o fluxo da versão 3 (Encene → Janela → cômodo → cor
→ carta → óleo → acusação). Um código de uma não abre a outra — ver
[`../FIREBASE-ISOLAMENTO.md`](../FIREBASE-ISOLAMENTO.md).

**Jogar a noite:** [drmarionascimento.github.io/Dragon/v2/](https://drmarionascimento.github.io/Dragon/v2/)  
**Jogar a mesa HTML:** [drmarionascimento.github.io/Dragon/v1/MOSAICO-mesa.html](https://drmarionascimento.github.io/Dragon/v1/MOSAICO-mesa.html)

## Como jogar

1. **Abrir uma mesa** — gera o código. Os outros entram com o código.
2. **Entrar com o código** — nome, pronome, o código da sala.
3. **Ensaiar sozinho** — a noite inteira neste telefone, sem nuvem.
4. **A lanterna** — Janela, Sala, Vidro, Mapa, para praticar o rumo.

O telefone diz uma frase por vez: *Faça. Aponta. Procura a sua cor. Encosta. Compra ou guarda. Quem foi?*

## Firebase

Projeto `mosaico-noite`, só desta versão. Login anônimo para quem entra com o
código; quem **abre** a mesa entra com Google. Domínio autorizado:
`drmarionascimento.github.io` (e `localhost` para desenvolvimento).

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
