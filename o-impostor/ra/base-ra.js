/* O Impostor — base comum das peças de RA que o jogador MODIFICA com a mão.

   Mario, 26/09/2026: aplicar o método da chave (cena three.js da própria
   página + motor de RA copiado) a todas as peças do Impostor que precisam
   mudar dentro da RA. O que cada peça faz com a mão fica no arquivo dela
   (relogio-chave.js, livro-abrir.js, quarto-porta.js); aqui fica o que é igual:

   · a cena, a luz, o chão da mesa e a órbita (modo sem RA);
   · a entrada na RA — WebXR no Android, 8th Wall no iPhone (ra/motor-ra.js) —
     com a mira, "Pôr aqui" e "Sair";
   · as PEGAS: um círculo dourado que acompanha, na tela, o ponto da peça que
     se segura. O dedo pega o círculo; o arquivo da peça decide o que o
     movimento faz. É um elemento da página (não do WebGL), então funciona
     igual no 3D, no WebXR (dom-overlay) e na 8th Wall.

   Tudo aqui é do Impostor e só do Impostor: nenhum caminho para v1/. */
(function (global) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  function criar(op) {
    var api = {}, pegas = [], aCadaQuadro = [], mixers = [];
    var modo = 'mesa', posto = false, ra = null, relogio0 = new THREE.Clock();
    var raio = new THREE.Raycaster();

    /* ---------- cena ---------- */
    var renderer = new THREE.WebGLRenderer({ canvas: $('cena'), antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = op.exposicao || 1.05;
    renderer.xr.enabled = true;
    var FUNDO = 0x0c0907;
    var cena = new THREE.Scene(); cena.background = new THREE.Color(FUNDO);
    if (global.OIAmbiente) cena.environment = OIAmbiente(renderer);   /* reflexos para os metais do padrão */
    var camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.005, 50);
    cena.add(camera);
    cena.add(new THREE.HemisphereLight(0xffe8c0, 0x201008, 0.9));
    var sol = new THREE.DirectionalLight(0xffddb0, 1.6); sol.position.set(-1.5, 3, 2.5); cena.add(sol);
    var chao = new THREE.Mesh(new THREE.CircleGeometry(op.raioDoChao || 1.4, 48).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 0.95 }));
    chao.raycast = function () {}; cena.add(chao);
    var raiz = new THREE.Group(); cena.add(raiz);
    var controles = new THREE.OrbitControls(camera, renderer.domElement);
    controles.enableDamping = true; controles.maxPolarAngle = Math.PI * 0.52;

    /* enquadramento sem RA: `op.vista` = { alvo:[x,y,z], dist, distRetrato, dir:[x,y,z] } */
    function enquadrar() {
      var v = op.vista, a = innerWidth / innerHeight, d = a < 0.8 ? (v.distRetrato || v.dist * 1.4) : v.dist;
      controles.target.fromArray(v.alvo);
      var dir = new THREE.Vector3().fromArray(v.dir || [0.35, 0.3, 1]).normalize().multiplyScalar(d * 1.1);
      camera.position.set(v.alvo[0], v.alvo[1], v.alvo[2]).add(dir);
      controles.minDistance = d * 0.2; controles.maxDistance = d * 1.8;
      camera.lookAt(controles.target);
    }
    enquadrar();
    addEventListener('resize', function () {
      if (renderer.xr.isPresenting || (ra && ra.ativo())) return;
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight, false);
    });

    /* ---------- utilidades para as peças ---------- */
    function cameraAgora() { return ra && ra.ativo() ? ra.cameraAtiva() : camera; }
    function ndc(x, y) {
      var c = renderer.domElement.getBoundingClientRect();
      return new THREE.Vector2(((x - c.left) / c.width) * 2 - 1, 1 - ((y - c.top) / c.height) * 2);
    }
    function naTela(p) {
      var v = p.clone().project(cameraAgora()), r = renderer.domElement.getBoundingClientRect();
      var x = r.left + (v.x + 1) * r.width / 2, y = r.top + (1 - v.y) * r.height / 2;
      return { x: x, y: y, dentro: v.z > -1 && v.z < 1 && x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight };
    }
    function raioDoDedo(x, y) { raio.setFromCamera(ndc(x, y), cameraAgora()); return raio; }
    function escala() { return raiz.getWorldScale(new THREE.Vector3()).x || 1; }
    function visivel(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
    function suave(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
    function vibrar(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }
    function estado(t) { $('estado').textContent = t; }
    function pronto() { return modo === 'mesa' || posto; }
    /* um ponto da tela sobre um plano do mundo */
    function dedoNoPlano(x, y, plano) {
      var p = new THREE.Vector3();
      return raioDoDedo(x, y).ray.intersectPlane(plano, p) ? p : null;
    }
    function tocarClipe(raizDoModelo, clipe, fim) {
      var m = mixers.find(function (k) { return k.getRoot() === raizDoModelo; });
      if (!m) { m = new THREE.AnimationMixer(raizDoModelo); mixers.push(m); }
      var a = m.clipAction(clipe); a.reset(); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.play();
      if (fim) { var ouvir = function (e) { if (e.action === a) { m.removeEventListener('finished', ouvir); fim(); } }; m.addEventListener('finished', ouvir); }
      return a;
    }
    function pararClipes(raizDoModelo) {
      mixers.forEach(function (m) { if (m.getRoot() === raizDoModelo) { m.stopAllAction(); m.uncacheRoot(raizDoModelo); } });
    }

    /* ---------- pegas ----------
       def = { ancora(): Vector3 (mundo), ativa(): bool, inicio(x,y), mover(x,y), fim(x,y) } */
    function pega(def) {
      var el = document.createElement('div');
      el.className = 'pega'; el.hidden = true; el.setAttribute('role', 'button');
      el.setAttribute('aria-label', def.rotulo || 'Segurar');
      document.body.appendChild(el);
      var segurando = false;
      el.addEventListener('beforexrselect', function (e) { e.preventDefault(); });
      el.addEventListener('pointerdown', function (e) {
        if (!pronto() || !def.ativa()) return;
        e.preventDefault(); segurando = true; el.classList.add('segurando');
        controles.enabled = false;
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        def.inicio && def.inicio(e.clientX, e.clientY);
      });
      el.addEventListener('pointermove', function (e) { if (segurando) def.mover && def.mover(e.clientX, e.clientY); });
      ['pointerup', 'pointercancel'].forEach(function (tipo) {
        el.addEventListener(tipo, function (e) {
          if (!segurando) return;
          segurando = false; el.classList.remove('segurando');
          controles.enabled = modo === 'mesa';
          try { el.releasePointerCapture(e.pointerId); } catch (err) {}
          def.fim && def.fim(e.clientX, e.clientY, tipo === 'pointercancel');
        });
      });
      var p = { def: def, el: el, segurando: function () { return segurando; } };
      pegas.push(p);
      return p;
    }
    function posicionarPegas() {
      pegas.forEach(function (p) {
        if (!pronto() || !p.def.ativa()) { p.el.hidden = true; return; }
        if (p.segurando()) return;   /* sob o dedo, a pega é o dedo */
        var s = naTela(p.def.ancora());
        p.el.style.left = s.x + 'px'; p.el.style.top = s.y + 'px';
        p.el.hidden = !s.dentro;
      });
    }

    /* ---------- RA ---------- */
    function montarRA() {
      ra = OIRA.criar({
        renderer: renderer, camera: camera, cena: cena, altura: op.alturaDoAparelho || 1.35, miraEscala: op.miraEscala || 1,
        desenhar: desenhar,
        aoMudar: function (e) {
          if (!e.ativo && modo === 'ra') voltarParaMesa();
          $('btPor').disabled = !(e.ativo && e.temMira);
        }
      });
      ra.suporte().then(function (s) { if (s.webxr || s.slam) $('btRA').hidden = false; });
      OIRA.preparar();
      $('btRA').onclick = function () {
        $('btRA').disabled = true; estado('Abrindo a câmera…');
        ra.entrar().then(function () {
          modo = 'ra'; posto = false; raiz.visible = false; chao.visible = false; controles.enabled = false;
          $('btRA').hidden = true; $('btPor').hidden = false; $('btSair').hidden = false;
          estado(op.textoMira || 'Aponte para onde a peça vai ficar e toque em Pôr aqui.');
        }).catch(function (e) {
          $('btRA').disabled = false;
          estado('A RA não abriu (' + (e && e.message || e) + '). Siga aqui mesmo, girando com o dedo.');
        });
      };
      $('btPor').onclick = function () {
        if (!ra.estado().temMira) return;
        var m = ra.pose();
        raiz.position.setFromMatrixPosition(m); raiz.quaternion.setFromRotationMatrix(m);
        if (op.giroRA) raiz.rotateY(op.giroRA);   /* qual lado da peça fica de frente para quem olha */
        raiz.scale.setScalar(op.escalaRA || 1); raiz.visible = true; posto = true;
        ra.mostrarMira(false); $('btPor').hidden = true;
        estado(op.textoInicio || '');
      };
      $('btSair').onclick = function () { ra.sair(); };
      ['btPor', 'btSair', 'btDeNovo', 'btRA'].forEach(function (id) {
        $(id).addEventListener('beforexrselect', function (e) { e.preventDefault(); });
      });
    }
    function voltarParaMesa() {
      modo = 'mesa'; posto = false;
      raiz.position.set(0, 0, 0); raiz.quaternion.identity(); raiz.scale.setScalar(1); raiz.visible = true;
      chao.visible = true; cena.background = new THREE.Color(FUNDO); controles.enabled = true;
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); enquadrar();
      $('btRA').hidden = false; $('btRA').disabled = false; $('btPor').hidden = true; $('btSair').hidden = true;
      estado(op.textoInicio || '');
    }

    /* ---------- laço ---------- */
    function desenhar(t, quadroXR) {
      var dt = Math.min(0.05, relogio0.getDelta());
      if (ra) { ra.quadro(quadroXR); ra.mostrarMira(modo === 'ra' && !posto); }
      if (modo === 'mesa') controles.update();
      aCadaQuadro.forEach(function (f) { f(dt); });
      mixers.forEach(function (m) { m.update(dt); });
      posicionarPegas();
      renderer.render(cena, camera);
    }

    function carregar(urls) {
      var L = new THREE.GLTFLoader();
      return Promise.all(urls.map(function (u) {
        return new Promise(function (ok, falha) { L.load(u, ok, undefined, falha); });
      }));
    }

    function comecar() {
      montarRA();
      $('btDeNovo').onclick = function () { op.deNovo && op.deNovo(); };
      renderer.setAnimationLoop(desenhar);
      estado(op.textoInicio || '');
    }

    Object.assign(api, {
      cena: cena, camera: camera, renderer: renderer, raiz: raiz, controles: controles,
      cameraAgora: cameraAgora, naTela: naTela, raioDoDedo: raioDoDedo, dedoNoPlano: dedoNoPlano,
      escala: escala, visivel: visivel, suave: suave, vibrar: vibrar, estado: estado, pronto: pronto,
      tocarClipe: tocarClipe, pararClipes: pararClipes, pega: pega, carregar: carregar, comecar: comecar,
      aCadaQuadro: function (f) { aCadaQuadro.push(f); },
      mostrarDeNovo: function (sim) { $('btDeNovo').hidden = !sim; }
    });
    return api;
  }

  global.OIBase = { criar: criar };
})(window);
