/* O Impostor — o relógio de caixa alta, com a mão (revisão 2, Cap. 3).

   Substitui ra/relogio-chave_SUBSTITUIDO.js (Mario, 30/09/2026): na revisão 2
   o relógio não tem chave nem lacre, a gaveta de pesos está VAZIA no Cap. 3
   (o papel só cai nela no apagão, Cap. 5) e o gesto do capítulo é o pêndulo.

   Quem mexe depende do papel (Mario, 30/09):
   · modo=parar   — a Herdeira jogada por gente. A porta de vidro está só
                    encostada; aberta, segurar o pêndulo com o dedo faz o
                    balanço morrer e o trinco estalar. Avisa a mesa.
   · modo=religar — quem religa, jogado por gente. Puxar o pêndulo de lado e
                    soltar: ele volta a balançar e o trinco trava de novo.
   · modo=ver     — todos os outros. Só olham: "Nada se move sem ata."
   estado=andando | parado | religado diz como o relógio está quando abre.
   A gaveta de pesos corre no trilho em todos os modos, e está vazia.

   Os ponteiros mostram a hora do relógio, quatro minutos adiantado: parado
   em 20h16 (parou por volta de 20h12); religado e acertado, 20h21. Nunca
   21h34, que é a hora do Cap. 5.

   Fala com a mesa por postMessage: {oi:'relogio', evento:'pronto'|'porta'|'parou'|'religou'}.
   A mesa muda o modo/estado com {oi:'mesa', relogio:true, modo, estado}. */
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search), EMBED = Q.get('embed') === '1';
  var A0 = 0.07, W = Math.PI, CURSO = 0.16;      /* amplitude (rad), 2 s de período, curso da gaveta */
  var modo = Q.get('modo') || 'parar';
  var estado = Q.get('estado') || (modo === 'parar' ? 'andando' : 'parado');

  var b = OIBase.criar({
    vista: { alvo: [0, 0.95, 0], dist: 2.3, distRetrato: 3.3 },
    alturaDoAparelho: 1.35, miraEscala: 3,
    textoMira: 'Aponte para o chão, onde o relógio ficaria, e toque em Pôr aqui.',
    textoInicio: 'O relógio de caixa alta.',
    deNovo: deNovo
  });

  var relogio, pendulo, portaLonga, gaveta, puxador, lingueta, ph, pm, ps;
  var gav0 = new THREE.Vector3(), ling0 = new THREE.Vector3(), abertura = 0;
  var Q_FECHADA = new THREE.Quaternion(), Q_ABERTA = new THREE.Quaternion(0, -0.766, 0, 0.643);
  var portaAberta = false, animPorta = null;
  var A = 0, fase = 0, segurando = false, tSeg = 0, puxando = false, anguloPuxado = 0, x0 = 0, travarEm = -1;
  var segundos = 40;

  b.carregar(['modelos/relogio_caixa_alta_v2.glb']).then(function (r) {
    relogio = r[0].scene; b.raiz.add(relogio);
    /* o que não é deste capítulo não aparece */
    ['lacre_porta_a', 'lacre_porta_b', 'lacre_gaveta_a', 'lacre_gaveta_b',
     'estado_D_papel_gaveta', 'estado_C_risco_assoalho', 'estado_C_poeira_deslocada'].forEach(function (n) {
      var o = relogio.getObjectByName(n); if (o) o.visible = false;
    });
    pendulo = relogio.getObjectByName('pendulo');
    portaLonga = relogio.getObjectByName('porta_longa'); Q_FECHADA.copy(portaLonga.quaternion);
    gaveta = relogio.getObjectByName('gaveta'); gav0.copy(gaveta.position);
    puxador = relogio.getObjectByName('puxador_concha');
    lingueta = relogio.getObjectByName('trinco_lingueta'); ling0.copy(lingueta.position);
    ph = relogio.getObjectByName('ponteiro_horas'); pm = relogio.getObjectByName('ponteiro_minutos');
    ps = relogio.getObjectByName('ponteiro_segundos');
    aplicar(modo, estado); avisar('pronto');          /* a mesa responde com o estado atual */
    pegaDaPorta(); pegaDoPendulo(); pegaDaGaveta();
    b.aCadaQuadro(quadro);
    b.comecar();
  }).catch(function (e) { b.estado('O modelo não carregou: ' + (e && e.message || e)); });

  function centro(o) { return new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()); }
  function avisar(evento) {
    try { if (parent !== window) parent.postMessage({ oi: 'relogio', evento: evento }, location.origin); } catch (e) {}
  }

  /* ---------------- como o relógio está ---------------- */
  function hora(h, m) {
    ph.rotation.set(0, 0, -2 * Math.PI * ((h % 12) + m / 60) / 12);
    pm.rotation.set(0, 0, -2 * Math.PI * m / 60);
  }
  function trinco(solto) { lingueta.position.copy(ling0); if (solto) lingueta.position.x += 0.006; }
  function aplicar(m, e) {
    modo = m; estado = e;
    segurando = false; puxando = false; travarEm = -1; animPorta = null;
    if (e === 'andando') {
      portaAberta = false; portaLonga.quaternion.copy(Q_FECHADA);
      A = A0; trinco(false); hora(20, 16);
    } else if (e === 'parado') {
      portaAberta = true; portaLonga.quaternion.copy(Q_ABERTA);
      A = 0; pendulo.rotation.set(0, 0, 0); trinco(true); hora(20, 16); segundos = 40;
    } else {                                      /* religado */
      portaAberta = true; portaLonga.quaternion.copy(Q_ABERTA);
      A = A0; trinco(false); hora(20, 21);
    }
    b.mostrarDeNovo(false);
  }

  function quadro(dt) {
    if (animPorta) animPorta(dt);
    /* o balanço */
    if (segurando) {
      tSeg += dt; A = Math.max(0, A - dt * 0.16);
      if (A === 0 && tSeg >= 0.8) parou();
    } else if (!puxando && estado !== 'parado' && A < A0) A = Math.min(A0, A + dt * 0.05);
    if (!puxando) { fase += dt * W; pendulo.rotation.set(0, 0, A * Math.sin(fase)); }
    if (travarEm >= 0) { travarEm -= dt; if (travarEm < 0) religou(); }
    /* o ponteiro dos segundos só anda com o pêndulo */
    if (A > 0.01 && estado !== 'parado') { segundos = (segundos + dt) % 60; }
    ps.rotation.set(0, 0, -2 * Math.PI * Math.floor(segundos) / 60);
  }

  /* ---------------- a porta de vidro (só encostada) ---------------- */
  function pegaDaPorta() {
    b.pega({
      rotulo: 'Porta de vidro',
      alvo: function () { return portaLonga; },
      ancora: function () { return centro(portaLonga); },
      ativa: function () { return !portaAberta && !animPorta; },
      fim: function (x, y, cancelou) { if (!cancelou) abrirPorta(); }
    });
  }
  function abrirPorta() {
    var t = 0;
    animPorta = function (dt) {
      t += dt;
      portaLonga.quaternion.copy(Q_FECHADA).slerp(Q_ABERTA, b.suave(t / 0.8));
      if (t >= 0.8) { animPorta = null; portaAberta = true; b.vibrar(12); avisar('porta'); if (!EMBED) b.mostrarDeNovo(true); }
    };
  }

  /* ---------------- o pêndulo ---------------- */
  function pegaDoPendulo() {
    b.pega({
      rotulo: 'Pêndulo',
      alvo: function () { return pendulo; },
      ancora: function () { return centro(relogio.getObjectByName('pendulo_lente')); },
      ativa: function () { return portaAberta && !animPorta && travarEm < 0; },
      inicio: function (x) {
        if (modo === 'parar' && estado === 'andando') { segurando = true; tSeg = 0; b.estado(''); return; }
        if (modo === 'religar' && estado === 'parado') { puxando = true; x0 = x; anguloPuxado = 0; b.estado(''); return; }
        b.estado(modo === 'ver' ? '"Nada se move sem ata."' : (estado === 'parado' ? 'O pêndulo está parado.' : 'O pêndulo balança.'));
      },
      mover: function (x) {
        if (!puxando) return;
        anguloPuxado = Math.max(-0.12, Math.min(0.12, (x - x0) / 220 * 0.15));
        pendulo.rotation.set(0, 0, anguloPuxado);
      },
      fim: function () {
        if (segurando) { segurando = false; if (estado === 'andando') b.estado(''); return; }
        if (!puxando) return;
        puxando = false;
        if (Math.abs(anguloPuxado) < 0.03) { pendulo.rotation.set(0, 0, 0); anguloPuxado = 0; return; }
        /* solto de lado: começa a balançar a partir de onde o dedo deixou */
        A = Math.abs(anguloPuxado); fase = anguloPuxado > 0 ? Math.PI / 2 : -Math.PI / 2;
        estado = 'religado'; travarEm = 1.2;
      }
    });
  }
  function parou() {
    segurando = false; A = 0; estado = 'parado'; trinco(true);
    b.vibrar([30, 40, 90]);
    b.estado('Um estalo seco. Metálico. Do fundo do móvel.');
    avisar('parou');
    if (!EMBED) b.mostrarDeNovo(true);
  }
  function religou() {
    travarEm = -1; trinco(false); hora(20, 21);
    b.vibrar([15, 30, 25]);
    b.estado('Outro estalo, menor, de coisa que se tranca.');
    avisar('religou');
    if (!EMBED) b.mostrarDeNovo(true);
  }

  /* ---------------- a gaveta de pesos (vazia) ---------------- */
  function pegaDaGaveta() {
    var inicioAbertura = 0, ancora = null, eixo = null;
    function noTrilho(x, y) {
      var olhar = b.cameraAgora().getWorldDirection(new THREE.Vector3());
      var normal = olhar.clone().sub(eixo.clone().multiplyScalar(olhar.dot(eixo)));
      if (normal.lengthSq() < 1e-6) return null;
      normal.normalize();
      var p = b.dedoNoPlano(x, y, new THREE.Plane().setFromNormalAndCoplanarPoint(normal, ancora));
      return p ? p.sub(ancora).dot(eixo) / b.escala() : null;
    }
    b.pega({
      rotulo: 'Puxador da gaveta',
      alvo: function () { return gaveta; },
      ancora: function () { return centro(puxador); },
      ativa: function () { return !animPorta; },
      inicio: function () {
        inicioAbertura = abertura; ancora = centro(puxador);
        eixo = new THREE.Vector3(0, 0, 1).transformDirection(gaveta.parent.matrixWorld);
      },
      mover: function (x, y) {
        var v = noTrilho(x, y); if (v === null) return;
        abertura = Math.min(CURSO, Math.max(0, inicioAbertura + v));
        gaveta.position.copy(gav0).add(new THREE.Vector3(0, 0, abertura));
      },
      fim: function () { if (abertura >= CURSO - 0.005) b.vibrar(15); }
    });
  }

  function deNovo() {                               /* só no laboratório (fora do jogo) */
    abertura = 0; gaveta.position.copy(gav0);
    aplicar(modo, modo === 'parar' ? 'andando' : 'parado');
    b.estado('O relógio de caixa alta.');
  }

  addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.oi !== 'mesa' || !e.data.relogio || !relogio) return;
    aplicar(e.data.modo || modo, e.data.estado || estado);
  });

  window.OIRelogio = {
    portaNaTela: function () { return b.naTela(centro(portaLonga)); },
    penduloNaTela: function () { return b.naTela(centro(relogio.getObjectByName('pendulo_lente'))); },
    puxadorNaTela: function () { return b.naTela(centro(puxador)); },
    portaAberta: function () { return portaAberta; }, estado: function () { return estado; },
    modo: function () { return modo; }, amplitude: function () { return A; }, abertura: function () { return abertura; },
    papelVisivel: function () { return relogio.getObjectByName('estado_D_papel_gaveta').visible; }
  };
})();
