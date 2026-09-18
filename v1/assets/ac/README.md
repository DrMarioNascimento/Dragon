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
