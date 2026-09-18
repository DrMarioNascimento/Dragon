/* O mundo da maquete: lê `casa-da-costa-pisos.glb` e devolve uma cena pronta
   para a atividade — camadas que se soltam, alvos que se pode tocar, três
   fechaduras e uma chave.

   Três coisas aqui não são enfeite:

   1. NORMALIZAÇÃO. O arquivo vem em unidades do editor (31 × 34 × 24). A
      atividade inteira — as fechaduras do motor, a tolerância do encaixe, a
      escala em RA — fala numa maquete de PEGADA 1: x e z centrados em zero,
      base em y=0, maior lado horizontal valendo 1. Quem mexer no modelo sem
      mexer nas fechaduras é reprovado pelo teste, não pelo jogo.

   2. FUSÃO. São 2.472 nós com malha. Desenhados um a um, são 2.472 chamadas
      por quadro — num telefone em RA isso é o fim. Tudo o que não é alvo é
      fundido por camada e por material: sobram poucas dezenas.

   3. O RELÓGIO. O caso diz que o relógio de corda travou às 21h29 (F20, F26).
      O modelo veio com os ponteiros noutra hora. Um objeto que a dica cita
      pelo horário TEM de mostrar aquele horário; os dois ponteiros são
      girados no carregamento, em torno do centro do mostrador. */
(function (global) {
  'use strict';

  var ARQUIVO = 'assets/ac/casa-da-costa-pisos.glb';

  /* Camadas, de cima para baixo. `terreno` nunca se solta. */
  var CAMADAS = ['telhado', 'piso-2', 'piso-1', 'porao', 'terreno'];

  /* Cada alvo é um punhado de nós do GLB. A escolha é por nome e por
     ancestral — nunca por índice, que muda a cada reexportação do modelo. */
  var ALVOS = [
    /* A pedra da frente, não a do portão: aquela fica a 0,046 do pilar, e
       mirar nela acertava o pilar — medido com um toque de verdade a 390×844,
       em 17/09/2026. Dois alvos do mesmo capítulo colados são ponto perdido
       por defeito de posição, não por engano de dedução. */
    { id: 'pedra-do-caminho', camada: 'terreno', nome: 'pedra-solta', extremo: 'maiorZ' },
    { id: 'pilar-do-portao', camada: 'terreno', nomes: ['pilar-de-portao', 'capitel-de-portao'], extremo: 'menorX' },
    { id: 'moita-do-caminho', camada: 'terreno', nome: 'moita', extremo: 'menorX' },
    { id: 'laje-de-chegada', camada: 'terreno', nome: 'laje-de-chegada' },
    /* Só DOIS dos quatro quartos aparecem quando o telhado sai: a torre fica
       na frente dos outros dois. Medido — `armario` do quarto norte respondia
       a 1 direção de 72, e o do leste a nenhuma. Os alvos deste capítulo são
       os dois quartos que de fato se abrem. */
    { id: 'armario-do-quarto-distante', camada: 'piso-2', ancestral: 'quarto-oeste', prefixo: 'armario' },
    { id: 'castical-do-quarto-distante', camada: 'piso-2', ancestral: 'quarto-oeste', nomes: ['castical', 'vela-de-cabeceira'] },
    { id: 'armario-do-quarto-vizinho', camada: 'piso-2', ancestral: 'quarto-sul', prefixo: 'armario' },
    { id: 'castical-do-quarto-vizinho', camada: 'piso-2', ancestral: 'quarto-sul', nomes: ['castical', 'vela-de-cabeceira'] },
    { id: 'relogio-de-pendulo', camada: 'piso-1', ancestral: 'relogio-de-pendulo' },
    { id: 'escrivaninha', camada: 'piso-1', ancestral: 'escrivaninha' },
    { id: 'candelabro', camada: 'piso-1', ancestral: 'candelabro' },
    { id: 'espelho', camada: 'piso-1', ancestral: 'sala-escura', nomes: ['espelho', 'moldura-do-espelho'] }
  ];

  /* As três fechaduras correm pela CHAMINÉ da casa: a porta abre a caixa, o
     peito da chaminé solta o andar dos quartos e o consolo da lareira, embaixo
     dele, solta o térreo. A mesa de mapas da torre e a ferragem do alçapão
     foram descartadas na medição: nenhuma das duas é visível no momento em que
     serviria de fechadura — a torre esconde uma, o assoalho esconde a outra. */
  var FECHADURAS = [
    { id: 'fechadura-portada', camada: 'piso-1', nome: 'macaneta' },
    { id: 'fechadura-chamine', camada: 'piso-2', nomes: ['peito-de-chamine-superior'] },
    { id: 'fechadura-lareira', camada: 'piso-1', nomes: ['consolo-da-lareira', 'lareira-peito'] }
  ];

  /* Uma peça que o GLB põe num grupo e a ATIVIDADE precisa noutro. O forro do
     piso 2 é a TAMPA dos quartos: enquanto ele ficava na camada `piso-2`, tirar
     o telhado descobria um teto liso — os quatro armários continuavam fechados
     debaixo dele e nenhuma direção de olhar os alcançava. Medido: 0 de 36. */
  var EXCECOES = { 'forro-piso-2': 'telhado' };

  /* A descoberta. Medido: com o terreno opaco, a passagem responde a ZERO de
     72 direções — ela corre por baixo do chão, para fora da pegada da casa.
     Por isso, no fim, o terreno fica fantasma em vez de continuar sólido. */
  var REVELACAO = { id: 'passagem-oculta', camada: 'porao', nomes: ['aduela-da-passagem', 'laje-da-passagem', 'barra', 'porta-de-ferro'] };

  var RELOGIO = { hora: 21, minuto: 29 };

  function nomesDe(regra) { return regra.nomes || (regra.nome ? [regra.nome] : null); }

  /* O GLTFLoader do r128 desempata nomes repetidos com sufixo: as nove lajes do
     terreiro chegam como `laje-de-chegada`, `laje-de-chegada_1`… `_8`.
     Comparar por igualdade recolhia UMA laje e deixava oito mudas ao toque —
     e nada acusava, porque uma laje respondia. */
  function bate(nome, alvo) {
    if (!nome) return false;
    if (nome === alvo) return true;
    if (nome.length > alvo.length + 1 && nome.indexOf(alvo + '_') === 0) return /^\d+$/.test(nome.slice(alvo.length + 1));
    return false;
  }

  function bateAlgum(nome, lista) {
    for (var i = 0; i < lista.length; i++) if (bate(nome, lista[i])) return true;
    return false;
  }

  function temAncestral(objeto, nome) {
    for (var n = objeto; n; n = n.parent) if (bate(n.name, nome)) return true;
    return false;
  }

  /* ---- fusão por material -------------------------------------------- */

  function fundir(malhas, raiz) {
    /* Junta as malhas dadas num BufferGeometry só, já no espaço da raiz.
       Todas as primitivas deste modelo têm POSITION, NORMAL e TEXCOORD_0. */
    var total = 0, totalIdx = 0, i, j;
    var preparadas = [];
    var inversa = new THREE.Matrix4().copy(raiz.matrixWorld).invert();
    for (i = 0; i < malhas.length; i++) {
      var g = malhas[i].geometry;
      var pos = g.attributes.position;
      if (!pos) continue;
      var idx = g.index ? g.index.array : null;
      preparadas.push({ malha: malhas[i], g: g, n: pos.count, idx: idx });
      total += pos.count;
      totalIdx += idx ? idx.length : pos.count;
    }
    if (!total) return null;
    var P = new Float32Array(total * 3), N = new Float32Array(total * 3), U = new Float32Array(total * 2);
    var I = total > 65535 ? new Uint32Array(totalIdx) : new Uint16Array(totalIdx);
    var vBase = 0, iBase = 0;
    var m4 = new THREE.Matrix4(), m3 = new THREE.Matrix3(), v = new THREE.Vector3();
    for (i = 0; i < preparadas.length; i++) {
      var p = preparadas[i], geo = p.g;
      m4.multiplyMatrices(inversa, p.malha.matrixWorld);
      m3.getNormalMatrix(m4);
      var ap = geo.attributes.position, an = geo.attributes.normal, au = geo.attributes.uv;
      for (j = 0; j < p.n; j++) {
        v.set(ap.getX(j), ap.getY(j), ap.getZ(j)).applyMatrix4(m4);
        P[(vBase + j) * 3] = v.x; P[(vBase + j) * 3 + 1] = v.y; P[(vBase + j) * 3 + 2] = v.z;
        if (an) { v.set(an.getX(j), an.getY(j), an.getZ(j)).applyMatrix3(m3).normalize();
          N[(vBase + j) * 3] = v.x; N[(vBase + j) * 3 + 1] = v.y; N[(vBase + j) * 3 + 2] = v.z; }
        if (au) { U[(vBase + j) * 2] = au.getX(j); U[(vBase + j) * 2 + 1] = au.getY(j); }
      }
      if (p.idx) { for (j = 0; j < p.idx.length; j++) I[iBase + j] = vBase + p.idx[j]; iBase += p.idx.length; }
      else { for (j = 0; j < p.n; j++) I[iBase + j] = vBase + j; iBase += p.n; }
      vBase += p.n;
    }
    var saida = new THREE.BufferGeometry();
    saida.setAttribute('position', new THREE.BufferAttribute(P, 3));
    saida.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    saida.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    saida.setIndex(new THREE.BufferAttribute(I, 1));
    saida.computeBoundingSphere();
    return saida;
  }

  /* ---- relógio ---------------------------------------------------------- */

  function acertarRelogio(raiz) {
    var mostrador = null, ponteiros = [];
    raiz.traverse(function (o) {
      if (!temAncestral(o, 'relogio-de-pendulo')) return;
      if (o.name === 'mostrador') mostrador = o;
      if (o.name === 'ponteiro-das-horas') ponteiros.push({ objeto: o, alvo: ((RELOGIO.hora % 12) + RELOGIO.minuto / 60) * 30 });
      if (o.name === 'ponteiro-dos-minutos') ponteiros.push({ objeto: o, alvo: RELOGIO.minuto * 6 });
    });
    if (!mostrador || ponteiros.length !== 2) return null;
    var centroMundo = new THREE.Box3().setFromObject(mostrador).getCenter(new THREE.Vector3());
    var giros = [];
    for (var i = 0; i < ponteiros.length; i++) {
      var o = ponteiros[i].objeto;
      /* Tudo aqui é feito no espaço do PAI do ponteiro. Medir no mundo e
         escrever no local só coincidiria se a cadeia acima fosse identidade —
         e não é: o modelo inteiro está dentro do grupo de normalização. */
      var eixo = o.parent.worldToLocal(centroMundo.clone());
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      var c = o.geometry.boundingBox.clone().applyMatrix4(o.matrix);
      var cantos = [[c.min.x, c.min.y], [c.min.x, c.max.y], [c.max.x, c.min.y], [c.max.x, c.max.y]];
      var melhor = null, dist = -1;
      for (var k = 0; k < 4; k++) {
        var dx = cantos[k][0] - eixo.x, dy = cantos[k][1] - eixo.y, d = dx * dx + dy * dy;
        if (d > dist) { dist = d; melhor = [dx, dy]; }
      }
      /* Ângulo de relógio: zero às 12h, crescendo no sentido dos ponteiros. */
      var atual = (Math.atan2(melhor[0], melhor[1]) * 180 / Math.PI + 360) % 360;
      var delta = (ponteiros[i].alvo - atual) * Math.PI / 180;
      /* Geometria compartilhada entre nós: clonar antes de mudar o pivô. E
         assar a matriz local antes de zerá-la, senão um modelo futuro que
         traga transformação no ponteiro perde a pose sem avisar. */
      var geo = o.geometry.clone().applyMatrix4(o.matrix);
      geo.translate(-eixo.x, -eixo.y, -eixo.z);
      o.geometry = geo;
      o.position.set(eixo.x, eixo.y, eixo.z);
      o.quaternion.identity();
      o.rotation.z = -delta;
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      giros.push({ nome: o.name, de: atual, para: ponteiros[i].alvo });
    }
    raiz.updateMatrixWorld(true);
    return giros;
  }

  /* ---- chave ------------------------------------------------------------ */

  function criarChave() {
    var grupo = new THREE.Group();
    grupo.name = 'chave';
    var latao = new THREE.MeshStandardMaterial({ color: 0xd8b25e, roughness: 0.42, metalness: 0.85, emissive: 0x2a1c05 });
    /* 7 cm de chave num modelo de 1 m. Medido na tela em 17/09/2026: com 4 cm
       ela ocupava meia dúzia de pixels e o jogador via só o círculo do gesto. */
    var haste = new THREE.Mesh(new THREE.CylinderGeometry(0.0040, 0.0040, 0.072, 12), latao);
    haste.rotation.z = Math.PI / 2;
    var argola = new THREE.Mesh(new THREE.TorusGeometry(0.0130, 0.0036, 10, 20), latao);
    argola.position.x = -0.047; argola.rotation.y = Math.PI / 2;
    var palheta = new THREE.Mesh(new THREE.BoxGeometry(0.0100, 0.0162, 0.0040), latao);
    palheta.position.set(0.0279, -0.0081, 0);
    var dente = new THREE.Mesh(new THREE.BoxGeometry(0.0040, 0.0100, 0.0040), latao);
    dente.position.set(0.0153, -0.0063, 0);
    grupo.add(haste, argola, palheta, dente);
    var ponta = new THREE.Object3D();
    ponta.position.set(0.0360, 0, 0);
    grupo.add(ponta);
    grupo.userData.exportExclude = true;
    return { grupo: grupo, ponta: ponta, material: latao };
  }

  /* ---- halo dos alvos e das fechaduras ----------------------------------- */

  /* Um alfinete: fio fino saindo do objeto e uma conta de luz em cima. O anel
     no chão sozinho não se vê — medido na tela em 17/09/2026, sobre o lajeado
     claro e sobre a pedra ele simplesmente desaparece. O fio é o que liga a
     marca AO OBJETO; sem ele a conta flutuando aponta para nada. */
  function alfinete(cor, altura) {
    var grupo = new THREE.Group();
    /* Com `depthTest:false` o alfinete aparecia POR CIMA do telhado mesmo
       quando o objeto estava do outro lado da casa — uma marca que aponta para
       onde a coisa não está. Ele respeita a profundidade; quem enquadra a cena
       é que põe a câmera do lado certo. */
    var material = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0 });
    var fio = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, altura, 6), material);
    fio.position.y = altura / 2;
    var conta = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 12, 10), material);
    conta.position.y = altura;
    grupo.add(fio, conta);
    grupo.renderOrder = 6;
    grupo.userData.exportExclude = true;
    grupo.userData.marca = material;
    grupo.traverse(function (o) { o.raycast = function () {}; });
    return grupo;
  }

  function halo(cor, raio) {
    var m = new THREE.Mesh(
      new THREE.RingGeometry(raio * 0.72, raio, 28).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
    );
    m.userData.exportExclude = true;
    m.raycast = function () {};
    return m;
  }

  /* ---- carregamento ------------------------------------------------------ */

  function carregar(opcoes, pronto, falhou) {
    opcoes = opcoes || {};
    var url = opcoes.url || ARQUIVO;
    new THREE.GLTFLoader().load(url, function (gltf) {
      try { pronto(montar(gltf.scene, opcoes)); }
      catch (e) { if (falhou) falhou(e); else throw e; }
    }, null, function (e) { if (falhou) falhou(e || Error('Não foi possível carregar a maquete.')); });
  }

  function montar(cena, opcoes) {
    cena.updateMatrixWorld(true);

    /* 1 — normalizar para pegada 1, base em y=0, centro em x/z. */
    var bruto = new THREE.Box3().setFromObject(cena);
    var tamanho = bruto.getSize(new THREE.Vector3());
    var escala = 1 / Math.max(tamanho.x, tamanho.z);
    var centro = bruto.getCenter(new THREE.Vector3());
    var ajuste = new THREE.Group();
    ajuste.name = 'maquete-normalizada';
    ajuste.scale.setScalar(escala);
    ajuste.position.set(-centro.x * escala, -bruto.min.y * escala, -centro.z * escala);
    ajuste.add(cena);
    var raiz = new THREE.Group();
    raiz.name = 'maquete';
    raiz.add(ajuste);
    raiz.updateMatrixWorld(true);

    var relogio = acertarRelogio(raiz);

    /* 2 — recolher alvos e fechaduras ANTES de fundir: o que vira geometria
       fundida perde o nome e não pode mais ser tocado nem aceso. */
    var reservados = new Set();
    var alvos = {}, i;
    for (i = 0; i < ALVOS.length; i++) alvos[ALVOS[i].id] = recolher(raiz, ALVOS[i], reservados);
    var fechaduras = {};
    for (i = 0; i < FECHADURAS.length; i++) fechaduras[FECHADURAS[i].id] = recolher(raiz, FECHADURAS[i], reservados);
    var revelacao = recolher(raiz, REVELACAO, reservados);

    /* 3 — camadas: cada uma vira um grupo próprio, com material próprio, para
       poder subir e desaparecer sem levar as outras junto. */
    var camadas = {}, restante = [];
    for (i = 0; i < CAMADAS.length; i++) camadas[CAMADAS[i]] = novaCamada(CAMADAS[i], raiz);
    raiz.updateMatrixWorld(true);
    raiz.traverse(function (o) {
      if (o.isMesh && !reservados.has(o) && !o.userData.exportExclude) restante.push(o);
    });
    var porCamada = {};
    for (i = 0; i < restante.length; i++) {
      var nome = camadaDe(restante[i]);
      (porCamada[nome] || (porCamada[nome] = [])).push(restante[i]);
    }
    var desenhos = 0;
    for (var nomeCamada in porCamada) {
      var grupo = camadas[nomeCamada] || camadas['terreno'];
      var porMaterial = new Map();
      var lista = porCamada[nomeCamada];
      for (i = 0; i < lista.length; i++) {
        var mat = lista[i].material;
        if (!porMaterial.has(mat)) porMaterial.set(mat, []);
        porMaterial.get(mat).push(lista[i]);
      }
      porMaterial.forEach(function (malhas, material) {
        var geo = fundir(malhas, grupo);
        if (!geo) return;
        var copia = material.clone();
        copia.side = THREE.FrontSide;
        var malha = new THREE.Mesh(geo, copia);
        malha.name = nomeCamada + '/' + (material.name || 'material');
        malha.castShadow = true; malha.receiveShadow = true;
        grupo.add(malha);
        desenhos++;
      });
    }
    /* Os nós originais ficam fora da cena: já viraram geometria fundida. */
    var original = raiz.children[0];
    raiz.remove(original);

    /* 4 — reencaixar alvos e fechaduras nas suas camadas, agora como peças
       independentes e clicáveis. */
    var idsAlvo = Object.keys(alvos);
    for (i = 0; i < idsAlvo.length; i++) prender(alvos[idsAlvo[i]], camadas, raiz, 'alvo');
    var idsFech = Object.keys(fechaduras);
    for (i = 0; i < idsFech.length; i++) prender(fechaduras[idsFech[i]], camadas, raiz, 'fechadura');
    prender(revelacao, camadas, raiz, 'fechadura');

    /* 5 — âncoras das fechaduras: o ponto exato que o motor confere. */
    var ancoras = [];
    for (i = 0; i < FECHADURAS.length; i++) {
      var p = opcoes.pontos ? opcoes.pontos[i] : null;
      var ancora = new THREE.Object3D();
      ancora.name = 'ancora-' + FECHADURAS[i].id;
      if (p) ancora.position.set(p[0], p[1], p[2]);
      else {
        var c = fechaduras[FECHADURAS[i].id];
        ancora.position.set(c.centro.x, c.caixa.max.y, c.centro.z);
      }
      ancora.userData.exportExclude = true;
      raiz.add(ancora);
      var anel = halo(0xffd489, 0.026);
      anel.position.copy(ancora.position);
      anel.position.y += 0.0015;
      raiz.add(anel);
      var pino = alfinete(0xffd489, 0.055);
      pino.position.copy(ancora.position);
      raiz.add(pino);
      ancoras.push({ ponto: ancora, halo: anel, pino: pino, id: FECHADURAS[i].id, peca: fechaduras[FECHADURAS[i].id] });
    }

    var chave = criarChave();
    raiz.add(chave.grupo);

    raiz.updateMatrixWorld(true);
    /* A caixa que interessa é a da MAQUETE, não a da cena: a chave nasce na
       origem e desceria a base uns 9 mm, o que em RA enterraria a casa na
       mesa por conta de um objeto que nem está posto ainda. */
    var completo = new THREE.Box3();
    for (i = 0; i < CAMADAS.length; i++) completo.expandByObject(camadas[CAMADAS[i]]);

    return {
      raiz: raiz,
      camadas: camadas,
      ordemDasCamadas: CAMADAS.slice(),
      alvos: alvos,
      fechaduras: fechaduras,
      ancoras: ancoras,
      chave: chave.grupo,
      chavePonta: chave.ponta,
      chaveMaterial: chave.material,
      revelacao: revelacao,
      baseY: completo.min.y,
      altura: completo.max.y - completo.min.y,
      escalaOriginal: escala,
      relogio: relogio,
      desenhos: desenhos
    };
  }

  function novaCamada(nome, raiz) {
    var g = new THREE.Group();
    g.name = 'camada-' + nome;
    g.userData.camada = nome;
    g.userData.restY = 0;
    raiz.add(g);
    return g;
  }

  /* A camada de um nó é o ancestral de primeiro nível dentro de `casa-da-costa`. */
  function camadaDe(objeto) {
    for (var n = objeto; n; n = n.parent) {
      for (var e in EXCECOES) if (bate(n.name, e)) return EXCECOES[e];
      for (var i = 0; i < CAMADAS.length; i++) if (bate(n.name, CAMADAS[i])) return CAMADAS[i];
    }
    return 'terreno';
  }

  function recolher(raiz, regra, reservados) {
    var nomes = nomesDe(regra), pecas = [];
    raiz.traverse(function (o) {
      if (!o.isMesh) return;
      if (regra.ancestral && !temAncestral(o, regra.ancestral)) return;
      if (nomes) {
        var achado = false;
        for (var n = o; n && !achado; n = n.parent) if (bateAlgum(n.name, nomes)) achado = true;
        if (!achado) return;
      }
      if (regra.prefixo) {
        var achou = false;
        for (var k = o; k && !achou; k = k.parent) if (k.name && k.name.indexOf(regra.prefixo) === 0) achou = true;
        if (!achou) return;
      }
      pecas.push(o);
    });
    if (regra.extremo === 'maiorZ' || regra.extremo === 'menorX') {
      var eixo = regra.extremo === 'maiorZ' ? 'z' : 'x', sinal = regra.extremo === 'maiorZ' ? -1 : 1;
      /* `menorX` recolhe o CONJUNTO do extremo — é o pilar com o seu capitel.
         `maiorZ` recolhe UMA peça: as pedras soltas estão espalhadas, e juntar
         três põe o centro do alvo (e o alfinete) no chão entre elas. */
      var folga = regra.extremo === 'menorX' ? 0.06 : 0.001;
      /* Vários nós com o mesmo nome espalhados pelo terreno: fica o CONJUNTO do
         portão, o de menor x. Ficar com uma peça só partia o pilar do seu
         capitel; ficar com todas punha o centro do alvo no vão ENTRE os dois
         pilares, onde não há geometria nenhuma — e o toque não acertava nada. */
      var centros = [], menor = Infinity, i;
      for (i = 0; i < pecas.length; i++) {
        var c = new THREE.Box3().setFromObject(pecas[i]).getCenter(new THREE.Vector3());
        centros.push(c); if (c[eixo] * sinal < menor) menor = c[eixo] * sinal;
      }
      var perto = [];
      for (i = 0; i < pecas.length; i++) if (centros[i][eixo] * sinal < menor + folga) perto.push(pecas[i]);
      pecas = perto;
    }
    for (var j = 0; j < pecas.length; j++) {
      reservados.add(pecas[j]);
      /* A pose de mundo é guardada AQUI porque `prender` roda depois de a
         árvore original sair da cena — ler `matrixWorld` lá seria ler restos. */
      pecas[j].userData.poseDeMundo = pecas[j].matrixWorld.clone();
    }
    return { id: regra.id, camada: regra.camada, pecas: pecas };
  }

  function prender(conjunto, camadas, raiz, tipo) {
    var destino = camadas[conjunto.camada] || raiz;
    var grupo = new THREE.Group();
    grupo.name = tipo + '-' + conjunto.id;
    grupo.userData[tipo === 'alvo' ? 'object' : 'fechadura'] = conjunto.id;
    destino.add(grupo);
    destino.updateMatrixWorld(true);
    var inversa = new THREE.Matrix4().copy(destino.matrixWorld).invert();
    var caixaLocal = new THREE.Box3();
    for (var i = 0; i < conjunto.pecas.length; i++) {
      var p = conjunto.pecas[i];
      var m = new THREE.Matrix4().multiplyMatrices(inversa, p.userData.poseDeMundo || p.matrixWorld);
      var copia = new THREE.Mesh(p.geometry, p.material.clone());
      copia.name = p.name;
      /* Cada peça de alvo e de fechadura tem material PRÓPRIO justamente para
         poder acender. A maçaneta da portada, por exemplo, fica debaixo da
         verga: um alfinete saindo dela nasce dentro da pedra e não se vê. */
      if (copia.material.emissive) { copia.material.emissive.setHex(0x000000); copia.userData.acendivel = true; }
      m.decompose(copia.position, copia.quaternion, copia.scale);
      copia.castShadow = true; copia.receiveShadow = true;
      grupo.add(copia);
      var local = p.geometry.boundingBox ? p.geometry.boundingBox.clone() : new THREE.Box3().setFromBufferAttribute(p.geometry.attributes.position);
      caixaLocal.union(local.applyMatrix4(m));
    }
    grupo.updateMatrixWorld(true);
    var tem = conjunto.pecas.length > 0;
    var centro = tem ? caixaLocal.getCenter(new THREE.Vector3()) : new THREE.Vector3();
    /* O anel é MARCA, não contorno. Sem teto, os dois pilares do portão viram
       um anel de 24 cm que atravessa metade do terreiro. */
    var raio = tem ? Math.min(0.040, Math.max(0.012, Math.max(caixaLocal.max.x - caixaLocal.min.x, caixaLocal.max.z - caixaLocal.min.z) * 0.62)) : 0.012;
    var cor = tipo === 'alvo' ? 0x9fe7d6 : 0xffd489;
    var anel = halo(cor, raio);
    anel.position.set(centro.x, (tem ? caixaLocal.min.y : 0) + 0.0015, centro.z);
    grupo.add(anel);
    var pino = alfinete(cor, 0.055);
    pino.position.set(centro.x, tem ? caixaLocal.max.y + 0.004 : 0, centro.z);
    grupo.add(pino);
    conjunto.grupo = grupo;
    conjunto.halo = anel;
    conjunto.pino = pino;
    conjunto.acender = function (cor, forca) {
      grupo.traverse(function (o) {
        if (!o.userData.acendivel || !o.material || !o.material.emissive) return;
        o.material.emissive.setHex(cor);
        o.material.emissiveIntensity = forca;
      });
    };
    conjunto.centro = centro.clone();
    conjunto.caixa = caixaLocal.clone();
    return grupo;
  }

  global.ACMaquetteMundo = {
    carregar: carregar,
    montar: montar,
    ARQUIVO: ARQUIVO,
    CAMADAS: CAMADAS,
    ALVOS: ALVOS,
    FECHADURAS: FECHADURAS,
    RELOGIO: RELOGIO
  };
})(typeof window !== 'undefined' ? window : globalThis);
