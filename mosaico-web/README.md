# MOSAICO — cliente web (React)

**Versão 3 — a noite na mesa.** Caso *A Casa da Costa*.

Cada pessoa no próprio telefone. A mesa senta (personagem, vez, cor). 
O telefone é lanterna. No fim, cada um acusa sozinho.

A mesa HTML canônica continua em [`../v1/MOSAICO-mesa.html`](../v1/MOSAICO-mesa.html).  
Este cliente é **independente dela**: projeto Firebase próprio (`mosaico-noite`) e
árvore própria (`noite/`), com o fluxo da versão 3 (Encene → Janela → cômodo → cor
→ carta → óleo → acusação). Um código de uma não abre a outra — ver
[`../FIREBASE-ISOLAMENTO.md`](../FIREBASE-ISOLAMENTO.md).

**Playtest ao vivo:** use as portas Celular · Telão · Solo em [`../casa-da-costa/`](../casa-da-costa/).  
`/v2/` é linhagem de revisão (A Noite). Não é porta de produção.

## Como jogar (shell de revisão)

1. **Abrir uma mesa** — gera o código. Os outros entram com o código.
2. **Entrar com o código** — nome, pronome, o código da sala.
3. Ensaio local: `?soloLab=1` (não há botão Ensaiar no gate).

O telefone diz uma frase por vez: *Faça. Aponta. Procura a sua cor. Encosta. Compra ou guarda. Quem foi?*

## Firebase

Projeto `mosaico-noite`, só desta versão. Login anônimo para quem entra com o
código; quem **abre** a mesa entra com Google. Domínio autorizado:
`drmarionascimento.github.io` (e `localhost` para desenvolvimento).

Se a página atual não estiver autorizada no console do Firebase, 
a criação de sala falha — abra a página num domínio já liberado, ou use `?soloLab=1`.

## Como rodar

```bash
cd mosaico-web
npm install
npm run dev
```

Abre no celular por HTTPS. Sem HTTPS o iPhone bloqueia o giroscópio.

Autoria: Mário César Nascimento e Osana Melo Nascimento.
