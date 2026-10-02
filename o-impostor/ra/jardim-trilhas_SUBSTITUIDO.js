/* O Impostor — o jardim interno (revisão 2, Cap. 4).

   Mario, 30/09/2026: a maquete tem o jardim atrás da casa, encostado só na ala
   de serviço; na revisão 2 ele é um pátio cercado pela casa. Esta peça mostra
   só o pátio, em miniatura (1:10), com as portas e janelas que dão nele:

     oeste  — porta-janela da biblioteca · porta-janela da sala do relógio
     norte  — janela do quarto de serviço (o jasmim sobe no canto dos fundos)
     leste  — porta de serviço · porta da despensa · porta da varanda (cozinha),
              com a varanda coberta
     sul    — janela do corredor dos retratos

   Duas trilhas:
   · a SECA, de meses: pedras gastas, sem musgo, da porta de serviço até a
     janela do quarto de serviço;
   · a FRESCA, desta noite: pegadas de sola lisa na lama, com água parada
     dentro. O bico mostra a direção; ninguém diz para que lado vão.
   A trilha fresca termina na porta da partida (?fim=despensa|varanda|
   biblioteca|quarto|sala) e começa na porta-janela da biblioteca — ou na da
   sala do relógio, quando termina na biblioteca.

   Nada aqui se mexe: é para olhar de perto, girar e aproximar. */
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  var FIM = Q.get('fim') || 'sala';

  var b = OIBase.criar({
    vista: { alvo: [0, 0.02, 0.04], dist: 1.35, distRetrato: 2.3, dir: [0.05, 1.3, 0.8] },
    raioDoChao: 0.8, alturaDoAparelho: 0.45, miraEscala: 1.4, exposicao: 0.62,
    textoMira: 'Aponte para uma mesa ou o chão e toque em Pôr aqui.',
    textoInicio: 'O jardim interno, na chuva.'
  });

  function cor(h) { return new THREE.Color(h).convertSRGBToLinear(); }   /* as cores do modelo vêm em sRGB */
  var M = {
    terra: new THREE.MeshStandardMaterial({ color: cor(0x6e3222), roughness: 0.95 }),
    pedra: new THREE.MeshStandardMaterial({ color: cor(0x77736a), roughness: 0.9 }),
    pedraGasta: new THREE.MeshStandardMaterial({ color: cor(0x9a948a), roughness: 0.7 }),
    musgo: new THREE.MeshStandardMaterial({ color: cor(0x4f5f3a), roughness: 1 }),
    parede: new THREE.MeshStandardMaterial({ color: cor(0xd9ccb4), roughness: 0.9 }),
    rodape: new THREE.MeshStandardMaterial({ color: cor(0x8a7a64), roughness: 0.9 }),
    vao: new THREE.MeshStandardMaterial({ color: cor(0x1b1612), roughness: 0.6 }),
    vidro: new THREE.MeshStandardMaterial({ color: cor(0x3a4a55), roughness: 0.15, metalness: 0.3 }),
    madeira: new THREE.MeshStandardMaterial({ color: cor(0x5a3a24), roughness: 0.8 }),
    telha: new THREE.MeshStandardMaterial({ color: cor(0x8c4a32), roughness: 0.85 }),
    folha: new THREE.MeshStandardMaterial({ color: cor(0x2f5a2c), roughness: 0.9 }),
    flor: new THREE.MeshStandardMaterial({ color: cor(0xf4f0e2), roughness: 0.6 }),
    lama: new THREE.MeshStandardMaterial({ color: cor(0x2e1a12), roughness: 0.55 }),
    agua: new THREE.MeshStandardMaterial({ color: cor(0x5c6f7a), roughness: 0.05, metalness: 0.4 })
  };
  var R = b.raiz, L = 0.42, H = 0.22;           /* meia largura do pátio e altura das paredes */

  function caixa(w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); R.add(m); return m;
  }
  function rotulo(txt, x, y, z) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 96;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(12,9,7,.78)'; g.fillRect(0, 0, 512, 96);
    g.strokeStyle = 'rgba(224,177,58,.7)'; g.lineWidth = 4; g.strokeRect(2, 2, 508, 92);
    g.fillStyle = '#f3d078'; var fs = 44; do { g.font = '600 ' + fs + 'px Inter, system-ui, sans-serif'; fs -= 2; } while (g.measureText(txt).width > 480 && fs > 16); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, 256, 50);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
    s.scale.set(0.16, 0.03, 1); s.position.set(x, y, z); s.renderOrder = 10; R.add(s); return s;
  }

  /* ---------- chão ---------- */
  var chao = new THREE.Mesh(new THREE.PlaneGeometry(2 * L, 2 * L), M.terra);
  chao.rotation.x = -Math.PI / 2; chao.position.y = 0.002; R.add(chao);
  /* calçada de pedra junto às paredes */
  [[0, -L + 0.03, 2 * L, 0.06], [0, L - 0.03, 2 * L, 0.06], [-L + 0.03, 0, 0.06, 2 * L], [L - 0.03, 0, 0.06, 2 * L]].forEach(function (p) {
    caixa(p[2], 0.006, p[3], M.pedra, p[0], 0.005, p[1]);
  });
  /* pedras soltas, com musgo, espalhadas */
  var sorte = 7;
  function rnd() { sorte = (sorte * 16807) % 2147483647; return sorte / 2147483647; }
  for (var i = 0; i < 26; i++) {
    var x = (rnd() - 0.5) * 0.66, z = (rnd() - 0.5) * 0.66;
    var s = 0.018 + rnd() * 0.02;
    var p = caixa(s, 0.005, s * (0.7 + rnd() * 0.5), M.pedra, x, 0.004, z); p.rotation.y = rnd() * 3;
    caixa(s * 0.5, 0.0015, s * 0.4, M.musgo, x + s * 0.15, 0.0075, z);
  }

  /* ---------- paredes, portas e janelas ---------- */
  /* parede: lado ('N','S','L','O'), altura */
  function parede(lado, alt) {
    var t = 0.03, m;
    if (lado === 'N') m = caixa(2 * L + 2 * t, alt, t, M.parede, 0, alt / 2, -L - t / 2);
    if (lado === 'S') m = caixa(2 * L + 2 * t, alt, t, M.parede, 0, alt / 2, L + t / 2);
    if (lado === 'O') m = caixa(t, alt, 2 * L, M.parede, -L - t / 2, alt / 2, 0);
    if (lado === 'L') m = caixa(t, alt, 2 * L, M.parede, L + t / 2, alt / 2, 0);
    return m;
  }
  parede('N', H); parede('O', H); parede('L', H); parede('S', 0.07);   /* o sul é baixo, para se ver dentro */
  /* um vão na face interna da parede: lado, posição ao longo, largura, altura, peitoril, vidro? */
  function vao(lado, pos, w, h, peit, vidro) {
    var mat = vidro ? M.vidro : M.vao, fr = 0.006, d = 0.004, g;
    if (lado === 'O') { g = new THREE.Group(); g.position.set(-L + d, peit + h / 2, pos); g.rotation.y = Math.PI / 2; }
    if (lado === 'L') { g = new THREE.Group(); g.position.set(L - d, peit + h / 2, pos); g.rotation.y = -Math.PI / 2; }
    if (lado === 'N') { g = new THREE.Group(); g.position.set(pos, peit + h / 2, -L + d); }
    if (lado === 'S') { g = new THREE.Group(); g.position.set(pos, peit + h / 2, L - d); g.rotation.y = Math.PI; }
    var pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); g.add(pl);
    [[0, h / 2, w + fr * 2, fr], [0, -h / 2, w + fr * 2, fr], [-w / 2, 0, fr, h], [w / 2, 0, fr, h]].forEach(function (q) {
      var f = new THREE.Mesh(new THREE.BoxGeometry(q[2], q[3], 0.006), M.madeira); f.position.set(q[0], q[1], 0.002); g.add(f);
    });
    if (vidro) { var mt = new THREE.Mesh(new THREE.BoxGeometry(fr, h, 0.006), M.madeira); mt.position.z = 0.002; g.add(mt); }
    R.add(g); return g;
  }
  var PORTAS = {
    biblioteca: { lado: 'O', pos: 0.16, nome: 'Porta-janela da biblioteca', ponto: [-L + 0.03, 0.16] },
    sala: { lado: 'O', pos: -0.2, nome: 'Porta-janela da sala do relógio', ponto: [-L + 0.03, -0.2] },
    quarto: { lado: 'N', pos: 0.2, nome: 'Janela do quarto de serviço', ponto: [0.2, -L + 0.03] },
    servico: { lado: 'L', pos: -0.27, nome: 'Porta de serviço', ponto: [L - 0.03, -0.27] },
    despensa: { lado: 'L', pos: -0.03, nome: 'Porta da despensa', ponto: [L - 0.03, -0.03] },
    varanda: { lado: 'L', pos: 0.25, nome: 'Porta da varanda (cozinha)', ponto: [0.27, 0.25] },
    retratos: { lado: 'S', pos: -0.12, nome: 'Janela do corredor dos retratos' }
  };
  vao('O', PORTAS.biblioteca.pos, 0.1, 0.17, 0.006, true);
  vao('O', PORTAS.sala.pos, 0.1, 0.17, 0.006, true);
  vao('N', PORTAS.quarto.pos, 0.08, 0.07, 0.08, true);
  vao('L', PORTAS.servico.pos, 0.07, 0.16, 0.006, false);
  vao('L', PORTAS.despensa.pos, 0.07, 0.16, 0.006, false);
  vao('L', PORTAS.varanda.pos, 0.07, 0.16, 0.006, false);
  /* a janela do corredor dos retratos fica na parede baixa do sul: um parapeito com o vidro deitado */
  caixa(0.12, 0.012, 0.03, M.madeira, PORTAS.retratos.pos, 0.076, L + 0.015);
  caixa(0.11, 0.004, 0.024, M.vidro, PORTAS.retratos.pos, 0.083, L + 0.015);

  /* degrau da porta de serviço */
  caixa(0.08, 0.012, 0.03, M.pedra, L - 0.015, 0.006, PORTAS.servico.pos);

  /* varanda coberta, na frente da cozinha */
  caixa(0.14, 0.01, 0.3, M.pedra, L - 0.07, 0.005, 0.25);
  [[L - 0.14, 0.11], [L - 0.14, 0.39]].forEach(function (p) { caixa(0.012, 0.16, 0.012, M.madeira, p[0], 0.08, p[1]); });
  var tel = caixa(0.17, 0.008, 0.33, M.telha, L - 0.07, 0.165, 0.25); tel.rotation.z = -0.18;

  /* o jasmim, no canto dos fundos, subindo até a janela do quarto */
  for (var j = 0; j < 40; j++) {
    var t = j / 40, px = L - 0.02 - rnd() * 0.05 - t * 0.12, py = 0.01 + t * 0.16 + rnd() * 0.02, pz = -L + 0.012 + rnd() * 0.02;
    var fo = new THREE.Mesh(new THREE.SphereGeometry(0.012 + rnd() * 0.008, 6, 5), M.folha); fo.position.set(px, py, pz); R.add(fo);
    if (rnd() > 0.5) { var fl = new THREE.Mesh(new THREE.SphereGeometry(0.003, 5, 4), M.flor); fl.position.set(px + 0.006, py + 0.006, pz + 0.01); R.add(fl); }
  }

  /* ---------- a trilha seca: pedras gastas, sem musgo ---------- */
  (function () {
    var a = PORTAS.servico.ponto, c = PORTAS.quarto.ponto;
    for (var k = 0; k <= 5; k++) {
      var u = k / 5, x = a[0] + (c[0] - a[0]) * u - 0.03 * Math.sin(u * Math.PI), z = a[1] + (c[1] - a[1]) * u + 0.02;
      var p = caixa(0.03, 0.004, 0.024, M.pedraGasta, x, 0.004, z); p.rotation.y = 0.4 + k * 0.3;
    }
    /* terra batida em volta */
    var bat = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.24), new THREE.MeshStandardMaterial({ color: cor(0x5a2a1c), roughness: 1 }));
    bat.rotation.x = -Math.PI / 2; bat.position.set((a[0] + c[0]) / 2 - 0.02, 0.0028, (a[1] + c[1]) / 2 + 0.02);
    bat.rotation.z = Math.atan2(c[0] - a[0], c[1] - a[1]); R.add(bat);
  })();

  /* ---------- a trilha fresca: pegadas de sola lisa ---------- */
  var sola = (function () {                     /* sola de sapato, bico para +y */
    var s = new THREE.Shape(), w = 0.0058, l = 0.028;
    s.moveTo(0, -l / 2);
    s.bezierCurveTo(w, -l / 2, w, -l / 2 + 0.008, w * 0.85, -l / 2 + 0.01);
    s.bezierCurveTo(w * 0.7, 0, w * 1.15, l * 0.2, w * 0.9, l * 0.34);
    s.bezierCurveTo(w * 0.6, l * 0.46, w * 0.15, l / 2, 0, l / 2);             /* o bico */
    s.bezierCurveTo(-w * 0.15, l / 2, -w * 0.6, l * 0.46, -w * 0.9, l * 0.34);
    s.bezierCurveTo(-w * 1.15, l * 0.2, -w * 0.7, 0, -w * 0.85, -l / 2 + 0.01);
    s.bezierCurveTo(-w, -l / 2 + 0.008, -w, -l / 2, 0, -l / 2);
    return new THREE.ShapeGeometry(s, 10);
  })();
  var pegadas = new THREE.Group(); R.add(pegadas);
  function trilhaFresca(de, ate) {
    var a = PORTAS[de].ponto, c = PORTAS[ate].ponto;
    /* curva: o controle se afasta da parede, para o meio do pátio */
    var mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2, dx = c[0] - a[0], dz = c[1] - a[1], len = Math.hypot(dx, dz);
    var nx = -dz / len, nz = dx / len;
    if (nx * (0 - mx) + nz * (0 - mz) < 0) { nx = -nx; nz = -nz; }
    var bow = Math.min(0.18, 0.1 + 0.3 / Math.max(len, 0.3) * 0.05);
    var ctl = [mx + nx * bow, mz + nz * bow];
    function pt(u) { var v = 1 - u; return [v * v * a[0] + 2 * v * u * ctl[0] + u * u * c[0], v * v * a[1] + 2 * v * u * ctl[1] + u * u * c[1]]; }
    /* comprimento aproximado */
    var comp = 0, prev = pt(0); for (var k = 1; k <= 50; k++) { var q = pt(k / 50); comp += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; }
    var passos = Math.max(6, Math.round(comp / 0.042));
    for (var n = 0; n <= passos; n++) {
      var u = 0.03 + 0.94 * n / passos, p0 = pt(u), p1 = pt(Math.min(1, u + 0.01));
      var tx = p1[0] - p0[0], tz = p1[1] - p0[1], tl = Math.hypot(tx, tz); tx /= tl; tz /= tl;
      var lado = n % 2 ? 1 : -1, ox = -tz * 0.011 * lado, oz = tx * 0.011 * lado;
      var g = new THREE.Group(); g.position.set(p0[0] + ox, 0.0034, p0[1] + oz);
      g.rotation.y = Math.atan2(tx, tz);        /* o bico aponta para onde a pessoa ia */
      var m = new THREE.Mesh(sola, M.lama); m.rotation.x = -Math.PI / 2; g.add(m);
      if (n % 3 !== 1) {                         /* água parada dentro da pegada */
        var w = new THREE.Mesh(sola, M.agua); w.rotation.x = -Math.PI / 2; w.scale.set(0.55, 0.55, 1); w.position.set(0, 0.0006, 0.002); g.add(w);
      }
      pegadas.add(g);
    }
  }
  var INICIO = FIM === 'biblioteca' ? 'sala' : 'biblioteca';
  if (PORTAS[FIM] && FIM !== INICIO) trilhaFresca(INICIO, FIM);

  /* ---------- nomes das portas (o jogador precisa saber qual é qual) ---------- */
  Object.keys(PORTAS).forEach(function (k) {
    var p = PORTAS[k], y = p.lado === 'S' ? 0.13 : H + 0.05, x = 0, z = 0;
    if (p.lado === 'O') { x = -L + 0.06; z = p.pos; }
    if (p.lado === 'L') { x = L - 0.06; z = p.pos; }
    if (p.lado === 'N') { x = p.pos - 0.05; z = -L + 0.02; }
    if (p.lado === 'S') { x = p.pos; z = L - 0.02; }
    rotulo(p.nome, x, y + (k === 'despensa' ? 0.045 : 0), z);
  });

  /* ---------- chuva ---------- */
  var gotas = 260, pos = new Float32Array(gotas * 6);
  for (var d = 0; d < gotas; d++) {
    var gx = (rnd() - 0.5) * 2 * L, gz = (rnd() - 0.5) * 2 * L, gy = rnd() * 0.6;
    pos.set([gx, gy, gz, gx, gy - 0.03, gz], d * 6);
  }
  var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var chuva = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9fb4c4, transparent: true, opacity: 0.35 }));
  chuva.raycast = function () {}; R.add(chuva);
  b.aCadaQuadro(function (dt) {
    var a = geo.attributes.position.array;
    for (var k = 0; k < gotas; k++) {
      var i0 = k * 6; a[i0 + 1] -= dt * 0.9; a[i0 + 4] -= dt * 0.9;
      if (a[i0 + 4] < 0) { a[i0 + 1] += 0.6; a[i0 + 4] += 0.6; }
    }
    geo.attributes.position.needsUpdate = true;
  });

  /* uma luz da cozinha, na varanda */
  var luz = new THREE.PointLight(0xffc27a, 0.8, 0.9); luz.position.set(L - 0.08, 0.14, 0.25); R.add(luz);

  b.comecar();
  window.OIJardim = { fim: function () { return FIM; }, inicio: function () { return INICIO; }, pegadas: function () { return pegadas.children.length; } };
})();
