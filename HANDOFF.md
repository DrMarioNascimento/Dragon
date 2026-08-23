# MOSAICO — Documento de Passagem

**Para:** quem for auditar ou dar andamento ao projeto.
**Estado:** 23 de agosto de 2026 · commit `99c3c5f` · branch `main`.
**Autor do projeto:** Mário César Nascimento (com Osana Melo Nascimento).

Este documento existe para alguém entender o projeto sem ter acompanhado a construção.
Ele diz o que foi feito, o que **não** foi, por que certas decisões foram tomadas — e
o que quebra se elas forem desfeitas sem querer.

---

## 1. O que é

Jogo híbrido de **dedução distribuída**, jogado por smartphones com telão opcional.
Um caso é fragmentado entre os participantes: ninguém sozinho tem os fatos, a
cronologia ou a relevância das evidências. Missão coletiva, **vitória individual**.

O caso implementado é **A Casa da Costa**: seis convidados numa casa isolada durante
uma tempestade, e uma queda de energia de dois minutos em que algo aconteceu.

Documentos de origem, na pasta `OneDrive/DRAGON`:

| Documento | Conteúdo |
|---|---|
| `VOLUME 1 — DESIGN DO JOGO MOSAICO ... .pdf` | Manual de design: fases, economia, placar, papéis |
| `VOLUME 2 — ... História Técnica Completa2.pdf` | A história em 26 capítulos, versão com **arquétipos** |
| `MOSAICO_V2_Estoria_Arquetipos.docx` | Mesma história em `.docx`, mais fácil de extrair |

> **Atenção:** existe uma versão anterior da história com **nomes próprios**
> (Jonas, Helena, Caio, Lívia, Marcelo, Ana). Ela foi **substituída** por arquétipos
> para resolver a questão de gênero do jogador. Não use os arquivos "COM NOMES".

---

## 2. Onde está

**No ar:** https://drmarionascimento.github.io/Dragon/MOSAICO-mesa.html
**Repositório:** https://github.com/DrMarioNascimento/Dragon (público, GitHub Pages na raiz da `main`)
**Firebase:** projeto `mosaico-game`, plano Spark (gratuito)

- Firestore em `southamerica-east1`, banco `(default)`
- Authentication com login **anônimo** ativo
- Domínio `drmarionascimento.github.io` autorizado
- Regras: leitura e escrita na coleção `mosaico` apenas com `request.auth != null`

O `firebaseConfig` está no HTML **de propósito**. Chave de cliente Firebase é pública
por natureza; quem protege os dados são as Regras do Firestore, não a chave.

---

## 3. Stack, e por que ela é essa

**HTML estático + Firebase por CDN. Sem build, sem npm, sem framework.**

Não é preguiça: a máquina do autor não tem Node nem Python instalados, e o jogo não
precisa de framework. Cada tela é uma função que devolve HTML; o estado vive num
objeto `STATE` e no Firestore. Um `render()` redesenha tudo.

Isso segue a convenção de outro projeto do mesmo autor — o
[Learning-lab](https://github.com/DrMarioNascimento/Learning-lab) — de onde vieram:
código de sala com 6 caracteres sem `0/O/1/I`, link `?sala=CODIGO`, QR pela
`api.qrserver.com`, e o `window.MosaicoFB` publicado por um `<script type="module">`
que dispara um evento para o script clássico esperar.

**Se for reescrever em framework, saiba o que está trocando:** hoje o jogo inteiro é
um arquivo que abre no navegador e funciona. Isso tem valor para quem mantém.

---

## 4. Mapa dos arquivos

```
Dragon/
├── MOSAICO-mesa.html              2067 linhas — o jogo: sala, painel, encenação, votação
├── MOSAICO-24.3-mapa-do-escuro.html   960 — minijogo de bússola + giroscópio
├── MOSAICO-24.4-vidro-embacado.html   930 — minijogo de inclinação + condensação
├── casos/casa-da-costa.json       o caso: elenco, roteiros, pistas, cronologia, história
├── manifest.json                  PWA, display fullscreen
├── img/  abertura.mp4 (10 MB) · capa-vertical · aguardando · fundo-painel · ícones
└── README.md · LICENSE.md
```

Os dois minijogos **rodam sozinhos** (abra e jogue, sem Firebase) e também aceitam
`?embed=1`, que os prepara para rodar dentro da mesa.

---

## 5. Modelo de dados (Firestore)

```
mosaico/{codigo}
  ativa: bool · fase: string · vez: number
  criadaEm: timestamp · criadaEmMs: number · encerradaEmMs?: number

mosaico/{codigo}/jogadores/{uid}
  nome: string          — nome real da pessoa
  personagem: string    — id do arquétipo sorteado
  forma: "m" | "f"      — escolha do jogador na entrada
  pronto: bool          — só o próprio jogador marca
  entrouMs: number      — define a ORDEM das vezes
  votos: number         — preenchido ao fechar a votação
  pistas: [{hora, txt}] — pistas privadas acumuladas

mosaico/{codigo}/votos/{uid}      { de, para, ms }
mosaico/{codigo}/publicas/{ordem} { hora, txt, autor, ordem }
```

O `uid` do login anônimo é usado como id do jogador. Isso abre caminho, no futuro,
para uma regra do tipo "cada um só escreve no próprio cartão".

---

## 6. Máquina de fases

**Fases gravadas no banco** (o painel escreve, todos ouvem):
`sala` → `encenacao` → `votacao` → `resultado`

**Telas locais** (cada aparelho decide a sua a partir da fase):
`inicio` · `entrar` · `esperando` · `encenacao` · `revelacao` · `votacao` ·
`resultado` · `encerrada` · `painel`

O fluxo real:

1. Alguém abre a mesa (senha) → vira **painel**, gera código e QR
2. Jogadores entram pelo QR ou digitando o código → nome + forma de tratamento
3. Sistema **sorteia** o arquétipo, sem contar a ninguém
4. Cada jogador toca **"Estou pronto para jogar"**
5. O painel destrava só com **todos** prontos — e quem abriu a mesa decide a hora
   (para esperar atrasados)
6. Vez a vez: o celular da pessoa acende com o roteiro; os outros ficam escuros
7. Ao encerrar a vez: revela **quem ela era** + entrega a **pista privada**
8. O painel ganha mais uma **linha de cronologia** e o relógio avança
9. Todos encenaram → **votação** (não pode votar em si) → **placar**

---

## 7. Panorâmica em números

| | Hoje | No manual |
|---|---|---|
| **Rodadas de pista** | **1** — uma por pessoa, ao encerrar a vez | 5 momentos de aquisição |
| Pistas privadas | 6 (uma por arquétipo) | 4 iniciais + compras + trocas |
| Pistas gerais (telão) | 6 linhas de cronologia | cronologia + mosaico |
| Pista-pilar / conector / ambiguidade / boato | **0** | 12 pilares no caso piloto |
| **Placar** | **1 de 3 componentes** | 50% precisão · 30% cooperação · 20% economia |
| Precisão da solução | não existe | 50% |
| Cooperação | **não existe** | 30% |
| Economia e risco (moedas) | não existe | 20% |
| Prêmio da mesa (voto) | funcionando | fora do placar |
| **Fases** | **3 no ar, 8 no papel** | 9 fases (0 a 8) |
| Jogadores | 2 a 6 (6 arquétipos) | teto de 12 |
| Duração | ~15 min do que existe | 60 min alvo |

**Resumo honesto:** está de pé **a chegada**. O jogo abre, sorteia, encena, vota e
pontua o prêmio da mesa. A economia inteira — mercado, negociação, mosaico coletivo,
dedução final — é papel. Não há mistério a resolver ainda, porque não há pista-pilar.

---

## 8. Regras de design que não podem ser quebradas

Estas não são preferências de estilo. São decisões do autor, tomadas durante a
construção, e desfazê-las sem querer estraga o jogo.

### 8.1 O personagem é segredo — inclusive do próprio jogador

Ninguém sabe qual arquétipo recebeu. O roteiro entrega **rubrica, tom e fala, sem o
nome**. A pessoa interpreta sem saber quem está sendo, e só descobre ao encerrar a
própria vez.

No telão, o arquétipo de cada um só aparece **depois que aquela pessoa atuou**.

### 8.2 A palavra "encenação" não pode aparecer antes da hora

A tarefa é surpresa, e a surpresa faz parte dela. Nenhum texto visível antes da vez
da pessoa pode conter "encenação", "interpretação" ou similar. O botão do painel diz
**"Começar o jogo"**.

Isso já foi violado três vezes durante a construção e corrigido. Ao alterar textos,
rode: `grep -i "encena\|interpreta" MOSAICO-mesa.html` e confira o que é visível.

### 8.3 O nome da pessoa some depois da primeira tarefa

Antes de atuar, o cartão no telão mostra o **nome**. Depois, mostra **só o arquétipo**
— o nome não volta em lugar nenhum, nem na votação, nem no placar.

Isso é **deliberado**: é fator de confusão na dedução. Quem era quem vira memória da mesa.

### 8.4 Flexão de gênero por escolha do jogador

Na entrada a pessoa escolhe 👨 / 👩 / 👥 ("como quer que o Mosaico te chame").
O texto guarda as duas formas com marcador `{masculino|feminino}` e a função `flex()`
resolve na hora — em rótulos, descrições **e rubricas do roteiro**.

Cuidado: **Jornalista e Policial não mudam de palavra**, só de artigo. Por isso os
rótulos estão escritos por extenso e não por regra de sufixo. Qualquer automação por
terminação produz "Jornalisto".

A **narração** da história continua no gênero original — só as etiquetas do jogador
flexionam. Trocar isso exigiria reescrever concordância, não só palavras.

### 8.5 Um caso = um arquivo

Toda a história vive em `casos/casa-da-costa.json`. Fora dele é "jogo", e serve para
qualquer caso. Para criar outro: copiar o JSON, trocar o conteúdo, abrir com
`?caso=nome-do-arquivo`. O caso atual também está embutido no HTML como padrão, então
nada quebra se o arquivo externo sumir.

---

## 9. Limitações de plataforma que já foram investigadas

Não perca tempo tentando contornar — já foi tentado.

| Limitação | Situação |
|---|---|
| **Áudio automático** | Nenhum navegador toca som sem gesto. Por isso existe o "portão" com um toque na abertura. |
| **Tela cheia no iPhone** | O Safari do iPhone **não implementa** a Fullscreen API. Trocar de navegador não resolve: no iOS, Chrome/Firefox/Edge são o Safari por dentro. O caminho é "Adicionar à Tela de Início" (daí o `manifest.json`). O **iPad funciona**. |
| **Exceção** | O iPhone permite tela cheia para elemento `<video>` (`webkitEnterFullscreen`). A abertura poderia usar isso — abre no player nativo, com controles da Apple por cima. **Não implementado**, é decisão de gosto. |
| **QR com localhost** | O celular abre a si mesmo. Já existe aviso na tela para `file://`, `localhost` e IP de rede local. |
| **TV** | Navegador de TV navega por foco, não por toque. O portão tem botão focável e responde a OK/Enter/Espaço. |

---

## 10. Pendências, em ordem de risco

### 1. Reconexão — **o único risco de arruinar um teste**

Se alguém recarregar a página no meio da partida, cai fora e **volta como jogador
novo, com outro personagem**. O `sessionStorage` guarda `mosaico_eu`, mas **não existe
a rotina que religa os ouvintes** e devolve a pessoa ao lugar onde estava.

As pistas já estão salvas no servidor. Falta só o caminho de volta.

### 2. Ligar os minijogos à mesa

Os dois já estão no ar e já avisam a mesa por `postMessage` quando terminam
(`{mosaico:"tarefa-ok", jogo:"escuro"|"vidro"}`). Falta:

- uma fase `tarefas` no painel que dispare
- a tela do jogador abrindo o minijogo em `<iframe src="...?embed=1">`
- receber a mensagem e gravar a pista

Isso **dobra as rodadas de pista de 1 para 2**. Escolheu-se `iframe` em vez de
reescrever dentro do `mesa.html` para aproveitar a névoa, os relâmpagos e a física da
água que já funcionam — e para os minijogos continuarem abríveis sozinhos.

### 3. A abertura da história no final

Os quatro parágrafos já estão no JSON (`historia`). Falta a tela que os mostra quando
todos terminarem. É a menor pendência.

### 4. Modo Sem Telão

Hoje o mínimo é **um aparelho no painel + um celular por jogador**. O painel guarda
três botões que ninguém mais tem: *Começar o jogo*, *Pular esta pessoa*, *Fechar
votação*. Sem um aparelho dedicado, o jogo não avança.

O Modo Sem Telão (manual 10.7) seria: quem abre a mesa **também joga**, com uma gaveta
de controles no próprio celular. Aí o mínimo vira um celular por pessoa.

### 5. Mosaico Coletivo e cooperação

Destrava 30% do placar. O manual **já resolveu como medir sem árbitro** (item 7.5):
a montagem em grupo é portão de progresso e não vale ponto; depois cada pessoa recebe
um enigma individual cuja resposta só existe dentro da montagem correta.

### 6. Mais 6 arquétipos

Para passar de 6 jogadores. Trabalho de escrita, não de código — o JSON já aceita.

---

## 11. Contradições nos documentos-fonte

Encontradas ao ler o Volume 1. **Nenhuma foi corrigida no documento** — só contornada
no código. Um auditor deveria olhá-las.

**Aritmética**

- **Orçamento de tempo (3.5):** as fases somam **70 min**, não os ≈60 declarados
- **Distribuição de papéis (6.4):** "7 jogadores: 3+3+3" = 9. "9 jogadores: 4+4+3" = 11
- **Núcleos (10.5):** 9 → (3-3-2) = 8; 11 → (3-3-2-2) = 10; 13 → (3-3-3-3) = 12
- **Simulação (17):** 6 jogadores recebem 3+3+3 papéis (=9); na revelação, 4+3+1 (=8)
- **Caso piloto (16.5):** "12 pistas-pilar divididas em 5+4+4+3" = 16

**Estrutura**

- **Todo item "2" sumiu das listas numeradas** (4.1, 7.2, 8.2, 12.1, 12.2, 16.7, 18.1) —
  parece perda em conversão
- **As referências cruzadas usam a numeração da V1.** Como o Resumo Executivo virou o
  cap. 2, tudo deslocou: 7.5 diz "o item 6.4" (é 7.4); 5.3 diz "ver 4.3" (é 5.3);
  13.1.1 diz "ver 2.3 e 7.1" (é 3.3 e 8.1)
- **Não existe capítulo 20** — o sumário pula de 19 para 21

**Desenho**

- **24.1 vs 24.6:** o 24.1 afirma apuração 100% automatizada "eliminando votações
  manuais ou métricas subjetivas de popularidade (MVP)". O 24.6 se chama **"Votação de
  MVP + Nota do Sistema"**. A votação implementada é exatamente isso — foi deixada
  como *prêmio da mesa*, fora do placar de dedução, mas a contradição segue aberta
- **24.5, 24.6, 24.7 e 24.8 são títulos vazios**
- **Teto de 12 vs tabelas de 13:** 10.4 fixa 12 como teto; 11.6 e 14.6 listam 13
- **Hipótese I:** 3.3 pede "duas suspeitas"; 17.5 registra "3 suspeitos"
- **Pilar contrariado:** o manual diz "não exige atuação" e "ninguém é forçado a atuar".
  A encenação é obrigatória hoje. Sugestão registrada e **não implementada**: torná-la
  opcional na criação da mesa

---

## 12. Segurança — o que é e o que não é

**A senha `Mosaico2026` não é segurança.** Está no arquivo como hash SHA-256, o que
impede alguém de *ler* o texto puro, mas quem entende contorna em minutos — e o
repositório é público. Ela serve para impedir que alguém que caia no link por acaso
abra mesas e suje o banco. Para isso funciona.

O que protege os **dados** são as Regras do Firestore.

Se o jogo virar produto, o caminho é outro: login real do mestre por e-mail, e regra
"só quem está autenticado com conta cria documento em `mosaico`". Aí a senha nunca
fica no arquivo.

**Lixo de teste no Firestore:** sobraram mesas de verificação
(`3JEEJE`, `9VT396`, `WZNUHT`, `R39D2D`, `958PLG`, `NXQ6UB`, `69R3VM`, `5VW5P3`).
Podem ser apagadas em *Firestore → Dados → coleção `mosaico`*.

---

## 13. Como testar

**Mínimo de hardware hoje:** um aparelho para o painel + um celular por jogador.

1. Abrir https://drmarionascimento.github.io/Dragon/MOSAICO-mesa.html no aparelho do painel
2. **Abrir uma mesa** → senha `Mosaico2026`
3. **Código · QR** → os jogadores leem com a câmera, ou digitam o código de 6 letras
4. Cada jogador: nome + forma de tratamento → entra
5. Cada jogador toca **Estou pronto para jogar**
6. O painel destrava **Começar o jogo**
7. Os celulares apagam; um de cada vez acende com o roteiro
8. Ao final de todos: votação → placar

**Atalhos de desenvolvimento**

- `?caso=nome` carrega `casos/nome.json` no lugar do caso embutido
- `MOSAICO-24.3-mapa-do-escuro.html#final` pula direto para a revelação da planta baixa
- Os dois minijogos têm **modo dedo** (arrastar) para testar sem sensor, no computador

---

## 14. Convenções

- Comentários no código em português, sem acento (o arquivo mistura fontes)
- Cada `commit` descreve **o que mudou e por quê**, não só o quê
- Antes de publicar, testar contra o Firestore real — não só com simulação
- Texto de interface: sem jargão de sistema, e nada que entregue surpresa
- Cores e tipos vêm das variáveis CSS no topo do arquivo: `--breu`, `--nevoa`,
  `--ambar`, `--frio`, `--vermelho`; serifada para narrativa, sans para interface

---

## 15. O que perguntar ao autor antes de mexer

1. A encenação continua obrigatória, ou vira opcional na criação da mesa?
2. A votação da interpretação entra no placar principal ou fica como prêmio separado?
3. Os 6 arquétipos que faltam para chegar a 12 jogadores serão escritos, ou o teto
   real do jogo passa a ser 6?
4. As inconsistências do Volume 1 (seção 11) serão corrigidas no documento, ou o
   código segue sendo a fonte da verdade?
