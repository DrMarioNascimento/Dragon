# Ativos 3D da AC

`escrivaninha.glb` foi copiada do projeto local `lab-ra/escrivaninha.glb`, sem modificar o original. O ativo passa a ser a referencia da bancada `AC-escrivaninha.html`, usada tanto no apagao como na etapa iluminada.

GLTFLoader e OrbitControls em `v1/js/vendor` sao componentes oficiais Three.js r128, mesma revisao de `v1/js/three.min.js`; licenca MIT incluida. Sem dependencias remotas em tempo de execucao nesta bancada.

A marca `EXT` e conteudo de estudo, nao uma nova evidencia canonica. O dossie local usa namespace proprio; nao escreve em Firebase, nao concede pontos e nao emite conclusao de tarefa da sala.

`escrivaninha.usdz` (15/09/2026) veio de `lab-ra/escrivaninha.usdz`, par exato deste `.glb`. É o que o iPhone recebe no botão "Colocar na sua sala". O Safari só abre Quick Look se o `<a rel="ar">` tiver uma **imagem** como filho (não texto) e o arquivo vier com MIME `model/vnd.usdz+zip`. `escrivaninha-ar.png` é o cartaz desse link.

`casa-da-costa-noturna.glb` (15/09/2026) é o palco da abertura — a casa vista da costa, à noite. Não substitui a maquete. A abertura procura este arquivo em `v1/assets/ac/`. Se ele não estiver aqui, a foto da abertura permanece.

`casa-da-costa-pisos.glb` (17/09/2026) é a maquete de `AC-maquete.html`: a casa noturna com interior, em metros, exportada pelo three-d-stage. O jogo procura cinco partes por nome (`terreno`, `porao`, `piso-1`, `piso-2`, `telhado`) e os medalhões pelo `extras.object`; `v1/js/ac-maquete-model.js` reduz tudo a 1:15,6 e acrescenta a fechadura, a chave e os medalhões que o arquivo não traz (rosa, folha, ondas, louça). A origem da conversão foi escolhida para a face do `estrato-3` cair rente à fechadura, porque `KEY_SOCKET` é regra do servidor. Trocar o arquivo pede rodar `tests/ac-maquete.test.mjs` e olhar a fechadura de novo.
