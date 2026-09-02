# MOSAICO — Modo Solo · A Casa da Costa

O Modo Solo é a terceira experiência do mesmo caso canônico:

- **A Mesa (`v1/`)**: verdade distribuída entre pessoas.
- **A Noite (`v2/`)**: fechamento do dossiê e sustentação da conclusão.
- **Modo Solo (`solo/`)**: verdade fragmentada reconstruída cognitivamente por uma pessoa.

## Fonte canônica

O Solo lê `../v1/casos/casa-da-costa.json`. A realidade factual é única e não deve ser duplicada nesta pasta.

Até 02/09/2026 essa regra estava escrita aqui e desmentida no código: `solo-auto.js` tinha a própria tabela `EVID`, com dezenove fatos reescritos, e um `SETS` com a seleção por pergunta. Duas listas da mesma verdade, sem nada que obrigasse as duas a mudarem juntas — o mesmo arranjo que deixou o cânone antigo sobreviver meses dentro dos módulos sensoriais.

Hoje tudo sai do banco: título e fato de `fragmentos`, agrupamento e inferência de `relacoes`, e o que entra em cada partida de `selecao`. O único dado local é o ÍCONE de cada fragmento, que é decoração e não fato.

**Os códigos do banco (F01, H3, R7) não aparecem na tela**, aqui nem nos outros dois jogos: na tela eles viram atalho de memória entre partidas.

## Conta e Firebase

O Modo Solo exige **login Google** antes de iniciar. A autenticação e a sincronização usam o projeto Firebase `mosaico-noite`, separado da Mesa.

O progresso pessoal é salvo em:

`usuarios/{uid}/experiencias/casa-da-costa-solo`

`firebase-user.js` sincroniza a rotação e o snapshot local. `solo-cloud-state.js` transforma o estado em memória do jogo em um snapshot que pode ser retomado em outro aparelho com a mesma conta.

Para a gravação no Firestore funcionar, o projeto `mosaico-noite` precisa ter publicada a regra de `FIRESTORE-USUARIOS.rules.snippet`.

## Rotação automática das partidas

O usuário não escolhe a pergunta. O MOSAICO alterna automaticamente, em sequência, uma pergunta-mãe diferente sobre a mesma realidade:

1. Sete dentro da casa
2. Cinco meses
3. Os 2 minutos e 2 segundos
4. O nome
5. Casa, corpo ou assombração?
6. Quem deveria ter percebido?

Ao iniciar uma execução, a pergunta fica congelada até a revelação. A próxima partida avança para a pergunta seguinte e, depois da sexta, a sequência recomeça.

## Fluxo

`Pergunta → imagem em quatro fragmentos → Fato → Relação → Inferência → planta de 1867 → Decisão → Revelação`

Cada evidência é remontada em quatro partes. Depois de montar, o jogador precisa separar o que o fato demonstra diretamente de interpretações que ainda não estão autorizadas. As relações entre fatos aparecem antes da decisão final.

A planta `v1/img/casa-da-costa-planta-1867.svg` funciona como síntese espacial antes da resposta.

O modelo antigo de `suspeito + motivo + ação + prova + lacuna`, assim como a continuidade de Nuno/Caseiro, testamento, chave e abertura criminosa do cofre, está supersedido.

**Jogar:** https://drmarionascimento.github.io/Dragon/solo/
