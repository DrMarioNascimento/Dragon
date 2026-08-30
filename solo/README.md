# MOSAICO — Modo Solo · A Casa da Costa

O Modo Solo é a terceira experiência do mesmo caso canônico:

- **A Mesa (`v1/`)**: verdade distribuída entre pessoas.
- **A Noite (`v2/`)**: fechamento do dossiê e sustentação da conclusão.
- **Modo Solo (`solo/`)**: verdade fragmentada reconstruída cognitivamente por uma pessoa.

## Fonte canônica

O Solo lê `../v1/casos/casa-da-costa.json`. A realidade factual é única e não deve ser duplicada nesta pasta.

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
