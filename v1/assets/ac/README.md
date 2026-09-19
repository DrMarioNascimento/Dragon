# Ativos 3D da AC

`escrivaninha.glb` foi copiada do projeto local `lab-ra/escrivaninha.glb`, sem modificar o original. O ativo passa a ser a referencia da bancada `AC-escrivaninha.html`, usada tanto no apagao como na etapa iluminada.

GLTFLoader e OrbitControls em `v1/js/vendor` sao componentes oficiais Three.js r128, mesma revisao de `v1/js/three.min.js`; licenca MIT incluida. Sem dependencias remotas em tempo de execucao nesta bancada.

A marca `EXT` e conteudo de estudo, nao uma nova evidencia canonica. O dossie local usa namespace proprio; nao escreve em Firebase, nao concede pontos e nao emite conclusao de tarefa da sala.

`escrivaninha.usdz` (15/09/2026) veio de `lab-ra/escrivaninha.usdz`, par exato deste `.glb`. É o que o iPhone recebe no botão "Colocar na sua sala". O Safari só abre Quick Look se o `<a rel="ar">` tiver uma **imagem** como filho (não texto) e o arquivo vier com MIME `model/vnd.usdz+zip`. `escrivaninha-ar.png` é o cartaz desse link.

`casa-da-costa-noturna.glb` (15/09/2026) é o palco da abertura — a casa vista da costa, à noite. Não substitui a maquete. A abertura procura este arquivo em `v1/assets/ac/`. Se ele não estiver aqui, a foto da abertura permanece.

`casa-da-costa-pisos.glb` (17/09/2026) é a MAQUETE — a casa inteira separada em
camadas: `telhado`, `piso-2`, `piso-1`, `porao` e `terreno`. É o modelo da
atividade `AC-maquete.html`, e é ele que se abre camada por camada até a
passagem sob a despensa. `casa-da-costa-noturna.glb` continua sendo só o palco
da abertura; os dois não se substituem.

Quem mexer neste arquivo precisa saber de três coisas, todas guardadas por
`tests/ac-maquete.test.mjs`:

- a atividade fala numa maquete NORMALIZADA (pegada 1, base em y=0), e as três
  fechaduras do motor (`v1/js/ac-maquete-state.mjs`) são coordenadas nesse
  espaço. Mudar a maçaneta, o peito da chaminé ou o consolo da lareira de lugar
  sem atualizar `FECHADURAS` quebra o encaixe;
- os alvos são escolhidos por NOME e por ancestral (`ac-maquete-mundo.js`), não
  por índice. Renomear `quarto-oeste` ou `pedra-solta` derruba um capítulo;
- o GLTFLoader desempata nomes repetidos com sufixo (`laje-de-chegada_1`…), e a
  seleção já conta com isso.

Duas observações sobre o modelo como ele veio, que a atividade contorna sem
alterar o arquivo: os ponteiros do relógio de pêndulo marcavam ~7h32 e são
girados para 21h29 no carregamento (é o horário do caso, F20 e F26); e a torre
cobre os quartos norte e leste quando o telhado sai, então o capítulo do andar
usa só os dois quartos que de fato se abrem.

**Troca do modelo (18/09/2026).** `casa-da-costa-pisos.glb` foi substituído pela
versão nova do editor (escada principal em dois lances, lustre, vestíbulo na
torre, mirante com escada e guarda, relógio de PAREDE na sala escura). O que
mudou na atividade por causa disso:

- a porta da frente recuou para dentro do arco da torre: a maçaneta responde a
  0 de 72 direções de olhar. A fechadura da primeira camada passou a ser o
  **degrau de pedra da porta** (`portada/degrau`, 52 de 72);
- a lareira e o candelabro saíram da sala escura: a fechadura do térreo é o
  **peito da chaminé** (`piso-1/peito-de-chamine`) e o candelabro deu lugar ao
  **quadro** entre os pontos da procura;
- o relógio de pêndulo virou `relogio-de-parede` — o acerto para 21h29 continua;
- o modelo veio com seis **medalhões de ponto clicável** do editor
  (`medalhao-relogio` "Base do relógio", `medalhao-armario-*`,
  `medalhao-escrivaninha`), dois deles em cima de esconderijos. Eram botões do
  editor, não do jogo: foram apagados do arquivo (e o carregador descarta
  qualquer um que volte numa reexportação). O `EXT_materials_bump` das quatro
  texturas de pedra e tábua foi preservado;
- com o mirante, a maquete normalizada tem 1,32 de altura (antes 1,08).

## Realidade aumentada no iPhone (19/09/2026)

O Safari do iPhone não tem WebXR. A escrivaninha e a maquete usam, nele, o
**8th Wall Engine** (binário distribuído, `@8thwall/engine-binary@1`, carregado
de `cdn.jsdelivr.net` só quando a página roda num celular sem WebXR), para o
rastreamento de superfície (SLAM). No Android o caminho continua sendo o WebXR
do Chrome. Tudo passa por `v1/js/ac-ra.js` (`ACRA.criar`).

Licença: Copyright © 2026 Niantic Spatial, Inc. Uso sob a XR Engine License
Agreement (https://github.com/8thwall/engine/blob/main/LICENSE), fornecido sem
garantias. A atribuição exigida (seção 1.3) está no "Como jogar" das duas
páginas (`.ac-credito`). Este projeto não é afiliado nem endossado pela
Niantic Spatial. A licença não permite uso em produto pago cujo valor venha,
inteira ou substancialmente, do motor — o jogo usa o motor só para apoiar a
maquete e a escrivaninha na mesa. Para desligar: `window.AC_SEM_SLAM = true`
antes de `ac-ra.js`; para servir outra cópia do binário: `window.AC_XR8_SRC`.
