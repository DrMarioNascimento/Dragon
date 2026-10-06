/* A maquete da Agência 0688 — a peça RA que entra no Capítulo 1 e vai sendo
   abastecida a cada capítulo (decisão do Mario, 06/10: "a maquete é que
   manda"; "no Cap 1 entra a maquete mais o malote").

   · Modelo base: modelos/agencia-0688-base.glb — o arquivo do designer sem o
     que a história ainda não revelou (Passagem de Serviço, malote, lacre,
     campos das câmeras), sem as luzes da noite e com as peças juntadas por
     sala (de ~3.400 para ~260 desenhos por quadro).
   · Itens: arquivos à parte no MESMO referencial (modelos/item-*.glb). Peças
     sem modelo próprio aparecem como um marcador dourado no lugar onde a
     história as põe; tocar abre a peça de perto (o desenho que já existe).
   · RA: o motor comum d'A Casa (../v1/js/ac-ra.js e ac-maquete-ra.js):
     WebXR no Android, 8th Wall no iPhone. Sem RA, a maquete fica na tela,
     com órbita.

   Uso (mesa.html): CFIMaquete.abrir({itens, revelados, info, aoAbrirItem}). */
(function (global) {
  'use strict';

  var BASE = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^/]*$/, '') : ''; })();
  var V1 = BASE + '../v1/js/';
  var SCRIPTS = [V1 + 'three.min.js', V1 + 'vendor/GLTFLoader.js', V1 + 'vendor/OrbitControls.js', V1 + 'ac-ra.js', V1 + 'ac-maquete-ra.js'];
  var MODELO = BASE + 'modelos/agencia-0688-base.glb';

  /* metros da maquete → "1 de pegada" do motor de RA (≈ 42 cm na mesa) */
  var LARGURA = 50, CENTRO = { x: -5, z: 1.5 };

  /* As salas que o jogo conhece, pelo número da etiqueta do designer. */
  var SALA = { 1: 'porta-giratoria', 2: 'saguao', 3: 'guiches', 4: 'mesa-recebimento', 5: 'sala-gerencia', 6: 'banheiro', 7: 'porta-lateral',
    8: 'corredor-restrito', 9: 'central', 10: 'arquivo-morto', 11: 'rack-tecnico', 13: 'antecamara', 14: 'cofre', 15: 'eclusa',
    16: 'vaga-blindada', 17: 'farmacia', 18: 'padaria' };
  /* Ruas que não são peça do modelo: decididas pelo ponto tocado. */
  /* Piso de cada lugar (metros, como na planta): o toque no chão, numa
     parede ou numa rua cai no lugar certo. Os pequenos vêm primeiro. */
  var RUAS = [['porta-giratoria', -4.2, -0.6, 7.7, 10.8], ['porta-lateral', -11.2, -9.9, 2.9, 4.5], ['rack-tecnico', -5.2, -4.5, -6.5, -5.4],
    ['mesa-recebimento', 0.9, 2.4, 3.6, 6.8], ['guiches', -0.3, 0.9, 3, 8.2], ['eclusa', 2.4, 4.85, 3, 8.2], ['saguao', -10.2, -0.3, 3, 8.5],
    ['sala-gerencia', -7.7, -4.5, -1, 3], ['banheiro', -10.2, -7.7, -1, 3], ['corredor-restrito', -4.5, -2.5, -6.5, 3],
    ['central', -2.5, 1.2, -3, 3], ['arquivo-morto', -9.4, -4.5, -5.4, -1.8], ['antecamara', -2.5, 1.2, -6.5, -3], ['cofre', 1.2, 4.2, -6.5, -1.5],
    ['vaga-blindada', 5, 9, -9.3, 11.5], ['farmacia', 9, 17, -6.8, 9], ['padaria', -27, -19.4, -0.5, 8.5],
    ['avenida', -30, 20, 11.5, 19.5], ['rua-de-tras', -19.4, -13, -9.3, 11.5]];

  /* Onde cada peça de capítulo fica na maquete (metros). */
  var ITENS = {
    c1: { nome: 'O malote murcho', em: [-6.9, 0.5, -4.0], modelo: 'modelos/item-malote.glb' },
    c2: { nome: 'O rádio reserva', em: [-7.47, 1.33, 1.5] },
    c3: { nome: 'A impressora de etiquetas', em: [-7.47, 1.45, 2.15] },
    c4: { nome: 'O armário de vestígios', em: [-4.9, 2.45, -5.95] },
    c5: { nome: 'A balança de custódia', em: [6.9, 3.1, 5.0] },
    c6: { nome: 'A noite de onze dias antes', em: [0.25, 1.75, 6.35] },
    c7: { nome: 'A escrivaninha das quinze versões', em: [1.1, 1.25, 5.2] }
  };
  /* Revelações que mudam a própria maquete. */
  var REVELA = {
    passagem: { modelo: 'modelos/item-passagem.glb', esconde: ['macico'] },
    campos: { modelo: 'modelos/item-campos.glb' }
  };

  var pronto = null, el = null, renderer, cena, camera, controles, raiz, modelo, ra = null, opcoes = {};
  var LUZ = {}, perto = null, emPerto = false, bordaAlvo = 0;
  var pinos = [], extras = {}, realce = null, relogio = 0, andarDeCima = false, tocando = null, ativo = false;

  function carregarScript(src) {
    return new Promise(function (ok, falha) {
      if (document.querySelector('script[data-maq="' + src + '"]')) return ok();
      var s = document.createElement('script'); s.src = src; s.async = false; s.setAttribute('data-maq', src);
      s.onload = function () { ok(); }; s.onerror = function () { falha(Error('Não carregou ' + src)); };
      document.head.appendChild(s);
    });
  }
  function carregarTudo() {
    if (pronto) return pronto;
    var cadeia = Promise.resolve();
    SCRIPTS.forEach(function (s) {
      cadeia = cadeia.then(function () {
        if (/three\.min/.test(s) && global.THREE) return;
        return carregarScript(s);
      });
    });
    pronto = cadeia.then(montar);
    pronto.catch(function () { pronto = null; });
    return pronto;
  }

  /* ---------------- tela ---------------- */
  function criarTela() {
    el = document.createElement('div');
    el.id = 'telaMaquete'; el.className = 'tela-maq'; el.hidden = true;
    el.innerHTML =
      '<div class="maq-palco" id="maqPalco"></div>' +
      '<div class="maq-topo"><button type="button" class="sair-ra" id="maqSair">‹ Voltar</button>' +
      '<div class="maq-tit"><b>A maquete · Agência 0688</b><span id="maqDica">Arraste para girar. Toque numa sala ou num marcador dourado.</span></div></div>' +
      '<div class="maq-ferr"><button type="button" id="maqAndar" aria-pressed="false">Ver o andar de cima</button>' +
      '<button type="button" id="maqRA" hidden>Pôr na mesa (RA)</button><button type="button" id="maqPousar" hidden>Pousar aqui</button></div>' +
      '<div class="planta-card maq-card"><small id="maqRot">A MAQUETE</small><p id="maqTxt">Toque numa sala para ver o que há nela.</p><div id="maqAcao"></div></div>' +
      '<div class="maq-carregando" id="maqCarregando">Montando a maquete…</div>';
    document.body.appendChild(el);
    var css = document.createElement('style');
    css.textContent =
      '.tela-maq{position:fixed;inset:0;z-index:86;background:#0b1520;display:flex;flex-direction:column;touch-action:none}' +
      '.tela-maq[hidden]{display:none}' +
      '.maq-palco{position:absolute;inset:0}.maq-palco canvas{display:block;width:100%;height:100%;touch-action:none}' +
      '.maq-topo{position:relative;z-index:3;display:flex;gap:10px;align-items:flex-start;padding:calc(env(safe-area-inset-top) + 10px) 10px 8px;background:linear-gradient(#0b1520f0,#0b152000);pointer-events:none}' +
      '.maq-topo>*{pointer-events:auto}.maq-topo .sair-ra{position:static;flex:0 0 auto;min-height:40px;padding:0 14px;border-radius:10px;border:1px solid #46667a;background:#0c1b26e6;color:#efc878;font:700 13px var(--sans,system-ui);cursor:pointer;box-shadow:0 3px 0 #020609}' +
      '.maq-tit{display:flex;flex-direction:column;font:500 12.5px/1.45 var(--termfont,monospace);color:var(--term,#9fe9c0)}' +
      '.maq-tit b{color:#efc878;font:600 18px/1.2 var(--display,Georgia,serif)}' +
      '.maq-ferr{position:relative;z-index:3;display:flex;flex-wrap:wrap;gap:8px;padding:0 10px;margin-top:auto;justify-content:center}' +
      '.maq-ferr button{min-height:44px;padding:0 14px;border-radius:22px;border:1px solid #46667a;background:#0c1b26e6;color:#efc878;font:700 12.5px var(--sans,system-ui);cursor:pointer}' +
      '.maq-ferr button[aria-pressed=true]{border-color:#efc878}' +
      '.maq-ferr #maqRA,.maq-ferr #maqPousar{background:linear-gradient(180deg,#f3d078,#e0b13a);color:#1a1206;border-color:#d6aa58}' +
      '.maq-card{position:relative;z-index:3;margin:8px 10px calc(env(safe-area-inset-bottom) + 10px)!important}' +
      '.maq-card .acao{margin-top:9px;width:100%;min-height:42px;border-radius:9px;border:1px solid #d6aa58;background:linear-gradient(180deg,#f3d078,#e0b13a);color:#1a1206;font:700 12.5px var(--termfont,monospace);cursor:pointer}' +
      '.maq-carregando{position:absolute;z-index:4;left:50%;top:45%;transform:translate(-50%,-50%);padding:12px 18px;border-radius:10px;background:#08130fe6;border:1px solid #2f6b4e;color:#9fe9c0;font:500 13px var(--termfont,monospace)}' +
      '.maq-carregando[hidden]{display:none}' +
      'body.in-ar{background:transparent!important}body.in-ar>*:not(#telaMaquete){visibility:hidden!important}' +
      'body.in-ar .tela-maq{background:transparent}body.ra-webxr .maq-palco canvas{visibility:hidden}' +
      'body.in-ar #maqAndar{display:none}';
    document.head.appendChild(css);
    el.querySelector('#maqSair').onclick = function () { if (emPerto) sairPerto(); else fechar(); };
    el.querySelector('#maqAndar').onclick = function () { mostrarAndar(!andarDeCima); };
    el.querySelector('#maqRA').onclick = entrarRA;
    el.querySelector('#maqPousar').onclick = pousar;
  }

  function cartao(rot, txt, acao) {
    el.querySelector('#maqRot').textContent = rot;
    var p = el.querySelector('#maqTxt');
    if (opcoes.digitar) { p.innerHTML = ''; opcoes.digitar(p, txt); } else p.innerHTML = txt;
    var a = el.querySelector('#maqAcao'); a.innerHTML = '';
    if (acao) { var b = document.createElement('button'); b.className = 'acao'; b.type = 'button'; b.textContent = acao[0]; b.onclick = acao[1]; a.appendChild(b); }
  }
  function dica(t) { el.querySelector('#maqDica').textContent = t; }

  /* ---------------- cena ---------------- */
  function montar() {
    var THREE = global.THREE;
    var palco = el.querySelector('#maqPalco');
    cena = new THREE.Scene();
    cena.background = new THREE.Color(0x0b1520);
    camera = new THREE.PerspectiveCamera(42, 1, 0.005, 40);
    cena.add(camera);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 1.75));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.xr.enabled = true;
    palco.appendChild(renderer.domElement);

    /* Terça, 7h47, garoa: luz fria e difusa, sem sol marcado. */
    LUZ.hemi = new THREE.HemisphereLight(0xd6e2ec, 0x2a2f33, 0.95); cena.add(LUZ.hemi);
    LUZ.ceu = new THREE.DirectionalLight(0xe9eef2, 0.9); LUZ.ceu.position.set(-0.6, 1.6, 0.9); cena.add(LUZ.ceu);
    LUZ.fria = new THREE.DirectionalLight(0xa9c3d6, 0.35); LUZ.fria.position.set(1.2, 0.8, -1.1); cena.add(LUZ.fria);
    LUZ.amb = new THREE.AmbientLight(0xffffff, 0.18); cena.add(LUZ.amb);
    /* a lanterna da cena de perto: segue a câmera (na RA, o celular) */
    LUZ.lanterna = new THREE.SpotLight(0xfff0d2, 0, 8, 0.2, 0.55, 1); cena.add(LUZ.lanterna); cena.add(LUZ.lanterna.target);

    raiz = new THREE.Group(); raiz.name = 'raiz-maquete'; cena.add(raiz);
    return carregarGLB(MODELO).then(function (g) {
      modelo = g.scene;
      modelo.scale.setScalar(1 / LARGURA);
      modelo.position.set(-CENTRO.x / LARGURA, 0, -CENTRO.z / LARGURA);
      raiz.add(modelo);
      modelo.traverse(function (o) { if (o.isMesh) { o.frustumCulled = true; if (o.material && o.material.name === 'vidro') o.material.depthWrite = false; } });
      mostrarAndar(false);
      var caixa = new THREE.Box3().setFromObject(raiz);
      var baseY = caixa.min.y;

      controles = new THREE.OrbitControls(camera, renderer.domElement);
      controles.enableDamping = true; controles.dampingFactor = 0.08;
      controles.minDistance = 0.18; controles.maxDistance = 2.4;
      controles.maxPolarAngle = Math.PI * 0.47;
      controles.target.set(0.046, 0.02, -0.016);
      camera.position.set(-0.05, 0.8, 0.48);

      if (global.ACMaquetteRA) {
        try {
          ra = global.ACMaquetteRA.criar({ renderer: renderer, cena: cena, camera: camera, raiz: raiz, baseY: baseY,
            aoMudar: aoMudarRA, desenhar: desenhar, aoTocar: function (x, y) { tocar(x, y); } });
          ra.modosPossiveis(function (m) { el.querySelector('#maqRA').hidden = !m.ra; });
        } catch (e) { console.warn('[maquete] RA indisponível', e); ra = null; }
      }
      ligarToques();
      redimensionar();
      global.addEventListener('resize', redimensionar);
      renderer.setAnimationLoop(desenhar);
    });
  }

  function carregarGLB(url) {
    return new Promise(function (ok, falha) { new global.THREE.GLTFLoader().load(url, ok, undefined, falha); });
  }

  function redimensionar() {
    if (!renderer || !el || el.hidden) return;
    var w = global.innerWidth, h = global.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  function mostrarAndar(sim) {
    andarDeCima = sim;
    ['telhado', 'piso-2'].forEach(function (n) { var o = modelo && modelo.getObjectByName(n); if (o) o.visible = sim; });
    if (el) { var b = el.querySelector('#maqAndar'); b.setAttribute('aria-pressed', sim ? 'true' : 'false'); b.textContent = sim ? 'Tirar o andar de cima' : 'Ver o andar de cima'; }
  }

  /* ---------------- itens e revelações ---------------- */
  function aplicarItens() {
    var THREE = global.THREE;
    pinos.forEach(function (p) { modelo.remove(p); }); pinos = [];
    (opcoes.itens || []).forEach(function (id) {
      var D = ITENS[id]; if (!D) return;
      if (D.modelo && !extras[id]) extras[id] = carregarGLB(BASE + D.modelo).then(function (g) { g.scene.userData.item = id; modelo.add(g.scene); marcar(g.scene, id); return g.scene; }).catch(function () {});
      var pino = new THREE.Group(); pino.userData.item = id; pino.userData.pino = true;
      var losango = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), new THREE.MeshBasicMaterial({ color: 0xffb21f, toneMapped: false }));
      losango.scale.set(1, 1.5, 1);
      var anel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 28), new THREE.MeshBasicMaterial({ color: 0xffb21f, transparent: true, opacity: 0.85, toneMapped: false }));
      anel.rotation.x = Math.PI / 2; anel.position.y = -0.9;
      /* um alvo invisível generoso, para o dedo */
      var alvo = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
      /* acima das paredes (4,4 m), com um fio até o ponto exato */
      var topo = Math.max(D.em[1] + 1.6, 5.4);
      var fio = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, topo - D.em[1], 6), new THREE.MeshBasicMaterial({ color: 0xefc878, transparent: true, opacity: 0.75 }));
      fio.position.y = -(topo - D.em[1]) / 2;
      anel.position.y = -(topo - D.em[1]);
      losango.scale.set(1.4, 2.1, 1.4);
      pino.add(losango, anel, alvo, fio);
      pino.position.set(D.em[0], topo, D.em[2]);
      pino.userData.y0 = pino.position.y;
      marcar(pino, id);
      modelo.add(pino); pinos.push(pino);
    });
    var rev = opcoes.revelados || {};
    Object.keys(REVELA).forEach(function (k) {
      var R = REVELA[k], sim = !!rev[k];
      (R.esconde || []).forEach(function (n) { var o = modelo.getObjectByName(n); if (o) o.visible = !sim; });
      if (sim && !extras[k]) extras[k] = carregarGLB(BASE + R.modelo).then(function (g) { modelo.add(g.scene); if (k === 'campos') g.scene.traverse(function (o) { if (o.isMesh) { o.material.transparent = true; o.material.opacity = 0.28; o.material.depthWrite = false; o.raycast = function () {}; } }); return g.scene; }).catch(function () {});
    });
  }
  function marcar(obj, id) { obj.traverse(function (o) { o.userData.item = id; }); }

  /* ---------------- toque ---------------- */
  function ligarToques() {
    var c = renderer.domElement;
    c.addEventListener('pointerdown', function (e) { tocando = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    c.addEventListener('pointerup', function (e) {
      if (!tocando) return;
      var dx = e.clientX - tocando.x, dy = e.clientY - tocando.y, dt = performance.now() - tocando.t; tocando = null;
      if (dx * dx + dy * dy > 81 || dt > 600) return;
      var est = ra && ra.estado();
      if (est && est.modo === 'ra' && !est.posta) { pousar(); return; }
      tocar(e.clientX, e.clientY);
    });
  }

  function tocar(x, y) {
    var THREE = global.THREE, cam = ra ? ra.cameraAtiva() : camera;
    var r = renderer.domElement.getBoundingClientRect();
    var ponto = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    var ray = new THREE.Raycaster(); ray.setFromCamera(ponto, cam);
    if (emPerto) { tocarPerto(ray); return; }
    var alvos = []; modelo.traverse(function (o) { if (o.isMesh && visivel(o)) alvos.push(o); });
    var hits = ray.intersectObjects(alvos, false);
    if (hits.length) {
      var o = hits[0].object;
      if (o.userData.item) { escolherItem(o.userData.item); return; }
      var hp = modelo.worldToLocal(hits[0].point.clone());
      if (hp.y > 4.3 && andarDeCima) return; /* andar de cima: cenário */
      var sala = salaDe(o);
      if (sala) { escolherSala(sala); return; }
    }
    /* sem móvel da sala: vale o ponto do chão para onde o dedo aponta
       (atravessa as paredes, como quem olha para dentro da sala) */
    var inv = new THREE.Matrix4().copy(modelo.matrixWorld).invert();
    var r0 = ray.ray.clone().applyMatrix4(inv);
    var chao = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.44), p = new THREE.Vector3();
    if (!r0.intersectPlane(chao, p)) return;
    for (var k = 0; k < RUAS.length; k++) { var R = RUAS[k]; if (p.x >= R[1] && p.x <= R[2] && p.z >= R[3] && p.z <= R[4]) { escolherSala(R[0], null, R); return; } }
  }
  function visivel(o) { for (var p = o; p; p = p.parent) if (!p.visible) return false; return true; }
  function salaDe(o) {
    for (var p = o; p && p !== modelo; p = p.parent) {
      if (p.userData && p.userData.n && SALA[p.userData.n]) return SALA[p.userData.n];
      var m = /^etiqueta-(\d+)$/.exec(p.name || ''); if (m && SALA[+m[1]]) return SALA[+m[1]];
    }
    return null;
  }

  function escolherSala(id, obj, R) {
    var info = opcoes.info ? opcoes.info(id) : null;
    if (!info) return;
    cartao(info[0].toUpperCase(), info[1]);
    if (!R) for (var k = 0; k < RUAS.length; k++) if (RUAS[k][0] === id) R = RUAS[k];
    destacar(R);
  }
  function escolherItem(id) {
    var D = ITENS[id];
    if (id === 'c1' && opcoes.malote) { cartao(D.nome.toUpperCase(), 'O malote está no chão do Arquivo Morto.', ['Chegar perto, com a lanterna ›', entrarPerto]); destacar(null); return; }
    cartao(D.nome.toUpperCase(), 'A peça do Capítulo ' + id.slice(1) + ' está aqui.', ['Examinar de perto ›', function () { if (opcoes.aoAbrirItem) opcoes.aoAbrirItem(id); }]);
    destacar(null);
  }
  function destacar(obj) {
    var THREE = global.THREE;
    if (realce) { realce.parent && realce.parent.remove(realce); realce = null; }
    if (!obj) return;
    var a = modelo.localToWorld(new THREE.Vector3(obj[1], 0.45, obj[3])), z = modelo.localToWorld(new THREE.Vector3(obj[2], 0.5, obj[4]));
    var caixa = new THREE.Box3(a.clone().min(z), a.clone().max(z));
    realce = new THREE.Box3Helper(caixa, 0xefc878); realce.material.depthTest = false; realce.renderOrder = 10;
    cena.add(realce); realce.userData.nasceu = relogio;
  }

  /* ---------------- RA ---------------- */
  function entrarRA() {
    if (!ra) return;
    dica('Abrindo a câmera…');
    ra.entrar('ra').then(function () {
      mostrarAndar(false);
      dica('Aponte para a mesa até aparecer o círculo. Depois, toque em "Pousar aqui".');
      cartao('NA MESA', 'Ponha a agência sobre uma mesa de verdade. Dá para andar em volta e chegar perto. Com dois dedos, aumenta ou diminui.');
      atualizarBotoes();
    }).catch(function (e) {
      dica('Sem RA neste aparelho agora. A maquete segue na tela.');
      cartao('RA', (e && e.message) || 'A câmera não abriu.');
      atualizarBotoes();
    });
  }
  function pousar() {
    if (!ra) return;
    var e = ra.estado();
    if (e.modo === 'ra' && !e.temHit) { dica('Aponte para a mesa até aparecer o círculo.'); return; }
    if (ra.posicionar()) { dica('Toque numa sala ou num marcador dourado.'); atualizarBotoes(); }
  }
  function aoMudarRA() { atualizarBotoes(); }
  function atualizarBotoes() {
    if (!el || !ra) return;
    var e = ra.estado();
    el.querySelector('#maqPousar').hidden = !(e.modo === 'ra' && !e.posta);
    el.querySelector('#maqRA').textContent = e.modo === 'ra' ? 'Sair da RA' : 'Pôr na mesa (RA)';
    el.querySelector('#maqRA').onclick = e.modo === 'ra' ? function () { ra.sair().then(function () { enquadrar(); atualizarBotoes(); dica('Arraste para girar. Toque numa sala ou num marcador dourado.'); }); } : entrarRA;
    if (controles) controles.enabled = e.modo !== 'ra';
  }

  /* pinça e giro com dois dedos, só na RA */
  var dedos = {};
  function gestosRA() {
    var c = renderer.domElement, pinca = 0, ang = 0;
    c.addEventListener('touchstart', function (e) { if (e.touches.length === 2) { pinca = dist(e.touches); ang = angulo(e.touches); } }, { passive: true });
    c.addEventListener('touchmove', function (e) {
      if (!ra || ra.estado().modo !== 'ra' || e.touches.length !== 2) return;
      var d = dist(e.touches), a = angulo(e.touches);
      if (pinca > 0) ra.mudarEscala(d / pinca);
      ra.girar(a - ang); pinca = d; ang = a;
    }, { passive: true });
    function dist(t) { var x = t[0].clientX - t[1].clientX, y = t[0].clientY - t[1].clientY; return Math.sqrt(x * x + y * y); }
    function angulo(t) { return Math.atan2(t[1].clientY - t[0].clientY, t[1].clientX - t[0].clientX); }
  }

  function enquadrar() {
    if (!controles) return;
    controles.target.set(0.046, 0.02, -0.016); camera.position.set(-0.05, 0.8, 0.48); controles.update();
  }

  var antes = 0;
  function desenhar(tempo, quadroXR) {
    var t = tempo || performance.now(), dt = Math.min(0.05, (t - (antes || t)) / 1000); antes = t; relogio += dt;
    if (ra) ra.atualizar(dt, quadroXR);
    var est = ra && ra.estado();
    if (est && est.modo === 'ra') cena.background = null;
    else if (!cena.background) cena.background = new global.THREE.Color(0x0b1520);
    pinos.forEach(function (p, i) { var l = p.children[0]; l.position.y = Math.sin(relogio * 2.2 + i) * 0.22; l.rotation.y += dt * 1.2; });
    if (realce && relogio - realce.userData.nasceu > 2.4) { cena.remove(realce); realce = null; }
    if (controles && controles.enabled) controles.update();
    if (emPerto && perto) animarPerto(dt);
    renderer.render(cena, ra ? ra.cameraAtiva() : camera);
  }


  /* ---------------- de perto: o malote murcho (Cap. 1) ----------------
     Peça provisória, feita em código, até chegar o modelo do designer.
     O Arquivo Morto às 8h05: a lona no chão molhado, a ilha seca sob ela, a
     aba que a corrente de ar ergue, o vinco, o lacre com a grapa cortada, o
     fragmento (só quando a história chega nele) e a borda que se levanta. */
  function tela(w, h, pintar) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; pintar(c.getContext('2d'), w, h);
    var t = new global.THREE.CanvasTexture(c); t.encoding = global.THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function ruido(g, w, h, n, cor, a) { for (var i = 0; i < n; i++) { g.fillStyle = cor; g.globalAlpha = Math.random() * a; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } g.globalAlpha = 1; }
  function montarPerto() {
    var THREE = global.THREE, G = new THREE.Group(); G.name = 'perto-malote';
    var marca = function (o, k) { o.traverse(function (m) { m.userData.det = k; }); return o; };
    /* o piso: granilite molhado (brilha sob a lanterna) e a ilha seca */
    var tPiso = tela(512, 512, function (g, w, h) { g.fillStyle = '#3a4146'; g.fillRect(0, 0, w, h); ruido(g, w, h, 9000, '#8a949a', 0.35); g.strokeStyle = '#22282c'; g.lineWidth = 3; for (var i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); } });
    tPiso.wrapS = tPiso.wrapT = THREE.RepeatWrapping; tPiso.repeat.set(2, 2);
    var piso = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshStandardMaterial({ map: tPiso, roughness: 0.12, metalness: 0.15 }));
    piso.rotation.x = -Math.PI / 2; G.add(marca(piso, 'seco'));
    var ilha = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), new THREE.MeshStandardMaterial({ map: tPiso, roughness: 0.97, metalness: 0, color: 0xd9dcd6, polygonOffset: true, polygonOffsetFactor: -1 }));
    ilha.rotation.x = -Math.PI / 2; ilha.scale.set(0.7, 0.62, 1); ilha.position.set(0.01, 0.001, 0.01); G.add(marca(ilha, 'seco'));
    /* a lona */
    var tLona = tela(256, 256, function (g, w, h) { g.fillStyle = '#5b6355'; g.fillRect(0, 0, w, h); for (var y = 0; y < h; y += 3) { g.fillStyle = y % 6 ? '#545c4f' : '#636b5c'; g.fillRect(0, y, w, 1); } ruido(g, w, h, 3000, '#2f352c', 0.4); });
    tLona.wrapS = tLona.wrapT = THREE.RepeatWrapping; tLona.repeat.set(2, 2);
    var mLona = new THREE.MeshStandardMaterial({ map: tLona, roughness: 0.9, side: THREE.DoubleSide });
    /* um saco retangular vazio, achatado no chão: a lona assenta nas bordas e
       guarda dobras no meio */
    var W = 0.6, D = 0.5, gs = new THREE.PlaneGeometry(W, D, 60, 50); gs.rotateX(-Math.PI / 2);
    var pos = gs.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), u = 2 * x / W, v = 2 * z / D;
      var f = Math.max(0, 1 - Math.pow(Math.abs(u), 6)) * Math.max(0, 1 - Math.pow(Math.abs(v), 6));
      var dobra = Math.sin(x * 26 + z * 9) * 0.35 + Math.sin(z * 31 - x * 12) * 0.25 + Math.sin((x + z) * 55) * 0.08;
      /* bordas levemente irregulares */
      var bx = x * (1 + 0.03 * Math.sin(z * 40)), bz = z * (1 + 0.03 * Math.sin(x * 33));
      pos.setXYZ(i, bx, 0.004 + f * (0.026 + 0.012 * dobra), bz);
    }
    gs.computeVertexNormals();
    var saco = new THREE.Mesh(gs, mLona); saco.rotation.y = 0.18; G.add(marca(saco, 'vazio'));
    var fecho = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.006, 0.012), new THREE.MeshStandardMaterial({ color: 0x23272a, roughness: 0.5, metalness: 0.6 }));
    fecho.position.set(-0.005, 0.012, -0.235); fecho.rotation.y = 0.18; G.add(marca(fecho, 'vazio'));
    /* a aba que respira */
    var abaPivo = new THREE.Group(); abaPivo.position.set(0.29, 0.01, 0.0); abaPivo.rotation.y = 0.18;
    var aba = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), mLona); aba.position.x = 0.06; aba.rotation.x = -Math.PI / 2;
    abaPivo.add(marca(aba, 'vazio')); G.add(abaPivo); G.userData.aba = abaPivo;
    /* o vinco, do lado oposto ao lacre: uma boca torta */
    var curva = new THREE.CatmullRomCurve3([new THREE.Vector3(0.07, 0.036, -0.08), new THREE.Vector3(0.12, 0.04, -0.12), new THREE.Vector3(0.17, 0.036, -0.15), new THREE.Vector3(0.23, 0.022, -0.2)]);
    var vinco = new THREE.Mesh(new THREE.TubeGeometry(curva, 24, 0.003, 6), new THREE.MeshStandardMaterial({ color: 0x14170f, roughness: 1, metalness: 0 }));
    G.add(marca(vinco, 'vinco'));
    var vincoAlvo = new THREE.Mesh(new THREE.TubeGeometry(curva, 12, 0.03, 6), new THREE.MeshBasicMaterial({ visible: false })); G.add(marca(vincoAlvo, 'vinco'));
    /* o lacre, com a grapa cortada */
    var lacre = new THREE.Group(); lacre.position.set(-0.24, 0.012, 0.19); lacre.rotation.y = 0.35;
    var tLacre = tela(256, 96, function (g, w, h) { g.fillStyle = '#c7782b'; g.fillRect(0, 0, w, h); ruido(g, w, h, 600, '#7a4512', 0.3); g.fillStyle = '#2a1606'; g.font = 'bold 52px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ML-8842', w / 2, h / 2 + 3); });
    var corpo = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.03), [0, 0, 1, 0, 0, 0].map(function (k) { return new THREE.MeshStandardMaterial(k ? { map: tLacre, roughness: 0.45 } : { color: 0xb5682a, roughness: 0.45 }); }));
    lacre.add(corpo);
    var mAco = new THREE.MeshStandardMaterial({ color: 0xb9c0c6, metalness: 0.9, roughness: 0.25 });
    [[0.012, 0.6], [-0.012, -0.5]].forEach(function (p) { var gr = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.026, 8), mAco); gr.rotation.z = Math.PI / 2; gr.rotation.y = p[1]; gr.position.set(0.052, 0, p[0]); lacre.add(gr); });
    var lacreAlvo = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.07), new THREE.MeshBasicMaterial({ visible: false })); lacre.add(lacreAlvo);
    G.add(marca(lacre, 'lacre'));
    /* o fragmento de papel térmico, na cola do lacre */
    var frag = new THREE.Mesh(new THREE.PlaneGeometry(0.016, 0.011), new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.6, side: THREE.DoubleSide }));
    frag.rotation.x = -Math.PI / 2; frag.position.set(-0.2, 0.02, 0.212); frag.visible = false;
    var fragAlvo = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); fragAlvo.position.copy(frag.position);
    G.add(marca(frag, 'frag')); G.add(marca(fragAlvo, 'frag')); G.userData.frag = [frag, fragAlvo];
    /* a borda dobrada; embaixo, o envio extra */
    var bordaPivo = new THREE.Group(); bordaPivo.position.set(0.04, 0.004, 0.25); bordaPivo.rotation.y = 0.18;
    var borda = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.05), mLona); borda.rotation.x = -Math.PI / 2; borda.position.z = -0.025;
    bordaPivo.add(borda); G.add(marca(bordaPivo, 'borda')); G.userData.borda = bordaPivo;
    var envio = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.003, 0.03), new THREE.MeshStandardMaterial({ color: 0xefc878, emissive: 0x6b4d10, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 }));
    envio.position.set(0.05, 0.003, 0.235); envio.rotation.y = 0.18; G.add(marca(envio, 'borda'));
    var bordaAlvo2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.08), new THREE.MeshBasicMaterial({ visible: false })); bordaAlvo2.position.set(0.04, 0.02, 0.25); G.add(marca(bordaAlvo2, 'borda'));
    /* o canto do Arquivo: parede com infiltração, estante, cesto, porta entreaberta */
    var tParede = tela(512, 256, function (g, w, h) { g.fillStyle = '#c9c6bd'; g.fillRect(0, 0, w, h); ruido(g, w, h, 4000, '#8e8b82', 0.25); var r = g.createRadialGradient(70, h, 10, 70, h, 150); r.addColorStop(0, 'rgba(92,84,60,.75)'); r.addColorStop(1, 'rgba(92,84,60,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    var parede = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.6), new THREE.MeshStandardMaterial({ map: tParede, roughness: 0.95 })); parede.position.set(0, 0.3, -0.62); G.add(parede);
    var mMetal = new THREE.MeshStandardMaterial({ color: 0x6d757b, metalness: 0.5, roughness: 0.5 });
    var estante = new THREE.Group(); estante.position.set(0.42, 0, -0.5);
    [0.02, 0.16, 0.3, 0.44].forEach(function (y) { var pr = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.008, 0.18), mMetal); pr.position.y = y; estante.add(pr); });
    [[-0.2, -0.09], [0.2, -0.09], [-0.2, 0.09], [0.2, 0.09]].forEach(function (q) { var m = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.46, 0.01), mMetal); m.position.set(q[0], 0.23, q[1]); estante.add(m); });
    var mCaixa = new THREE.MeshStandardMaterial({ color: 0x8c7b5d, roughness: 0.9 });
    [[-0.12, 0.05], [0, 0.05], [0.12, 0.05], [-0.12, 0.19], [0.12, 0.19], [-0.06, 0.33], [0.08, 0.33]].forEach(function (q) { var c = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.15), mCaixa); c.position.set(q[0], q[1] + 0.04, 0); estante.add(c); });
    G.add(estante);
    var cesto = new THREE.Group(); cesto.position.set(-0.47, 0, -0.38);
    cesto.add(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.15, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x4f565b, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide })));
    cesto.children[0].position.y = 0.075;
    var tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.069, 0.069, 0.01, 24), new THREE.MeshStandardMaterial({ color: 0x8d969c, metalness: 0.8, roughness: 0.3 }));
    tampa.position.set(0.006, 0.156, 0); tampa.rotation.z = 0.11; cesto.add(tampa); G.add(cesto);
    var batente = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.03), mMetal); batente.position.set(-0.72, 0.3, 0.1); G.add(batente);
    var porta = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.58, 0.32), new THREE.MeshStandardMaterial({ color: 0x59636a, metalness: 0.4, roughness: 0.5 }));
    porta.geometry.translate(0, 0.29, 0.16); porta.position.set(-0.72, 0, 0.12); porta.rotation.y = -0.5; G.add(porta);
    var balde = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 20), new THREE.MeshStandardMaterial({ color: 0x2f6fae, roughness: 0.6 })); balde.position.set(-0.58, 0.05, 0.42); G.add(balde);
    G.visible = false;
    return G;
  }
  function entrarPerto() {
    if (!perto) { perto = montarPerto(); raiz.add(perto); }
    emPerto = true; bordaAlvo = 0;
    modelo.visible = false; perto.visible = true;
    var f = !!(opcoes.malote && opcoes.malote.fragmento && opcoes.malote.fragmento());
    perto.userData.frag.forEach(function (o) { o.visible = f; });
    LUZ.hemi.intensity = 0.1; LUZ.ceu.intensity = 0.06; LUZ.fria.intensity = 0.03; LUZ.amb.intensity = 0.04; LUZ.lanterna.intensity = 4.2;
    if (realce) { cena.remove(realce); realce = null; }
    el.querySelector('#maqAndar').hidden = true;
    el.querySelector('.maq-tit b').textContent = 'O malote murcho · Arquivo Morto';
    dica('A lanterna segue o seu olhar. Gire em volta e toque nos detalhes.');
    cartao('O MALOTE', 'Toque num detalhe do saco para examiná-lo. Com a luz certa, o lacre se deixa ler.');
    if (controles && controles.enabled) {
      /* enquadra ~0,9 de largura, qualquer que seja a proporção da tela */
      var hf = 2 * Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect), dist = Math.min(2.3, 0.46 / Math.tan(hf / 2));
      var dir = new global.THREE.Vector3(0.06, 0.78, 0.62).normalize();
      controles.minDistance = 0.12; controles.target.set(0, 0.02, 0); camera.position.copy(dir.multiplyScalar(dist)); controles.update();
    }
  }
  function sairPerto(silencioso) {
    emPerto = false;
    if (perto) perto.visible = false;
    modelo.visible = true;
    LUZ.hemi.intensity = 0.95; LUZ.ceu.intensity = 0.9; LUZ.fria.intensity = 0.35; LUZ.amb.intensity = 0.18; LUZ.lanterna.intensity = 0;
    if (silencioso) return;
    el.querySelector('#maqAndar').hidden = false;
    el.querySelector('.maq-tit b').textContent = 'A maquete · Agência 0688';
    dica('Arraste para girar. Toque numa sala ou num marcador dourado.');
    cartao('A MAQUETE', 'Toque numa sala para ver o que há nela. Os marcadores dourados são as peças do caso.');
    if (controles) { controles.minDistance = 0.18; enquadrar(); }
  }
  function tocarPerto(ray) {
    var alvos = []; perto.traverse(function (o) { if (o.isMesh && o.userData.det && visivel(o)) alvos.push(o); });
    var h = ray.intersectObjects(alvos, false);
    if (!h.length) return;
    var ordem = ['frag', 'lacre', 'borda', 'vinco', 'vazio', 'seco'], k = h[0].object.userData.det;
    /* entre alvos sobrepostos perto do dedo, o detalhe pequeno ganha */
    h.forEach(function (x) { if (x.distance - h[0].distance < 0.04 && ordem.indexOf(x.object.userData.det) < ordem.indexOf(k)) k = x.object.userData.det; });
    if (k === 'borda') bordaAlvo = 1;
    var d = opcoes.malote && opcoes.malote.detalhe ? opcoes.malote.detalhe(k) : null;
    if (d) cartao(d[0], d[1]);
  }
  function animarPerto(dt) {
    var THREE = global.THREE;
    var aba = perto.userData.aba; aba.rotation.z = 0.15 + Math.pow(Math.sin(relogio * 1.1), 2) * 0.45;
    var b = perto.userData.borda; b.rotation.x += ((bordaAlvo ? -1.1 : 0) - b.rotation.x) * Math.min(1, dt * 4);
    var cam = ra ? ra.cameraAtiva() : camera, p = new THREE.Vector3(), d = new THREE.Vector3();
    cam.getWorldPosition(p); cam.getWorldDirection(d);
    LUZ.lanterna.position.copy(p).addScaledVector(d, -0.02);
    LUZ.lanterna.target.position.copy(p).addScaledVector(d, 1);
    LUZ.lanterna.target.updateMatrixWorld();
    var f = !!(opcoes.malote && opcoes.malote.fragmento && opcoes.malote.fragmento());
    if (perto.userData.frag[0].visible !== f) perto.userData.frag.forEach(function (o) { o.visible = f; });
  }

  /* ---------------- abrir e fechar ---------------- */
  function abrir(o) {
    opcoes = o || {};
    if (!el) criarTela();
    el.hidden = false; ativo = true;
    el.querySelector('#maqCarregando').hidden = false;
    cartao('A MAQUETE', opcoes.boasVindas || 'Toque numa sala para ver o que há nela. Os marcadores dourados são as peças do caso.');
    return carregarTudo().then(function () {
      el.querySelector('#maqCarregando').hidden = true;
      if (!gestosRA.feito) { gestosRA(); gestosRA.feito = true; }
      aplicarItens();
      redimensionar();
      renderer.setAnimationLoop(desenhar);
    }).catch(function (e) {
      el.querySelector('#maqCarregando').textContent = 'A maquete não abriu: ' + ((e && e.message) || e);
      throw e;
    });
  }
  function fechar() {
    ativo = false;
    if (emPerto) sairPerto(true);
    var sai = ra && ra.estado().modo === 'ra' ? ra.sair() : Promise.resolve();
    return sai.then(function () {
      if (renderer) renderer.setAnimationLoop(null);
      if (el) el.hidden = true;
      if (opcoes.aoFechar) opcoes.aoFechar();
    });
  }

  global.CFIMaquete = { abrir: abrir, fechar: fechar, aberta: function () { return ativo; }, ITENS: ITENS,
    _teste: function () { return { pinos: pinos.map(function (p) { var v = p.getWorldPosition(new global.THREE.Vector3()).project(ra ? ra.cameraAtiva() : camera); return { id: p.userData.item, x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; }), itens: opcoes.itens }; },
    _perto: function () { entrarPerto(); }, _dbg: function () { var b = new global.THREE.Box3().setFromObject(perto); return { cam: camera.position.toArray(), alvo: controles.target.toArray(), raizEsc: raiz.scale.x, raizPos: raiz.position.toArray(), bmin: b.min.toArray(), bmax: b.max.toArray() }; }, _projetarPerto: function (x, y, z) { var v = perto.localToWorld(new global.THREE.Vector3(x, y, z)).project(camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; },
    _projetar: function (x, y, z) { var v = modelo.localToWorld(new global.THREE.Vector3(x, y, z)).project(camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; } };
})(window);
