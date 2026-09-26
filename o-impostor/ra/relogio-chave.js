/* O Impostor — o relógio de caixa alta, com a mão.

   Dois gestos (a base comum está em ra/base-ra.js):

   · A CHAVE — a pega fica na ponta. Arrastando, a ponta anda por cima da
     madeira e do vidro, sem atravessar; fora do móvel, segue num plano de
     frente para quem olha. Soltando a menos de TOLERANCIA do furo, a chave
     entra, gira, e a porta longa abre levando a chave junto. O lacre se parte
     porque metade dele está na porta e metade no corpo.
   · A GAVETA — a pega fica no puxador. A gaveta corre no próprio trilho
     (eixo z do móvel), de fechada até CURSO; fica onde o dedo soltar. O papel
     dentro dela vem junto. */
(function () {
  'use strict';
  var TOLERANCIA = 0.03, FOLGA = 0.004, CURSO = 0.16;

  var b = OIBase.criar({
    vista: { alvo: [0, 0.78, 0], dist: 2.5, distRetrato: 3.6 },
    alturaDoAparelho: 1.35, miraEscala: 3,
    textoMira: 'Aponte para o chão, onde o relógio ficaria, e toque em Pôr aqui.',
    textoInicio: 'A chave está no chão, perto do relógio. Os círculos dourados se seguram com o dedo.',
    deNovo: deNovo
  });

  var relogio, chave, furo, portaLonga, gaveta, puxador, clipPorta, meshes = [], aberta = false, animando = null;
  var gav0 = new THREE.Vector3(), abertura = 0;

  b.carregar(['modelos/relogio_caixa_alta_v2.glb', 'modelos/chave_de_corda.glb']).then(function (r) {
    relogio = r[0].scene; b.raiz.add(relogio);
    relogio.traverse(function (o) { if (o.isMesh) meshes.push(o); });
    furo = relogio.getObjectByName('fechadura_furo');
    portaLonga = relogio.getObjectByName('porta_longa');
    gaveta = relogio.getObjectByName('gaveta'); gav0.copy(gaveta.position);
    puxador = relogio.getObjectByName('puxador_concha');
    var c = r[0].animations.find(function (a) { return a.name === 'portas_abrir'; });
    clipPorta = new THREE.AnimationClip('porta_longa_abrir', c.duration,
      c.tracks.filter(function (t) { return t.name.indexOf('porta_longa') === 0; }));
    chave = new THREE.Group(); chave.add(r[1].scene); b.raiz.add(chave);
    pousarChave();
    pegaDaChave(); pegaDaGaveta();
    b.aCadaQuadro(function (dt) { if (animando) animando(dt); });
    b.comecar();
  }).catch(function (e) { b.estado('Os modelos não carregaram: ' + (e && e.message || e)); });

  function centro(o) { return new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()); }

  /* ---------------- a chave ---------------- */
  function pousarChave() {
    if (chave.parent !== b.raiz) b.raiz.attach(chave);
    chave.position.set(0.22, 0.006, 0.42);
    chave.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.6));
  }
  function porChave(pw, n) {
    var alvoQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n || new THREE.Vector3(0, 1, 0));
    var pq = chave.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    chave.quaternion.copy(pq.multiply(alvoQ));
    chave.position.copy(chave.parent.worldToLocal(pw.clone()));
  }
  function pontaNoDedo(x, y) {
    var raio = b.raioDoDedo(x, y);
    var h = raio.intersectObjects(meshes, false).find(function (h) { return b.visivel(h.object); });
    if (h) {
      var n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : raio.ray.direction.clone().negate();
      if (n.dot(raio.ray.direction) > 0) n.negate();
      return { p: h.point.clone().addScaledVector(n, FOLGA * b.escala()), n: n };
    }
    var atual = chave.getWorldPosition(new THREE.Vector3());
    var plano = new THREE.Plane().setFromNormalAndCoplanarPoint(b.cameraAgora().getWorldDirection(new THREE.Vector3()), atual);
    var p = b.dedoNoPlano(x, y, plano);
    return p ? { p: p, n: null } : null;
  }
  function pegaDaChave() {
    b.pega({
      rotulo: 'Chave',
      ancora: function () { return chave.getWorldPosition(new THREE.Vector3()); },
      ativa: function () { return !aberta && !animando; },
      inicio: function () { b.estado('Leve a ponta da chave até a fechadura.'); },
      mover: function (x, y) { var r = pontaNoDedo(x, y); if (r) porChave(r.p, r.n); },
      fim: function (x, y, cancelou) {
        if (cancelou) return;
        var d = chave.getWorldPosition(new THREE.Vector3()).distanceTo(centro(furo)) / b.escala();
        if (d < TOLERANCIA) return encaixar();
        b.vibrar([12, 40, 12]);
        b.estado(d < 0.08 ? 'Quase. A ponta bateu na madeira, perto.' : 'A chave não entrou em nada.');
      }
    });
  }
  function encaixar() {
    var alvo = centro(furo), s = b.escala();
    var n = new THREE.Vector3(0, 0, 1).transformDirection(portaLonga.matrixWorld);
    var de = chave.getWorldPosition(new THREE.Vector3());
    var fora = alvo.clone().addScaledVector(n, 0.004 * s), dentro = alvo.clone().addScaledVector(n, -0.009 * s), t = 0;
    b.estado('A chave entrou.');
    animando = function (dt) {
      t += dt;
      if (t < 0.3) porChave(de.clone().lerp(fora, b.suave(t / 0.3)), n);
      else if (t < 0.5) porChave(fora.clone().lerp(dentro, b.suave((t - 0.3) / 0.2)), n);
      else if (t < 0.95) {
        porChave(dentro, n);
        chave.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.suave((t - 0.5) / 0.45) * Math.PI / 2));
      } else {
        porChave(dentro, n);
        chave.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2));
        portaLonga.attach(chave);                     /* a chave vai junto com a porta */
        b.tocarClipe(relogio, clipPorta);
        b.vibrar([20, 50, 70]);
        aberta = true; animando = null;
        b.estado('A lingueta cedeu. O lacre se partiu.');
        b.mostrarDeNovo(true);
      }
    };
  }

  /* ---------------- a gaveta ---------------- */
  function pegaDaGaveta() {
    var inicioAbertura = 0, ancora = null, eixo = null;
    function noTrilho(x, y) {
      /* plano que contém o trilho (eixo z do móvel), o mais de frente possível para quem olha */
      var olhar = b.cameraAgora().getWorldDirection(new THREE.Vector3());
      var normal = olhar.clone().sub(eixo.clone().multiplyScalar(olhar.dot(eixo)));
      if (normal.lengthSq() < 1e-6) return null;
      normal.normalize();
      var p = b.dedoNoPlano(x, y, new THREE.Plane().setFromNormalAndCoplanarPoint(normal, ancora));
      return p ? p.sub(ancora).dot(eixo) / b.escala() : null;
    }
    b.pega({
      rotulo: 'Puxador da gaveta',
      ancora: function () { return centro(puxador); },
      ativa: function () { return !animando; },
      inicio: function () {
        inicioAbertura = abertura; ancora = centro(puxador);
        eixo = new THREE.Vector3(0, 0, 1).transformDirection(gaveta.parent.matrixWorld);
      },
      mover: function (x, y) {
        var v = noTrilho(x, y); if (v === null) return;
        abertura = Math.min(CURSO, Math.max(0, inicioAbertura + v));
        gaveta.position.copy(gav0).add(new THREE.Vector3(0, 0, abertura));
      },
      fim: function () {
        if (abertura >= CURSO - 0.005) { b.vibrar(15); b.estado('A gaveta chegou ao fim do trilho.'); }
        else if (abertura > 0.01) b.estado('A gaveta ficou entreaberta.');
        else b.estado('A gaveta está fechada.');
        b.mostrarDeNovo(true);
      }
    });
  }

  function deNovo() {
    b.pararClipes(relogio);
    aberta = false; animando = null; pousarChave();
    abertura = 0; gaveta.position.copy(gav0);
    b.mostrarDeNovo(false);
    b.estado('A chave está no chão, perto do relógio. Os círculos dourados se seguram com o dedo.');
  }

  window.OIRelogio = { furoNaTela: function () { return b.naTela(centro(furo)); }, aberta: function () { return aberta; },
    puxadorNaTela: function () { return b.naTela(centro(puxador)); }, abertura: function () { return abertura; } };
})();
