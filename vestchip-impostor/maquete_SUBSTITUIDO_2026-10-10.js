/* A maquete da Torre de Continuidade (revisão 9: torre vertical do −1 ao +14).
   Ainda sem o modelo do designer (o prompt da maquete foi entregue em
   10/10): esta maquete é feita em código, na mesma escala do prompt (1:90 na
   mesa, coluna de 15 × 15 m, pé-direito de 3,2 m). Cada andar é uma gaveta:
   toque e ele desliza para fora, com as salas por cima. As peças do caso
   aparecem como losangos dourados no andar em que a história as põe; a rota
   pelo poço acende quando o Capítulo 4 a revela.
   RA: o motor comum, copiado para lib/ (ac-ra.js e ac-maquete-ra.js):
   WebXR no Android, 8th Wall no iPhone. Sem RA, a maquete fica na tela.
   Uso (mesa.html): VCMaquete.abrir({andares, eu, itens, rota, digitar, aoAbrirItem}). */
(function (global) {
  'use strict';
  var BASE = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^/]*$/, '') : ''; })();
  var LIB = BASE + 'lib/';
  var SCRIPTS = [LIB + 'three.min.js', LIB + 'OrbitControls.js', LIB + 'ac-ra.js', LIB + 'ac-maquete-ra.js'];
  var M = 1 / 60;            /* 60 m da torre = 1 de pegada (≈ 42 cm na mesa) */
  var PD = 3.2, LADO = 15;   /* pé-direito e lado da coluna, em metros */
  var ORDEM = ['-1', '0', '+1', '+2', '+3', '+4', '+5', '+6', '+7', '+8', '+9', '+10', '+11', '+12', '+13', '+14'];
  var LUGAR_ITEM = { c1: '+4', c2: '+1', c3: '+1', c4: '+2', c5: '-1', c6: '+2', c7: '+2', c8: '+2' };
  var LACRADO = { '+6': 1, '+7': 1, '+9': 1 };

  var pronto = null, el = null, renderer, cena, camera, controles, raiz, torre, ra = null, opcoes = {}, ativo = false;
  var gavetas = {}, aberta = null, pinos = [], rotaG = null, euG = null, relogio = 0, tocando = null;

  function carregarScript(src) { return new Promise(function (ok, falha) { if (document.querySelector('script[data-maq="' + src + '"]')) return ok(); var s = document.createElement('script'); s.src = src; s.async = false; s.setAttribute('data-maq', src); s.onload = function () { ok(); }; s.onerror = function () { falha(Error('Não carregou ' + src)); }; document.head.appendChild(s); }); }
  function carregarTudo() {
    if (pronto) return pronto; var cadeia = Promise.resolve();
    SCRIPTS.forEach(function (s) { cadeia = cadeia.then(function () { if (/three\.min/.test(s) && global.THREE) return; return carregarScript(s); }); });
    pronto = cadeia.then(montar); pronto.catch(function () { pronto = null; }); return pronto;
  }

  /* ── tela ── */
  function criarTela() {
    el = document.createElement('div'); el.id = 'telaMaquete'; el.className = 'tela-maq'; el.hidden = true;
    el.innerHTML = '<div class="maq-palco" id="maqPalco"></div>' +
      '<div class="maq-topo"><button type="button" class="sair-ra" id="maqSair">‹ Voltar</button><div class="maq-tit"><b>A maquete · Torre de Continuidade</b><span id="maqDica">Arraste para girar. Toque num andar: ele sai como uma gaveta.</span></div></div>' +
      '<div class="maq-ferr"><button type="button" id="maqFechar">Guardar as gavetas</button><button type="button" id="maqRA" hidden>Pôr na mesa (RA)</button><button type="button" id="maqPousar" hidden>Pousar aqui</button></div>' +
      '<div class="planta-card maq-card"><small id="maqRot">A MAQUETE</small><p id="maqTxt">Toque num andar para ver o que há nele.</p><div id="maqAcao"></div></div>' +
      '<div class="maq-carregando" id="maqCarregando">Montando a maquete…</div>';
    document.body.appendChild(el);
    var css = document.createElement('style');
    css.textContent = '.tela-maq{position:fixed;inset:0;z-index:86;background:#071219;display:flex;flex-direction:column;touch-action:none}.tela-maq[hidden]{display:none}' +
      '.maq-palco{position:absolute;inset:0}.maq-palco canvas{display:block;width:100%;height:100%;touch-action:none}' +
      '.maq-topo{position:relative;z-index:3;display:flex;gap:10px;align-items:flex-start;padding:calc(env(safe-area-inset-top) + 10px) 10px 8px;background:linear-gradient(#071219f0,#07121900);pointer-events:none}.maq-topo>*{pointer-events:auto}' +
      '.maq-topo .sair-ra{position:static;flex:0 0 auto;min-height:40px;padding:0 14px;border-radius:10px;border:1px solid #46667a;border-bottom-width:3px;background:#0c1b26e6;color:#efc878;font:700 13px var(--sans,system-ui);cursor:pointer;box-shadow:inset 0 2px 0 #ffffff12,0 3px 0 #020609}' +
      '.maq-tit{display:flex;flex-direction:column;font:500 12.5px/1.45 var(--termfont,monospace);color:var(--term,#86e1ea)}.maq-tit b{color:#efc878;font:600 18px/1.2 var(--display,Georgia,serif)}' +
      '.maq-ferr{position:relative;z-index:3;display:flex;flex-wrap:wrap;gap:8px;padding:0 10px;margin-top:auto;justify-content:center}' +
      '.maq-ferr button{min-height:44px;padding:0 14px;border-radius:22px;border:1px solid #46667a;border-bottom-width:3px;background:#0c1b26e6;color:#efc878;font:700 12.5px var(--sans,system-ui);cursor:pointer;box-shadow:inset 0 2px 0 #ffffff12,0 3px 0 #020609}' +
      '.maq-ferr #maqRA,.maq-ferr #maqPousar{background:linear-gradient(180deg,#f3d078,#e0b13a);color:#1a1206;border-color:#d6aa58}' +
      '.maq-card{position:relative;z-index:3;margin:8px 10px calc(env(safe-area-inset-bottom) + 10px)!important;max-height:34vh;overflow:auto}' +
      '.maq-card .acao{margin-top:9px;width:100%;min-height:42px;border-radius:9px;border:1px solid #d6aa58;background:linear-gradient(180deg,#f3d078,#e0b13a);color:#1a1206;font:700 12.5px var(--termfont,monospace);cursor:pointer}' +
      '.maq-carregando{position:absolute;z-index:4;left:50%;top:45%;transform:translate(-50%,-50%);padding:12px 18px;border-radius:10px;background:#071318e6;border:1px solid #2b6470;color:#a6eef5;font:500 13px var(--termfont,monospace)}.maq-carregando[hidden]{display:none}' +
      'body.in-ar{background:transparent!important}body.in-ar>*:not(#telaMaquete){visibility:hidden!important}body.in-ar .tela-maq{background:transparent}body.ra-webxr .maq-palco canvas{visibility:hidden}';
    document.head.appendChild(css);
    el.querySelector('#maqSair').onclick = function () { fechar(); };
    el.querySelector('#maqFechar').onclick = function () { abrirGaveta(null); cartao('A MAQUETE', 'Toque num andar para ver o que há nele.'); };
    el.querySelector('#maqRA').onclick = entrarRA; el.querySelector('#maqPousar').onclick = pousar;
  }
  function cartao(rot, txt, acao) {
    el.querySelector('#maqRot').textContent = rot; var p = el.querySelector('#maqTxt');
    if (opcoes.digitar) { p.innerHTML = ''; opcoes.digitar(p, txt); } else p.innerHTML = txt;
    var a = el.querySelector('#maqAcao'); a.innerHTML = '';
    if (acao) { var b = document.createElement('button'); b.className = 'acao'; b.type = 'button'; b.textContent = acao[0]; b.onclick = acao[1]; a.appendChild(b); }
  }
  function dica(t) { el.querySelector('#maqDica').textContent = t; }

  /* ── materiais e rótulos ── */
  var MAT = {};
  function mat(cor, op, em) { var k = cor + '|' + op + '|' + em; if (!MAT[k]) MAT[k] = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.65, metalness: 0.15, transparent: op < 1, opacity: op, emissive: em || 0x000000, depthWrite: op >= 1 }); return MAT[k]; }
  function rotulo(txt, cor, larg) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 96; var g = c.getContext('2d');
    g.fillStyle = 'rgba(5,12,16,0.82)'; g.fillRect(0, 0, 512, 96); g.strokeStyle = cor || '#3fb6c4'; g.lineWidth = 4; g.strokeRect(2, 2, 508, 92);
    g.fillStyle = cor || '#a6eef5'; g.font = '600 40px monospace'; g.textBaseline = 'middle'; g.fillText(txt, 18, 50);
    var t = new THREE.CanvasTexture(c); t.anisotropy = 4;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set((larg || 14) * M, (larg || 14) * M * 96 / 512, 1); s.renderOrder = 20; return s;
  }
  function caixa(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w * M, h * M, d * M), m); }
  function yDe(a) { return ORDEM.indexOf(a) * PD * M; }

  /* ── a torre ── */
  function montar() {
    var THREE = global.THREE, palco = el.querySelector('#maqPalco');
    cena = new THREE.Scene(); cena.background = new THREE.Color(0x071219);
    camera = new THREE.PerspectiveCamera(40, 1, 0.005, 40); cena.add(camera);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 1.75)); renderer.outputEncoding = THREE.sRGBEncoding; renderer.xr.enabled = true;
    palco.appendChild(renderer.domElement);
    /* noite de tempestade: luz fria do céu, o âmbar da obra e o ciano do Echo */
    cena.add(new THREE.HemisphereLight(0xa9c3d6, 0x10161a, 0.85));
    var lua = new THREE.DirectionalLight(0xd8e8f2, 0.8); lua.position.set(-0.8, 1.6, 1.0); cena.add(lua);
    var ciano = new THREE.PointLight(0x3fb6c4, 0.6, 3); ciano.position.set(0.3, 0.6, 0.3); cena.add(ciano);
    raiz = new THREE.Group(); raiz.name = 'raiz-torre'; cena.add(raiz);
    torre = new THREE.Group(); raiz.add(torre);
    var nomes = {}; (opcoes.andares || []).forEach(function (a) { nomes[a.a] = a; });
    ORDEM.forEach(function (a) {
      var A = nomes[a] || { nome: a, salas: [] }, g = new THREE.Group(); g.position.y = yDe(a); g.userData.andar = a;
      var laje = caixa(LADO, 0.35, LADO, mat(LACRADO[a] ? 0x2a3138 : 0x22323c, 1)); laje.position.y = 0.17 * M; laje.userData.andar = a; g.add(laje);
      var vidro = caixa(LADO, PD - 0.4, LADO, mat(a === '-1' ? 0x3a3020 : 0x3fb6c4, 0.13)); vidro.position.y = (PD / 2 + 0.1) * M; vidro.userData.andar = a; g.add(vidro);
      /* as salas, em faixas */
      var n = Math.max(1, A.salas.length), w = (LADO - 1) / n;
      A.salas.forEach(function (s, i) {
        var cor = LACRADO[a] ? 0x4a5560 : [0x2f6b78, 0x6b5a3a, 0x3a5a7a, 0x5a3a52, 0x3a6a4a][i % 5];
        var b = caixa(w - 0.6, PD - 1.0, LADO - 3, mat(cor, 0.85, LACRADO[a] ? 0 : 0x061418)); b.position.set((-LADO / 2 + 0.5 + w * (i + 0.5)) * M, (PD / 2) * M, 0); b.userData.sala = s; b.userData.andar = a; g.add(b);
      });
      var r = rotulo(a + '  ' + A.nome, LACRADO[a] ? '#8fa9b8' : '#a6eef5', 7.5); r.position.set((-LADO / 2 - 7) * M, (PD / 2) * M, (LADO / 2) * M); r.userData.andar = a; g.add(r);
      if (a === '+9') { var luz = new THREE.PointLight(0xffc35a, 0.4, 0.15); luz.position.y = PD / 2 * M; g.add(luz); var lamp = caixa(0.8, 0.8, 0.8, mat(0xffc35a, 1, 0x7a5010)); lamp.position.set(2 * M, PD / 2 * M, 2 * M); g.add(lamp); }
      gavetas[a] = g; torre.add(g);
    });
    /* circulação: corta-fogo (do térreo à cobertura), elevador (parado entre +9 e +10), poço de cabos (todo o prédio) */
    var cf = caixa(2.4, (14 * PD + 2), 2.4, mat(0x86e1ea, 0.35)); cf.position.set((LADO / 2 + 1.4) * M, (yDe('0') + (14 * PD + 2) / 2 * M), (-LADO / 2 + 1.6) * M); cf.userData.circ = 'escada-corta-fogo'; torre.add(cf);
    var el2 = caixa(2.2, 16 * PD, 2.2, mat(0x46667a, 0.3)); el2.position.set((-LADO / 2 - 1.3) * M, 8 * PD * M, (-LADO / 2 + 1.5) * M); el2.userData.circ = 'elevador'; torre.add(el2);
    var cab = caixa(2, 2.4, 2, mat(0xefc878, 0.9, 0x5a4310)); cab.position.set((-LADO / 2 - 1.3) * M, (yDe('+9') + 2.4 * PD * M * 0.5 / PD * PD), (-LADO / 2 + 1.5) * M); cab.position.y = yDe('+10') - 0.2 * PD * M; cab.userData.circ = 'elevador'; torre.add(cab);
    var poco = caixa(1.6, 16 * PD, 1.6, mat(0xd49a6a, 0.55)); poco.position.set((LADO / 2 - 2.2) * M, 8 * PD * M, (LADO / 2 - 2.2) * M); poco.userData.circ = 'poco-de-cabos'; torre.add(poco);
    /* rua, Jardim, passarela e Casa de Antenas */
    var rua = new THREE.Mesh(new THREE.PlaneGeometry(70 * M, 70 * M), mat(0x0d1a20, 0.55)); rua.rotation.x = -Math.PI / 2; rua.position.y = yDe('0') - 0.02 * M; rua.raycast = function () {}; raiz.add(rua);
    var jardim = caixa(14, 0.4, 12, mat(0x2e5a3c, 1)); jardim.position.set((LADO / 2 + 10) * M, yDe('0') + 0.2 * M, 2 * M); jardim.userData.anexo = 'jardim-tecnico'; raiz.add(jardim);
    var pas = caixa(10, 0.3, 2, mat(0x46667a, 1)); pas.position.set((LADO / 2 + 22) * M, yDe('0') + 1.6 * M, 2 * M); pas.userData.anexo = 'passarela'; raiz.add(pas);
    var ant = caixa(6, 5, 6, mat(0x3a4a56, 1)); ant.position.set((LADO / 2 + 30) * M, yDe('0') + 2.5 * M, 2 * M); ant.userData.anexo = 'casa-de-antenas'; raiz.add(ant);
    var mastro = caixa(0.5, 8, 0.5, mat(0xff5040, 1, 0x501008)); mastro.position.set(0, yDe('+14') + (PD + 4) * M, 0); torre.add(mastro);
    var rj = rotulo('Jardim · passarela · Casa de Antenas', '#bff5d6', 12); rj.position.set((LADO / 2 + 20) * M, yDe('0') + 8 * M, 8 * M); raiz.add(rj);
    torre.position.set(0, -yDe('-1'), 0);
    var caixaB = new THREE.Box3().setFromObject(raiz), baseY = caixaB.min.y;
    controles = new THREE.OrbitControls(camera, renderer.domElement); controles.enableDamping = true; controles.dampingFactor = 0.08; controles.minDistance = 0.2; controles.maxDistance = 4.5; controles.maxPolarAngle = Math.PI * 0.55;
    enquadrar();
    if (global.ACMaquetteRA) { try { ra = global.ACMaquetteRA.criar({ renderer: renderer, cena: cena, camera: camera, raiz: raiz, baseY: baseY, aoMudar: atualizarBotoes, desenhar: desenhar, aoTocar: function (x, y) { tocar(x, y); } }); ra.modosPossiveis(function (m) { el.querySelector('#maqRA').hidden = !m.ra; }); } catch (e) { ra = null; } }
    ligarToques(); gestosRA(); redimensionar(); global.addEventListener('resize', redimensionar);
  }
  function enquadrar() { controles.target.set(0.02, 0.42, 0); camera.position.set(0.6, 0.85, 2.2); controles.update(); }
  function redimensionar() { if (!renderer || !el || el.hidden) return; var w = global.innerWidth, h = global.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }

  /* ── itens, você, rota ── */
  function aplicar() {
    var THREE = global.THREE;
    pinos.forEach(function (p) { torre.remove(p); }); pinos = [];
    (opcoes.itens || []).forEach(function (it, i) {
      var a = LUGAR_ITEM[it.id]; if (!a) return; var g = new THREE.Group(); g.userData.item = it.id;
      var los = new THREE.Mesh(new THREE.OctahedronGeometry(1.1 * M, 0), new THREE.MeshBasicMaterial({ color: 0xffb21f, toneMapped: false })); los.scale.set(1, 1.5, 1); los.userData.item = it.id;
      var alvo = new THREE.Mesh(new THREE.SphereGeometry(2.6 * M, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); alvo.userData.item = it.id;
      g.add(los, alvo); g.position.set((LADO / 2 + 5 + (i % 2) * 3) * M, yDe(a) + (PD / 2) * M, (-LADO / 2 + 3 + i * 1.6) * M); pinos.push(g); torre.add(g);
    });
    if (euG) torre.remove(euG);
    if (opcoes.eu && ORDEM.indexOf(opcoes.eu.andar) >= 0) {
      euG = new THREE.Mesh(new THREE.TorusGeometry(10 * M, 0.35 * M, 8, 40), new THREE.MeshBasicMaterial({ color: 0xefc878, toneMapped: false })); euG.rotation.x = Math.PI / 2; euG.position.y = yDe(opcoes.eu.andar) + 0.5 * M; euG.raycast = function () {}; torre.add(euG);
    }
    if (rotaG) { torre.remove(rotaG); rotaG = null; }
    if (opcoes.rota) {
      var x = (LADO / 2 - 2.2) * M, z = (LADO / 2 - 2.2) * M, pts = [[-3, '+2'], [0, '+2'], [0, '+1'], [-3, '+1'], [0, '+1'], [0, '-1'], [-4, '-1']].map(function (q) { return new THREE.Vector3(x + q[0] * M, yDe(q[1]) + 1.4 * M, z); });
      rotaG = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xefc878, depthTest: false })); rotaG.renderOrder = 30; torre.add(rotaG);
    }
  }
  function abrirGaveta(a) {
    aberta = a;
    Object.keys(gavetas).forEach(function (k) { gavetas[k].userData.alvoX = k === a ? 13 * M : 0; });
  }

  /* ── toque ── */
  function ligarToques() {
    var c = renderer.domElement;
    c.addEventListener('pointerdown', function (e) { tocando = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    c.addEventListener('pointerup', function (e) { if (!tocando) return; var dx = e.clientX - tocando.x, dy = e.clientY - tocando.y, dt = performance.now() - tocando.t; tocando = null; if (dx * dx + dy * dy > 81 || dt > 600) return; var est = ra && ra.estado(); if (est && est.modo === 'ra' && !est.posta) { pousar(); return; } tocar(e.clientX, e.clientY); });
  }
  function tocar(x, y) {
    var THREE = global.THREE, cam = ra ? ra.cameraAtiva() : camera, r = renderer.domElement.getBoundingClientRect();
    var ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), cam);
    var alvos = []; raiz.traverse(function (o) { if (o.isMesh || o.isSprite) alvos.push(o); });
    var hits = ray.intersectObjects(alvos, false); if (!hits.length) return;
    var o = hits[0].object, u = o.userData;
    if (u.item) { var it = (opcoes.itens || []).filter(function (x) { return x.id === u.item; })[0]; cartao((it ? it.nome : 'PEÇA').toUpperCase(), 'A peça do Capítulo ' + u.item.slice(1) + ' está aqui, no ' + LUGAR_ITEM[u.item] + '.', ['Examinar de perto ›', function () { if (opcoes.aoAbrirItem) opcoes.aoAbrirItem(u.item); }]); return; }
    if (u.sala && aberta === u.andar) { cartao(u.sala.n.toUpperCase(), u.sala.d); return; }
    if (u.circ) { var C = (opcoes.circ || []).filter(function (x) { return x.id === u.circ; })[0]; cartao(C ? C.n.toUpperCase() : u.circ, C ? C.d : ''); return; }
    if (u.anexo) { cartao(u.anexo === 'jardim-tecnico' ? 'JARDIM TÉCNICO' : u.anexo === 'passarela' ? 'PASSARELA' : 'CASA DE ANTENAS', u.anexo === 'jardim-tecnico' ? 'Pátio interno, aberto para o céu, com plantas filtrantes e condensadores; o console de inspeção fica sob a marquise.' : u.anexo === 'passarela' ? 'Liga o Jardim à Casa de Antenas, a céu aberto; impraticável sob descargas.' : 'Prédio baixo do outro lado da passarela.'); return; }
    if (u.andar) {
      var A = (opcoes.andares || []).filter(function (x) { return x.a === u.andar; })[0];
      abrirGaveta(aberta === u.andar ? null : u.andar);
      var txt = A ? A.salas.map(function (s) { return '<b>' + s.n + '.</b> ' + s.d; }).join('<br>') : '';
      if (opcoes.eu && opcoes.eu.andar === u.andar) txt += '<br><b style="color:#efc878">O seu posto fica neste andar.</b>';
      cartao((u.andar + ' · ' + (A ? A.nome : '')).toUpperCase(), (aberta ? 'A gaveta saiu: toque numa sala. ' : '') + txt);
    }
  }

  /* ── RA ── */
  function entrarRA() { if (!ra) return; dica('Abrindo a câmera…'); ra.entrar('ra').then(function () { abrirGaveta(null); dica('Aponte para a mesa até aparecer o círculo. Depois, toque em “Pousar aqui”.'); cartao('NA MESA', 'Ponha a torre sobre uma mesa de verdade: dá para andar em volta e olhar cada andar de perto. Com dois dedos, aumenta, diminui e gira.'); atualizarBotoes(); }).catch(function (e) { dica('Sem RA neste aparelho agora. A maquete segue na tela.'); cartao('RA', (e && e.message) || 'A câmera não abriu.'); atualizarBotoes(); }); }
  function pousar() { if (!ra) return; var e = ra.estado(); if (e.modo === 'ra' && !e.temHit) { dica('Aponte para a mesa até aparecer o círculo.'); return; } if (ra.posicionar()) { dica('Toque num andar ou num losango dourado.'); atualizarBotoes(); } }
  function atualizarBotoes() {
    if (!el || !ra) return; var e = ra.estado();
    el.querySelector('#maqPousar').hidden = !(e.modo === 'ra' && !e.posta);
    el.querySelector('#maqRA').textContent = e.modo === 'ra' ? 'Sair da RA' : 'Pôr na mesa (RA)';
    el.querySelector('#maqRA').onclick = e.modo === 'ra' ? function () { ra.sair().then(function () { enquadrar(); atualizarBotoes(); dica('Arraste para girar. Toque num andar: ele sai como uma gaveta.'); }); } : entrarRA;
    if (controles) controles.enabled = e.modo !== 'ra';
  }
  function gestosRA() {
    var c = renderer.domElement, pinca = 0, ang = 0;
    function dist(t) { var x = t[0].clientX - t[1].clientX, y = t[0].clientY - t[1].clientY; return Math.sqrt(x * x + y * y); }
    function angulo(t) { return Math.atan2(t[1].clientY - t[0].clientY, t[1].clientX - t[0].clientX); }
    c.addEventListener('touchstart', function (e) { if (e.touches.length === 2) { pinca = dist(e.touches); ang = angulo(e.touches); } }, { passive: true });
    c.addEventListener('touchmove', function (e) { if (!ra || ra.estado().modo !== 'ra' || e.touches.length !== 2) return; var d = dist(e.touches), a = angulo(e.touches); if (pinca > 0) ra.mudarEscala(d / pinca); ra.girar(a - ang); pinca = d; ang = a; }, { passive: true });
  }

  var antes = 0;
  function desenhar(tempo, quadroXR) {
    var t = tempo || performance.now(), dt = Math.min(0.05, (t - (antes || t)) / 1000); antes = t; relogio += dt;
    if (ra) ra.atualizar(dt, quadroXR);
    var est = ra && ra.estado(); if (est && est.modo === 'ra') cena.background = null; else if (!cena.background) cena.background = new global.THREE.Color(0x071219);
    Object.keys(gavetas).forEach(function (k) { var g = gavetas[k], alvo = g.userData.alvoX || 0; g.position.x += (alvo - g.position.x) * Math.min(1, dt * 8); });
    pinos.forEach(function (p, i) { var l = p.children[0]; l.position.y = Math.sin(relogio * 2.2 + i) * 0.6 * M; l.rotation.y += dt * 1.2; });
    if (euG) euG.scale.setScalar(1 + Math.sin(relogio * 3) * 0.05);
    if (controles && controles.enabled) controles.update();
    renderer.render(cena, ra ? ra.cameraAtiva() : camera);
  }
  function abrir(o) {
    opcoes = o || {}; if (!el) criarTela(); el.hidden = false; ativo = true; el.querySelector('#maqCarregando').hidden = false;
    cartao('A MAQUETE', 'A torre do subsolo à cobertura. Toque num andar: ele sai como uma gaveta. Os losangos dourados são as peças do caso; o anel dourado marca o seu andar.');
    return carregarTudo().then(function () { el.querySelector('#maqCarregando').hidden = true; aplicar(); redimensionar(); if (!ra || ra.estado().modo !== 'ra') enquadrar(); renderer.setAnimationLoop(desenhar); })
      .catch(function (e) { el.querySelector('#maqCarregando').textContent = 'A maquete não abriu: ' + ((e && e.message) || e); throw e; });
  }
  function fechar() {
    ativo = false; var sai = ra && ra.estado().modo === 'ra' ? ra.sair() : Promise.resolve();
    return sai.then(function () { if (renderer) renderer.setAnimationLoop(null); if (el) el.hidden = true; });
  }
  global.VCMaquete = { abrir: abrir, fechar: fechar, aberta: function () { return ativo; },
    _teste: function () { return { cam: camera.position.toArray(), alvo: controles.target.toArray(), ativa: (ra ? ra.cameraAtiva() === camera : 'semra'), fov: (ra ? ra.cameraAtiva().fov : camera.fov), raizEsc: raiz.scale.x, raizPos: raiz.position.toArray(), andares: Object.keys(gavetas).length, pinos: pinos.length, rota: !!rotaG, aberta: aberta }; }, _tocarAndar: function (a) { abrirGaveta(a); } };
})(window);
