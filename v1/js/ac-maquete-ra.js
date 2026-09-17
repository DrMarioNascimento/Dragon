/* Pôr a maquete no ambiente. Três caminhos, porque um só não alcança os
   aparelhos que jogam A Casa:

   · `webxr`  — Android/Chrome: sessão `immersive-ar` de verdade, com teste de
                superfície. A maquete fica presa à mesa e se anda em volta.
   · `camera` — iPhone/Safari, que NÃO tem WebXR: a câmera traseira vira o
                fundo da cena e a bússola/giroscópio move o ponto de vista. Não
                há rastreio de posição — andar não aproxima —, então a maquete
                gira como um prato e a pinça aproxima. É o que um objeto sobre
                a mesa permite fazer, e é honesto com o que o aparelho sabe.
   · `mesa`   — sem câmera (desktop, permissão negada): a mesma cena num fundo
                escuro, com órbita. A atividade continua inteira; só o cômodo
                é que não aparece. Sem esta terceira porta, a atividade não
                seria jogável nem conferível fora de um telefone.

   Regra que vale para as três: enquanto a maquete não está POSTA, a atividade
   não começa. É o pedido do desenho — a investigação nasce da maquete no
   ambiente, não de uma cena que já estava lá. */
(function (global) {
  'use strict';

  var ALTURA_DA_MESA = 0.62;   // m abaixo dos olhos, onde a maquete pousa no modo câmera
  var DISTANCIA = 0.85;        // m à frente
  var ESCALA_MIN = 0.22, ESCALA_MAX = 1.05, ESCALA_PADRAO = 0.42;

  function ehIOS() {
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  }

  function criar(opcoes) {
    var renderer = opcoes.renderer, cena = opcoes.cena, camera = opcoes.camera, raiz = opcoes.raiz;
    var aoMudar = opcoes.aoMudar || function () {};
    var baseY = opcoes.baseY || 0;

    var modo = 'mesa', sessao = null, fonteDeHit = null, temHit = false, posta = false;
    var escala = ESCALA_PADRAO, giroY = 0, video = null, fluxo = null;
    var orientacaoLigada = false, orientacaoRecebida = false;
    var quaternio = new THREE.Quaternion(), alvoQuaternio = new THREE.Quaternion();
    var pose = new THREE.Matrix4();
    var q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
    var qz = new THREE.Quaternion(), zee = new THREE.Vector3(0, 0, 1), euler = new THREE.Euler();

    var mira = new THREE.Mesh(
      new THREE.RingGeometry(0.075, 0.09, 36).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xf2d194, transparent: true, opacity: 0.9 })
    );
    mira.matrixAutoUpdate = false; mira.visible = false; mira.userData.exportExclude = true;
    cena.add(mira);

    function suportaWebXR() {
      return !!(navigator.xr && navigator.xr.isSessionSupported);
    }

    function modosPossiveis(pronto) {
      var saida = { webxr: false, camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia), mesa: true };
      if (!suportaWebXR()) { pronto(saida); return; }
      navigator.xr.isSessionSupported('immersive-ar').then(function (ok) {
        saida.webxr = !!ok; pronto(saida);
      }).catch(function () { pronto(saida); });
    }

    /* ---- pose da maquete -------------------------------------------------- */

    function aplicarPose() {
      raiz.position.setFromMatrixPosition(pose);
      raiz.quaternion.setFromRotationMatrix(pose);
      raiz.scale.setScalar(escala);
      raiz.rotateY(giroY);
      /* A base pousa NA superfície: sem isto a casa afunda meio metro de
         maquete dentro da mesa, e em RA isso é imediato e feio. */
      raiz.position.add(new THREE.Vector3(0, -baseY * escala, 0).applyQuaternion(raiz.quaternion));
      raiz.updateMatrixWorld(true);
    }

    function poseNaFrente() {
      var direcao = new THREE.Vector3();
      camera.getWorldDirection(direcao);
      direcao.y = 0;
      if (direcao.lengthSq() < 1e-6) direcao.set(0, 0, -1);
      direcao.normalize();
      var origem = new THREE.Vector3();
      camera.getWorldPosition(origem);
      var ponto = origem.clone().addScaledVector(direcao, DISTANCIA);
      ponto.y = origem.y - ALTURA_DA_MESA;
      pose.identity();
      pose.setPosition(ponto);
    }

    /* ---- modo câmera ------------------------------------------------------ */

    function pedirOrientacao() {
      var Evento = global.DeviceOrientationEvent;
      if (!Evento) return Promise.resolve(false);
      if (typeof Evento.requestPermission !== 'function') return Promise.resolve(true);
      return Evento.requestPermission().then(function (r) { return r === 'granted'; }).catch(function () { return false; });
    }

    function ouvirOrientacao(evento) {
      if (evento.alpha === null && evento.beta === null && evento.gamma === null) return;
      orientacaoRecebida = true;
      var alpha = (evento.alpha || 0) * Math.PI / 180;
      var beta = (evento.beta || 0) * Math.PI / 180;
      var gamma = (evento.gamma || 0) * Math.PI / 180;
      var giroTela = (screen.orientation && screen.orientation.angle ? screen.orientation.angle : (global.orientation || 0)) * Math.PI / 180;
      euler.set(beta, alpha, -gamma, 'YXZ');
      alvoQuaternio.setFromEuler(euler);
      alvoQuaternio.multiply(q1);
      alvoQuaternio.multiply(qz.setFromAxisAngle(zee, -giroTela));
    }

    function abrirCamera() {
      return navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
      }).then(function (f) {
        fluxo = f;
        video = document.createElement('video');
        video.id = 'ac-camera';
        video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '');
        video.muted = true; video.autoplay = true; video.srcObject = f;
        document.body.appendChild(video);
        return video.play().catch(function () {});
      });
    }

    function fecharCamera() {
      if (fluxo) { fluxo.getTracks().forEach(function (t) { t.stop(); }); fluxo = null; }
      if (video && video.parentNode) video.parentNode.removeChild(video);
      video = null;
      global.removeEventListener('deviceorientation', ouvirOrientacao);
      orientacaoLigada = false; orientacaoRecebida = false;
    }

    /* ---- entrada e saída --------------------------------------------------- */

    function entrar(qual) {
      if (qual === 'webxr') return entrarWebXR();
      if (qual === 'camera') return entrarCamera();
      modo = 'mesa'; posta = false; aoMudar();
      return Promise.resolve('mesa');
    }

    function entrarCamera() {
      return abrirCamera().then(function () {
        return pedirOrientacao();
      }).then(function (autorizado) {
        if (autorizado) { global.addEventListener('deviceorientation', ouvirOrientacao); orientacaoLigada = true; }
        modo = 'camera'; posta = false; escala = ESCALA_PADRAO; giroY = 0;
        document.body.classList.add('in-ar', 'ra-camera');
        renderer.setClearAlpha(0);
        cena.background = null;
        aoMudar();
        return 'camera';
      });
    }

    function entrarWebXR() {
      return navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      }).then(function (s) {
        sessao = s; modo = 'webxr'; posta = false; temHit = false; escala = ESCALA_PADRAO; giroY = 0;
        document.body.classList.add('in-ar', 'ra-webxr');
        cena.background = null; renderer.setClearAlpha(0);
        /* Em WebXR o toque válido é o `select` da sessão: com dom-overlay,
           um toque sobre um painel do DOM não deve pousar a casa. */
        s.addEventListener('select', function () { if (!posta) posicionar(); });
        s.addEventListener('end', function () {
          sessao = null; temHit = false; posta = false;
          if (fonteDeHit) { fonteDeHit.cancel(); fonteDeHit = null; }
          mira.visible = false;
          document.body.classList.remove('in-ar', 'ra-webxr');
          modo = 'mesa'; aoMudar();
        });
        renderer.xr.setReferenceSpaceType('local');
        return renderer.xr.setSession(s).then(function () { return s.requestReferenceSpace('viewer'); });
      }).then(function (espaco) {
        return sessao.requestHitTestSource({ space: espaco });
      }).then(function (fonte) {
        fonteDeHit = fonte; aoMudar(); return 'webxr';
      });
    }

    function sair() {
      if (sessao) { var s = sessao; sessao = null; return s.end().catch(function () {}); }
      fecharCamera();
      document.body.classList.remove('in-ar', 'ra-camera');
      renderer.setClearAlpha(1);
      modo = 'mesa'; posta = false; aoMudar();
      return Promise.resolve();
    }

    /* ---- posicionar --------------------------------------------------------- */

    function posicionar() {
      if (modo === 'webxr') {
        if (!temHit) return false;
        pose.copy(mira.matrix);
      } else if (modo === 'camera') {
        poseNaFrente();
      } else {
        pose.identity();
      }
      posta = true; mira.visible = false; aplicarPose(); aoMudar();
      return true;
    }

    function soltar() { posta = false; aoMudar(); }

    function mudarEscala(fator) {
      escala = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escala * fator));
      if (posta) aplicarPose();
      aoMudar();
    }

    function girar(radianos) {
      giroY += radianos;
      if (posta) aplicarPose();
    }

    /* ---- quadro ------------------------------------------------------------- */

    function atualizar(dt, quadroXR) {
      if (modo === 'webxr' && quadroXR && fonteDeHit) {
        var hits = quadroXR.getHitTestResults(fonteDeHit);
        temHit = false;
        if (hits.length) {
          var p = hits[0].getPose(renderer.xr.getReferenceSpace());
          if (p) { mira.matrix.fromArray(p.transform.matrix); temHit = true; }
        }
        mira.visible = temHit && !posta;
      } else if (modo === 'camera') {
        if (orientacaoLigada && orientacaoRecebida) {
          quaternio.slerp(alvoQuaternio, Math.min(1, dt * 14));
          camera.quaternion.copy(quaternio);
          camera.position.set(0, 0, 0);
          camera.updateMatrixWorld(true);
        }
        mira.visible = false;
      }
    }

    function estado() {
      return { modo: modo, posta: posta, temHit: temHit, escala: escala,
        orientacao: orientacaoLigada && orientacaoRecebida, iOS: ehIOS() };
    }

    return {
      modosPossiveis: modosPossiveis, entrar: entrar, sair: sair, posicionar: posicionar,
      soltar: soltar, mudarEscala: mudarEscala, girar: girar, atualizar: atualizar,
      estado: estado, aplicarPose: aplicarPose, mira: mira,
      sessao: function () { return sessao; }
    };
  }

  global.ACMaquetteRA = { criar: criar, ehIOS: ehIOS, ESCALA_PADRAO: ESCALA_PADRAO };
})(typeof window !== 'undefined' ? window : globalThis);
