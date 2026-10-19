# MOSAICO — cliente web (React)

## Manutenção e origem — 19 de outubro de 2026

Materiais e fontes de desenvolvimento mantidos no Dragon. Não equivalem a uma entrada publicada do jogo. A manutenção das versões separadas deve considerar os repositórios próprios e a organização indicada no README principal.

Consulte o [README principal](../../../README.md) e a [licença da raiz](../../../LICENSE.md). Créditos e licenças específicos deste módulo permanecem nos documentos abaixo.

**Versão 3 — a noite na mesa.** Caso *A Casa da Costa*.

Cada pessoa no próprio telefone. A mesa senta (personagem, vez, cor). 
O telefone é lanterna. No fim, cada um acusa sozinho.

A Mesa canônica fica em [jogos/casa-da-costa/a-mesa](../../../jogos/casa-da-costa/a-mesa/MOSAICO-mesa.html).
Esta pasta contém a fonte de A Noite da Casa; o build é publicado em
[jogos/casa-da-costa/a-noite](../../../jogos/casa-da-costa/a-noite/).

São experiências distintas, com fluxos próprios e alguns componentes e mídias
compartilhados. A configuração atual do cliente publicado usa o projeto Firebase
`mosaico-game` e a coleção `noite`. Consulte [FIREBASE-ISOLAMENTO.md](../../../documentos/FIREBASE-ISOLAMENTO.md).

O catálogo principal não oferece um card de A Noite da Casa. A entrada de A Mesa
fica em [historias/casa-da-costa/a-mesa](../../../historias/casa-da-costa/a-mesa/).

## Como jogar (shell de revisão)

1. **Abrir uma mesa** — gera o código. Os outros entram com o código.
2. **Entrar com o código** — nome, pronome, o código da sala.
3. Ensaio local: `?soloLab=1` (não há botão Ensaiar no gate).

O telefone diz uma frase por vez: *Faça. Aponta. Procura a sua cor. Encosta. Compra ou guarda. Quem foi?*

## Firebase

Configuração do cliente: projeto `mosaico-game`, coleção `noite`. Login anônimo para quem entra com o
código; quem **abre** a mesa entra com Google. Domínio autorizado:
`drmarionascimento.github.io` (e `localhost` para desenvolvimento).

Se a página atual não estiver autorizada no console do Firebase, 
a criação de sala falha — abra a página num domínio já liberado, ou use `?soloLab=1`.

## Como rodar

```bash
cd desenvolvimento/casa-da-costa/a-noite
npm install
npm run dev
```

Abre no celular por HTTPS. Sem HTTPS o iPhone bloqueia o giroscópio.

Autoria: Mário César Nascimento e Osana Melo Nascimento.
