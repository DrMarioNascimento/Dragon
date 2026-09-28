/* O Impostor — a bandeja das sete xícaras (Capítulo 1), com a mão.

   Mario, 28/09/2026: sete xícaras iguais por fora. Cada uma se VIRA (arrastar
   para cima) e o fundo se RASPA com o dedo, como raspadinha. Debaixo de cada
   raspadinha há um sinal (número, conta ou letra, conforme a partida). Seis
   formam uma sequência; a sétima não se encaixa em lugar nenhum. As xícaras se
   ARRASTAM para os lados na bandeja: quando as seis ficam em ordem e a sétima
   sobra numa ponta, a poeira do fundo sai e aparece a pista — a xícara que
   sobra é de OUTRO jogo (sem o carimbo Dragon Games das outras seis, uma florzinha de jasmim, fundo
   limpo; as da casa têm pó de cinco meses). Debaixo de uma das seis, junto do
   sinal, há um envio extra (muda por partida e por jogador).

   Nada marca o que se mexe: descobrir que a xícara vira e que o fundo raspa é
   parte da investigação. As xícaras são provisórias (modeladas aqui); a arte
   final entra no lugar com os mesmos nomes.

   Fala com a mesa por postMessage: {oi:'bandeja', evento:'envio'} e
   {oi:'bandeja', evento:'pista', nome, img}. */
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  var PARTIDA = Q.get('partida') || 'P-DEMO', JOGADOR = Q.get('jogador') || '0';
  var N = 7, PASSO = 0.1, ALTURA = 0.065, RAIO_FUNDO = 0.026, RAIO_TOQUE = 0.04, S = 256;

  /* ---------------- o enigma desta partida ---------------- */
  var r = OISorteio.gerador(PARTIDA, JOGADOR, 'bandeja');
  var modos = ['pares', 'triplos', 'contas', 'letras'];
  var modo = Q.get('modo') || r.escolher(modos);
  var seq, intruso, tipo = 'numero';
  function conta(v) {                       /* uma conta pequena cujo resultado é v */
    var op = r.escolher(['+', '-', 'x']);
    if (op === 'x') { var ds = []; for (var d = 2; d <= 6; d++) if (v % d === 0 && v / d <= 6 && v / d >= 2) ds.push(d); if (ds.length) { var a = r.escolher(ds); return a + '×' + (v / a); } op = '+'; }
    if (op === '+') { var p = r.inteiro(1, Math.max(1, v - 1)); return p + '+' + (v - p); }
    var q = r.inteiro(1, 6); return (v + q) + '−' + q;
  }
  if (modo === 'letras') {
    tipo = 'letra';
    var palavra = r.escolher(['LACRES', 'CHUVAS', 'CORDAS']);
    seq = palavra.split('');
    intruso = r.escolher('BFGJKQXZ'.split('').filter(function (l) { return palavra.indexOf(l) < 0; }));
  } else if (modo === 'triplos') {
    seq = [3, 6, 9, 12, 15, 18]; intruso = r.escolher([4, 5, 7, 8, 10, 11, 13, 14, 16, 17]);
  } else {
    seq = [2, 4, 6, 8, 10, 12]; intruso = r.escolher([3, 5, 7, 9, 11]);
  }
  var itens = seq.map(function (v, i) { return { valor: v, ordem: i, intruso: false }; });
  itens.push({ valor: intruso, ordem: -1, intruso: true });
  itens.forEach(function (it) { it.texto = modo === 'contas' ? conta(it.valor) : String(it.valor); });
  var envioEm = r.inteiro(0, 5);            /* índice (na sequência) da xícara com o envio */
  itens[envioEm].envio = true;
  var ordemInicial = r.embaralhar(itens.map(function (_, i) { return i; }));

  /* ---------------- cena ---------------- */
  var b = OIBase.criar({
    vista: { alvo: [0, 0.05, 0.02], dist: 0.85, distRetrato: 1.75, dir: [0, 1.5, 0.55] },
    raioDoChao: 0.7, alturaDoAparelho: 0.45, miraEscala: 1.2, exposicao: 0.95,
    textoMira: 'Aponte para uma mesa e toque em Pôr aqui.',
    textoInicio: 'A bandeja de xícaras.',
    deNovo: null
  });

  function madeira() {
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
    g.fillStyle = '#5a3a22'; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(' + (30 + Math.random() * 40 | 0) + ',18,8,' + (0.15 + Math.random() * 0.25) + ')'; g.lineWidth = 1 + Math.random() * 2; var y = Math.random() * 256; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + 6, 170, y - 6, 256, y + 2); g.stroke(); }
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.encoding = THREE.sRGBEncoding; return t;
  }
  var bandeja = new THREE.Group(); b.raiz.add(bandeja);
  var matMadeira = new THREE.MeshStandardMaterial({ map: madeira(), roughness: 0.55, metalness: 0.05 });
  var LARG = PASSO * N + 0.04, FUNDO_B = 0.17;
  var tampo = new THREE.Mesh(new THREE.BoxGeometry(LARG, 0.012, FUNDO_B), matMadeira); tampo.position.y = -0.006; bandeja.add(tampo);
  [[0, FUNDO_B / 2, LARG, 0.012], [0, -FUNDO_B / 2, LARG, 0.012]].forEach(function (a) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(a[2], 0.03, a[3]), matMadeira); m.position.set(a[0], 0.009, a[1]); bandeja.add(m);
  });
  [LARG / 2, -LARG / 2].forEach(function (x) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, FUNDO_B), matMadeira); m.position.set(x, 0.009, 0); bandeja.add(m);
    var alca = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0xb9a26a, metalness: 0.9, roughness: 0.3 }));
    alca.rotation.set(0, x > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI / 2); alca.position.set(x + (x > 0 ? 0.004 : -0.004), 0.018, 0); bandeja.add(alca);
  });
  /* A marca Dragon Games fica no fundo das seis xícaras da casa (o carimbo), não na bandeja. */

  /* ---------------- as xícaras ---------------- */
  var porcelana = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.28, metalness: 0.02 });
  var filete = new THREE.MeshStandardMaterial({ color: 0x2f5e8c, roughness: 0.35 });
  var perfil = [[0.024, 0], [0.027, 0.002], [0.027, 0.006], [0.031, 0.012], [0.038, 0.03], [0.043, 0.052], [0.045, ALTURA], [0.042, ALTURA], [0.04, 0.05], [0.035, 0.03], [0.028, 0.013], [0.02, 0.009], [0, 0.009]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
  var geoCorpo = new THREE.LatheGeometry(perfil, 40);
  var geoAlca = new THREE.TorusGeometry(0.016, 0.0042, 10, 20, Math.PI * 1.25);
  var geoFilete = new THREE.TorusGeometry(0.0445, 0.0012, 6, 48);

  /* Marca de fábrica das seis da casa: o carimbo Dragon Games (Mario, 28/09/2026). */
  var carimbo = new Image(); carimbo.src = 'marcas/carimbo_xicara.webp';
  function marcaDaCasa(g, cx, cy) {
    if (!carimbo.complete || !carimbo.naturalWidth) return;
    g.save(); g.globalAlpha = 0.85; g.translate(cx, cy); g.rotate(-0.12);
    g.drawImage(carimbo, -118, -118, 236, 236); g.restore();
  }
  function marcaDeFora(g, cx, cy) {          /* outra fábrica, outra louça, e o jasmim */
    g.save(); g.translate(cx, cy); g.strokeStyle = g.fillStyle = '#7a4a2a'; g.lineWidth = 2;
    g.setLineDash([6, 5]); g.beginPath(); g.arc(0, 0, 104, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    g.font = 'italic 700 16px Georgia, serif'; g.textAlign = 'center';
    arco(g, 'LOUÇA PINTADA À MÃO', 92, -Math.PI / 2);
    /* jasmim: cinco pétalas brancas e o miolo */
    g.translate(0, 84);
    for (var i = 0; i < 5; i++) { g.save(); g.rotate(i * Math.PI * 2 / 5); g.fillStyle = '#fbfaf3'; g.strokeStyle = '#9aa77a'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, -8, 4.5, 8.5, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); }
    g.fillStyle = '#e8c34a'; g.beginPath(); g.arc(0, 0, 2.6, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function arco(g, txt, raio, centro, baixo) {   /* texto em arco: em cima lê por fora, embaixo lê por dentro */
    var passo = 0.085, A = txt.length * passo;
    for (var i = 0; i < txt.length; i++) {
      var a = baixo ? centro + A / 2 - passo / 2 - i * passo : centro - A / 2 + passo / 2 + i * passo;
      g.save(); g.translate(Math.cos(a) * raio, Math.sin(a) * raio); g.rotate(baixo ? a - Math.PI / 2 : a + Math.PI / 2);
      g.textBaseline = 'middle'; g.fillText(txt[i], 0, 0); g.restore();
    }
  }
  function desenharConteudo(it, g, resolvida) {
    g.clearRect(0, 0, S, S);
    g.fillStyle = '#f6f2ea'; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); g.fill();
    if (resolvida) (it.intruso ? marcaDeFora : marcaDaCasa)(g, S / 2, S / 2);
    if (resolvida && !it.intruso) { g.fillStyle = 'rgba(246,242,234,.82)'; g.beginPath(); g.arc(S / 2, S / 2, 52, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#1d2a36'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var t = it.texto; g.fillStyle = '#0c1219'; g.font = '800 ' + (t.length > 3 ? 54 : t.length > 2 ? 70 : 100) + 'px Georgia, serif';
    g.fillText(t, S / 2, S / 2 + (it.envio ? -12 : 4));
    if (it.envio) { g.font = '700 24px Georgia, serif'; g.fillStyle = '#7a5a10'; g.fillText('✉ +1 envio', S / 2, S / 2 + 44); }
  }

  var xicaras = [];
  itens.forEach(function (it, i) {
    var x = new THREE.Group(); x.userData.item = it;
    var corpo = new THREE.Mesh(geoCorpo, porcelana); x.add(corpo);
    var f = new THREE.Mesh(geoFilete, filete); f.rotation.x = Math.PI / 2; f.position.y = ALTURA - 0.004; x.add(f);
    var alca = new THREE.Mesh(geoAlca, porcelana); alca.rotation.set(0, Math.PI / 2, -0.35); alca.position.set(0, 0.036, -0.046); x.add(alca);
    /* o fundo: conteúdo + raspadinha (centro) + pó (anel), num só canvas mostrado */
    var cc = document.createElement('canvas'); cc.width = cc.height = S;
    var cr = document.createElement('canvas'); cr.width = cr.height = S;
    var cm = document.createElement('canvas'); cm.width = cm.height = S;
    var gr = cr.getContext('2d');
    var grad = gr.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, 70); grad.addColorStop(0, '#c7c9cc'); grad.addColorStop(1, '#9fa3a8');
    gr.fillStyle = '#d8d0c2'; gr.beginPath(); gr.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); gr.fill();                  /* pó */
    for (var k = 0; k < 400; k++) { gr.fillStyle = 'rgba(120,105,85,' + Math.random() * 0.25 + ')'; gr.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
    gr.fillStyle = grad; gr.beginPath(); gr.arc(S / 2, S / 2, 66, 0, Math.PI * 2); gr.fill();                            /* prata */
    for (k = 0; k < 160; k++) { gr.fillStyle = 'rgba(255,255,255,' + Math.random() * 0.35 + ')'; gr.fillRect(S / 2 - 60 + Math.random() * 120, S / 2 - 60 + Math.random() * 120, 1, 1); }
    var tex = new THREE.CanvasTexture(cm); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
    var fundo = new THREE.Mesh(new THREE.CircleGeometry(RAIO_FUNDO, 40), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
    fundo.rotation.x = Math.PI / 2; fundo.position.y = -0.0006; x.add(fundo);
    /* área de toque para raspar, um pouco maior que o fundo (o dedo é grosso) */
    var toque = new THREE.Mesh(new THREE.CircleGeometry(RAIO_TOQUE, 24), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    toque.rotation.copy(fundo.rotation); toque.position.y = -0.002; x.add(toque);
    x.userData = { item: it, fundo: fundo, toque: toque, cc: cc, cr: cr, cm: cm, tex: tex, virada: false, raspado: 0, pego: false, slot: 0, alvoX: 0 };
    desenharConteudo(it, cc.getContext('2d'), false); compor(x);
    bandeja.add(x); xicaras.push(x);
  });
  function xDoSlot(s) { return (s - (N - 1) / 2) * PASSO; }
  ordemInicial.forEach(function (idx, s) { var x = xicaras[idx]; x.userData.slot = s; x.position.set(xDoSlot(s), 0, 0.005); });

  function compor(x) {
    var u = x.userData, g = u.cm.getContext('2d');
    g.clearRect(0, 0, S, S); g.drawImage(u.cc, 0, 0); g.drawImage(u.cr, 0, 0);
    if (u.brilho) { g.fillStyle = 'rgba(255,255,255,' + (0.18 * u.brilho) + ')'; g.beginPath(); g.ellipse(S * 0.4, S * 0.35, 60, 26, -0.6, 0, Math.PI * 2); g.fill(); }
    if (u.po) { g.fillStyle = 'rgba(150,135,110,' + u.po + ')'; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); g.fill(); }
    u.tex.needsUpdate = true;
  }
  function raspar(x, uvToque) {
    var k = RAIO_TOQUE / RAIO_FUNDO, uv = { x: 0.5 + (uvToque.x - 0.5) * k, y: 0.5 + (uvToque.y - 0.5) * k };
    var u = x.userData, g = u.cr.getContext('2d');
    var px = uv.x * S, py = (1 - uv.y) * S;
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = g.strokeStyle = '#000';
    g.beginPath(); g.arc(px, py, 15, 0, Math.PI * 2); g.fill();
    if (u.ultimo) { g.lineWidth = 30; g.lineCap = 'round'; g.beginPath(); g.moveTo(u.ultimo[0], u.ultimo[1]); g.lineTo(px, py); g.stroke(); }
    g.restore(); u.ultimo = [px, py];
    /* não deixa raspar o pó do anel: só a prata do meio sai com o dedo */
    var d = Math.hypot(px - S / 2, py - S / 2);
    if (d > 70) { repintarPo(x); }
    compor(x);
  }
  function repintarPo(x) {
    var u = x.userData, g = u.cr.getContext('2d');
    g.save(); g.globalCompositeOperation = 'destination-over';
    g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); g.arc(S / 2, S / 2, 68, 0, Math.PI * 2, true);
    g.fillStyle = '#d8d0c2'; g.fill(); g.restore();
  }
  function medirRaspado(x) {
    var u = x.userData, d = u.cr.getContext('2d').getImageData(S / 2 - 50, S / 2 - 50, 100, 100).data, livre = 0, tot = 0;
    for (var i = 0; i < d.length; i += 16) { var px = (i / 4) % 100 - 50, py = Math.floor(i / 400) - 50; if (px * px + py * py > 2500) continue; tot++; if (d[i + 3] < 40) livre++; }
    return tot ? livre / tot : 0;
  }

  /* ---------------- gestos ---------------- */
  var animando = [], resolvido = false, envioDado = false;
  b.aCadaQuadro(function (dt) {
    animando = animando.filter(function (f) { return f(dt) !== true; });
    xicaras.forEach(function (x) { var u = x.userData; if (!u.pego && !u.virando) x.position.x += (xDoSlot(u.slot) - x.position.x) * Math.min(1, dt * 12); });
  });
  function virar(x) {
    var u = x.userData; if (u.virada || u.virando) return; u.virando = true; var t = 0;
    b.vibrar(10);
    animando.push(function (dt) {
      t = Math.min(1, t + dt / 0.55); var s = b.suave(t);
      x.rotation.x = Math.PI * s; x.position.y = ALTURA * s + Math.sin(Math.PI * s) * 0.05;
      if (t >= 1) { u.virando = false; u.virada = true; return true; }
    });
  }
  xicaras.forEach(function (x) {
    var u = x.userData, x0, y0, modoGesto, plano, dx0;
    b.pega({
      rotulo: 'Xícara',
      alvo: function () { return x; },
      ativa: function () { return !u.virando && !resolvido; },
      inicio: function (sx, sy) {
        x0 = sx; y0 = sy; modoGesto = null; u.ultimo = null;
        var h = b.raioDoDedo(sx, sy).intersectObject(u.toque, false)[0];
        if (u.virada && h && h.uv) { modoGesto = 'raspar'; raspar(x, h.uv); }
        var p = x.getWorldPosition(new THREE.Vector3());
        plano = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0).transformDirection(bandeja.matrixWorld), p);
        var q = b.dedoNoPlano(sx, sy, plano); dx0 = q ? bandeja.worldToLocal(q).x - x.position.x : 0;
      },
      mover: function (sx, sy) {
        if (modoGesto === 'raspar') {
          var h = b.raioDoDedo(sx, sy).intersectObject(u.toque, false)[0];
          if (h && h.uv) raspar(x, h.uv); else u.ultimo = null;
          return;
        }
        if (!modoGesto) {
          var ddx = sx - x0, ddy = sy - y0;
          if (Math.hypot(ddx, ddy) < 10) return;
          modoGesto = (!u.virada && -ddy > Math.abs(ddx) * 1.2) ? 'virar' : 'mover';
          if (modoGesto === 'virar') { virar(x); return; }
          u.pego = true;
        }
        if (modoGesto === 'mover') {
          var q = b.dedoNoPlano(sx, sy, plano); if (!q) return;
          var lx = bandeja.worldToLocal(q).x - dx0, lim = xDoSlot(N - 1) + 0.02;
          x.position.x = Math.max(-lim, Math.min(lim, lx));
        }
      },
      fim: function () {
        if (modoGesto === 'raspar') {
          u.raspado = medirRaspado(x);
          if (u.raspado > 0.55 && !u.revelada) revelar(x);
          return;
        }
        if (modoGesto === 'mover') {
          u.pego = false;
          var novo = Math.max(0, Math.min(N - 1, Math.round(x.position.x / PASSO + (N - 1) / 2)));
          var outra = xicaras.find(function (o) { return o !== x && o.userData.slot === novo; });
          if (outra) outra.userData.slot = u.slot;
          u.slot = novo; b.vibrar(8);
          conferir();
        }
      }
    });
  });

  function revelar(x) {
    var u = x.userData; u.revelada = true;
    var g = u.cr.getContext('2d'); g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = g.strokeStyle = '#000'; g.beginPath(); g.arc(S / 2, S / 2, 68, 0, Math.PI * 2); g.fill(); g.restore();
    compor(x); b.vibrar(15);
    if (u.item.envio && !envioDado) {
      envioDado = true; b.estado('Um envio extra! +1');
      avisarMesa('envio', {});
    }
    conferir();
  }

  /* seis em ordem (crescente ou decrescente; letras: a palavra) e a sétima numa ponta */
  function conferir() {
    if (resolvido) return;
    if (!xicaras.every(function (x) { return x.userData.revelada; })) return;
    var fila = xicaras.slice().sort(function (a, c) { return a.userData.slot - c.userData.slot; }).map(function (x) { return x.userData.item; });
    var intPos = fila.findIndex(function (it) { return it.intruso; });
    if (intPos !== 0 && intPos !== N - 1) return;
    var seis = fila.filter(function (it) { return !it.intruso; }).map(function (it) { return it.ordem; });
    var cresce = seis.every(function (v, i) { return v === i; });
    var desce = tipo !== 'letra' && seis.every(function (v, i) { return v === 5 - i; });
    if (cresce || desce) resolver();
  }
  function resolver() {
    resolvido = true; b.vibrar([20, 60, 20, 60, 40]);
    var t = 0;
    xicaras.forEach(function (x) { desenharConteudo(x.userData.item, x.userData.cc.getContext('2d'), true); });
    animando.push(function (dt) {
      t = Math.min(1, t + dt / 1.6);
      xicaras.forEach(function (x) {
        var u = x.userData, g = u.cr.getContext('2d');
        g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = g.strokeStyle = '#000'; g.globalAlpha = 0.12; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); g.fill(); g.restore();
        if (u.item.intruso) { u.brilho = t; x.position.y = ALTURA + Math.sin(t * Math.PI) * 0.025; }
        else u.po = 0.2 * t;
        compor(x);
      });
      if (t >= 1) { b.estado('Seis têm o carimbo da casa e pó de meses. Uma é de outro jogo.'); mandarPista(); return true; }
    });
  }
  function mandarPista() {
    var x = xicaras.find(function (o) { return o.userData.item.intruso; });
    var c = document.createElement('canvas'); c.width = c.height = 512; var g = c.getContext('2d');
    g.fillStyle = '#10151b'; g.fillRect(0, 0, 512, 512);
    g.drawImage(x.userData.cm, 0, 0, S, S, 0, 0, 512, 512);
    avisarMesa('pista', { nome: 'Fundo da xícara de outro jogo', img: c.toDataURL('image/jpeg', 0.86) });
  }
  function avisarMesa(evento, extra) {
    try { if (parent !== window) parent.postMessage(Object.assign({ oi: 'bandeja', evento: evento }, extra || {}), location.origin); } catch (e) {}
  }

  b.comecar();
  b.estado('A bandeja de xícaras.');

  /* para os testes */
  window.OIBandeja = {
    modo: modo, itens: itens,
    xicaraNaTela: function (i) { return b.naTela(xicaras[i].getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.03, 0))); },
    fundoNaTela: function (i) { return b.naTela(xicaras[i].userData.fundo.getWorldPosition(new THREE.Vector3())); },
    estado: function () { return xicaras.map(function (x) { var u = x.userData; return { texto: u.item.texto, slot: u.slot, virada: u.virada, revelada: !!u.revelada, intruso: u.item.intruso, envio: !!u.item.envio }; }); },
    resolvido: function () { return resolvido; },
    _canvas: function (i) { return xicaras[i].userData.cm.toDataURL(); },
    _virar: function (i) { virar(xicaras[i]); }, _revelar: function (i) { revelar(xicaras[i]); },
    _slot: function (i, s) { var x = xicaras[i], o = xicaras.find(function (k) { return k !== x && k.userData.slot === s; }); if (o) o.userData.slot = x.userData.slot; x.userData.slot = s; conferir(); }
  };
})();
