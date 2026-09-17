/* A maquete da Casa da Costa — a atividade.

   A cena não decide nada: ela mostra o que o motor (`ac-maquete-state.mjs`)
   deixou aquele papel ver e manda de volta os atos que o motor aceita. Duas
   consequências práticas, e as duas são de propósito:

   · quem tem a CHAVE nunca recebe a posição da fechadura — nem escondida no
     DOM, nem no snapshot. Ela simplesmente não chega ao aparelho dele;
   · quem tem a FECHADURA não consegue tocar em móvel nenhum: o raycast só
     roda para o lado da chave.

   A atividade só existe depois que a maquete está POSTA no ambiente. Antes
   disso a página é uma caixa fechada com um botão. */
(function () {
  'use strict';

  /* O import dinâmico do motor precisa de URL absoluta: num script clássico a
     base de `import()` não é a mesma do `<script src>` em todos os navegadores,
     e um caminho relativo cai em `js/js/` sem erro visível na leitura. */
  var MEU_SRC = (document.currentScript && document.currentScript.src) || location.href;
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var papel = params.get('papel') || 'luz';
  var solo = params.get('demo') === 'solo' && !params.has('sala');
  var reduzido = false;
  try { reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var motor = null, mundo = null, ra = null, poeira = null;
  var cena, camera, renderer, controles, chao;
  var coop = null, dados = null, online = false, movimento = null, movimentoEm = 0;
  var pendente = false, descartado = false, leituraInicio = null, leituraEnviada = false;
  var arrastando = false, terminando = false, vooDaChave = null, ultimoExaminado = null;
  var nivelAnterior = -1, prontoAnterior = null, concluidoEnviado = false, avisoTimer = null;
  var giroAtivo = null, toques = new Map(), pinca = 0, tocouEm = null;
  var planoDeArrasto = new THREE.Plane(), raio = new THREE.Raycaster(), ponto = new THREE.Vector3();
  var ultimoEnvio = 0, envioOcupado = false, envioPendente = null;
  var alturaAberta = 0.52, progressoDasCamadas = {};
  var farol = null, tempoAnterior = 0, desligar = [];

  function on(el, tipo, fn, opcoes) { if (!el) return; el.addEventListener(tipo, fn, opcoes); desligar.push(function () { el.removeEventListener(tipo, fn, opcoes); }); }
  function entrarAtividade() { if (window.ACJanelas) window.ACJanelas.entrarAtividade(); }
  function avisar(texto) {
    $('notice').textContent = texto; $('notice').style.display = 'block';
    clearTimeout(avisoTimer); avisoTimer = setTimeout(function () { $('notice').style.display = 'none'; }, 3600);
  }

  /* ---------- cena ---------- */

  function montarCena() {
    cena = new THREE.Scene();
    cena.background = new THREE.Color(0x091515);
    camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.01, 60);
    cena.add(camera);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    $('scene').appendChild(renderer.domElement);

    cena.add(new THREE.HemisphereLight(0xd9e6f2, 0x3b2e22, 1.05));
    var sol = new THREE.DirectionalLight(0xffeccd, 1.5);
    sol.position.set(-1.1, 2.0, 1.4); sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024); sol.shadow.camera.near = 0.05; sol.shadow.camera.far = 8;
    sol.shadow.camera.left = -1; sol.shadow.camera.right = 1; sol.shadow.camera.top = 1; sol.shadow.camera.bottom = -1;
    cena.add(sol);
    cena.add(new THREE.AmbientLight(0xffffff, 0.34));
    var fria = new THREE.DirectionalLight(0x9ec4dd, 0.55);
    fria.position.set(1.6, 1.2, -1.4); cena.add(fria);

    chao = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x08121a, roughness: 0.96 }));
    chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; cena.add(chao);
  }

  /* ---------- enquadramento da bancada ---------- */

  function enquadrar() {
    if (!mundo || !controles) return;
    var caixa = new THREE.Box3().setFromObject(mundo.raiz);
    var centro = caixa.getCenter(new THREE.Vector3());
    var raioEsfera = caixa.getSize(new THREE.Vector3()).length() / 2;
    var distancia = raioEsfera / Math.sin(camera.fov * Math.PI / 360);
    controles.target.copy(centro);
    camera.position.copy(centro).add(new THREE.Vector3(0.9, 0.85, 1.25).normalize().multiplyScalar(distancia * 1.05));
    controles.update();
  }

  /* ---------- camadas ---------- */

  function camadasAbertas() { return (dados && dados.camadasAbertas) || []; }

  function animarCamadas(dt) {
    var abertas = camadasAbertas();
    for (var i = 0; i < mundo.ordemDasCamadas.length; i++) {
      var nome = mundo.ordemDasCamadas[i], grupo = mundo.camadas[nome];
      var alvo = abertas.indexOf(nome) >= 0 ? 1 : 0;
      var atual = progressoDasCamadas[nome] || 0;
      atual = reduzido ? alvo : atual + (alvo - atual) * (1 - Math.exp(-dt * 3.2));
      if (Math.abs(alvo - atual) < 0.002) atual = alvo;
      progressoDasCamadas[nome] = atual;
      grupo.position.y = alturaAberta * atual;
      grupo.visible = atual < 0.985;
      if (atual > 0) aplicarTransparencia(grupo, 1 - atual);
      else if (grupo.userData.opaco !== true) aplicarTransparencia(grupo, 1);
    }
  }

  function aplicarTransparencia(grupo, opacidade) {
    grupo.userData.opaco = opacidade >= 1;
    grupo.traverse(function (o) {
      if (!o.isMesh || !o.material || o.userData.halo) return;
      if (o.material.userData && o.material.userData.anel) return;
      o.material.transparent = opacidade < 1;
      o.material.opacity = opacidade;
      o.material.depthWrite = opacidade >= 1;
    });
  }

  /* ---------- realces ---------- */

  function alvosAtivos() {
    if (!dados || dados.complete || !mundo) return [];
    var lista = [], ids = dados.candidatos || [];
    for (var i = 0; i < ids.length; i++) if (mundo.alvos[ids[i]]) lista.push(mundo.alvos[ids[i]]);
    return lista;
  }

  function podeExplorar() {
    return !!(online && dados && !dados.complete && dados.chaveiro === papelAtual() && dados.ready && posta());
  }
  function papelAtual() { return papel; }
  function posta() { return !!(ra && ra.estado().posta); }

  function pulso(t) { return 0.35 + 0.35 * Math.sin(t * 3.4); }

  function atualizarRealces(tempo) {
    if (!mundo) return;
    var ativos = alvosAtivos();
    var mostrarAlvos = podeExplorar() && dados && !dados.key;
    for (var id in mundo.alvos) {
      var a = mundo.alvos[id];
      var ligado = mostrarAlvos && ativos.indexOf(a) >= 0;
      a.halo.material.opacity = ligado ? pulso(tempo) : 0;
      a.halo.visible = ligado;
    }
    /* A fechadura só acende para quem NÃO tem a chave. O aparelho de quem tem
       a chave nem recebe o identificador dela. */
    var idFechadura = dados && dados.fechadura;
    for (var k = 0; k < mundo.ancoras.length; k++) {
      var anc = mundo.ancoras[k];
      var acesa = !!(idFechadura && anc.id === idFechadura && posta());
      anc.halo.material.opacity = acesa ? 0.45 + 0.35 * Math.sin(tempo * 2.6) : 0;
      anc.halo.visible = acesa;
      if (anc.peca && anc.peca.halo) { anc.peca.halo.material.opacity = acesa ? 0.30 : 0; anc.peca.halo.visible = acesa; }
    }
  }

  /* ---------- transporte ---------- */

  function enviar(tipo, extra) {
    if (!online || !coop || pendente) return Promise.resolve(false);
    pendente = true;
    return coop.send(tipo, extra || {}).catch(function () { avisar('Aguarde a reconexão da dupla.'); return false; })
      .then(function (r) { pendente = false; return r; }, function () { pendente = false; return false; });
  }

  function pontaLocal() {
    return mundo.raiz.worldToLocal(mundo.chavePonta.getWorldPosition(new THREE.Vector3())).toArray();
  }

  function publicarMovimento(forcar) {
    if (!coop || !podeExplorar() || !dados.key) return Promise.resolve(false);
    if (!forcar && (envioOcupado || performance.now() - ultimoEnvio < 100)) return Promise.resolve(false);
    if (forcar && envioPendente) { try { return envioPendente.catch(function () {}).then(function () { return publicarMovimento(true); }); } catch (e) {} }
    ultimoEnvio = performance.now(); envioOcupado = true;
    envioPendente = coop.send('maquete_mover', { tip: pontaLocal() });
    return envioPendente.catch(function () { return false; }).then(function (r) { envioOcupado = false; envioPendente = null; return r; });
  }

  function examinar(id) {
    if (!podeExplorar() || dados.key) return;
    entrarAtividade();
    ultimoExaminado = id;
    enviar('maquete_examinar', { object: id });
  }

  function encaixar() {
    if (terminando || !podeExplorar()) return;
    terminando = true;
    publicarMovimento(true).then(function (ok) {
      if (!ok) { terminando = false; return; }
      return enviar('maquete_encaixar').then(function (aceito) {
        if (!aceito) avisar('A ponta não chegou à fechadura. Peça ao colega para orientar.');
      });
    }).then(function () { terminando = false; poeira.resetTrail(); });
  }

  /* ---------- texto de tela ---------- */

  function textos() {
    var passo = $('step'), titulo = $('heading'), descricao = $('description');
    if (!posta()) {
      passo.textContent = 'A CAIXA FECHADA';
      titulo.textContent = 'Ponha a maquete na mesa.';
      descricao.textContent = 'A investigação começa quando a casa estiver apoiada à sua frente.';
      $('score').textContent = '';
      return;
    }
    if (!dados) {
      passo.textContent = 'A CAIXA FECHADA';
      titulo.textContent = 'Siga a pista da escrivaninha.';
      descricao.textContent = 'Encontre e registre a etiqueta com seu colega para liberar esta investigação.';
      return;
    }
    passo.textContent = dados.complete ? 'PERCURSO CONCLUÍDO' : 'Camada ' + (dados.evidence.length + 1) + ' de 3 · ' + dados.name;
    $('score').textContent = 'Camadas ' + dados.evidence.length + ' de 3 · ' + dados.score + ' pontos';
    if (dados.complete) {
      titulo.textContent = 'O espaço que faltava.';
      descricao.textContent = 'A maquete se abriu até o porão. A descoberta foi guardada.';
      return;
    }
    var temChave = dados.papel === 'chave';
    if (solo) {
      titulo.textContent = 'A próxima camada está presa.';
      descricao.textContent = !dados.ready
        ? 'Leia a anotação para saber onde a chave desta camada foi guardada.'
        : (dados.key ? 'A chave está na sua mão. Leve a ponta até ' + (dados.fechaduraNome || 'a fechadura') + '.'
          : 'Procure a chave: ' + (dados.clue || 'examine os detalhes desta camada.'));
      return;
    }
    if (temChave) {
      titulo.textContent = 'Você tem a chave.';
      descricao.textContent = !dados.ready ? 'Aguarde: seu colega está lendo a anotação desta camada.'
        : (dados.key ? 'A chave está na sua mão e você não vê a fechadura. Siga a voz do colega e leve a ponta até ela.'
          : 'Só você pode mexer nos móveis. Ouça onde a chave foi guardada e toque no detalhe.');
    } else {
      titulo.textContent = 'Você tem a fechadura.';
      descricao.textContent = !dados.ready ? 'Segure o manuscrito para ler a anotação desta camada.'
        : (dados.key ? 'Você vê a fechadura e a ponta da chave do colega. Diga a ele para onde ir.'
          : 'Diga ao colega, em voz alta, onde a chave foi guardada. Só ele pode tocar nos móveis.');
    }
  }

  function pintarTela() {
    var pronto = posta();
    $('portal').hidden = pronto;
    document.body.classList.toggle('maquete-posta', pronto);
    textos();
    var temDados = !!dados && !dados.complete;
    var temChave = temDados && dados.papel === 'chave';
    /* O manuscrito é do lado da FECHADURA. No Solo o papel vira sozinho depois
       da leitura, e com ele o manuscrito sai de cena. */
    $('manuscript').hidden = !(pronto && temDados && dados.papel === 'fechadura');
    $('clue').textContent = dados && dados.ready ? (dados.clue || 'Oriente seu colega em voz alta.')
      : 'Segure este manuscrito para ler a anotação desta camada.';
    document.body.dataset.roleMode = !temDados ? 'complete' : (temChave ? 'explorer' : 'guide');
    document.body.classList.toggle('investigating', !!(dados && (dados.ready || dados.level > 0)));
    $('alternative').hidden = !(podeExplorar() && dados && !dados.key);
    $('reposition').hidden = !pronto || (ra && ra.estado().modo === 'mesa');
    $('key-grip').hidden = !(podeExplorar() && dados && dados.key);
    if (mundo) mundo.chave.visible = !!(dados && dados.key && temChave && pronto);
    var acao = $('solo-action');
    acao.hidden = !solo || !pronto || !temDados;
    acao.disabled = !online;
    if (solo && temDados) acao.textContent = !dados.ready ? 'Ler a anotação' : (dados.key ? 'Levar a chave à fechadura' : 'Examinar por nome');
    if (!online && pronto) $('description').textContent = 'A dupla precisa estar conectada para continuar. O progresso está guardado.';
  }

  /* ---------- toques na cena ---------- */

  function objetoVisivel(o) { for (var n = o; n; n = n.parent) if (!n.visible) return false; return true; }

  function cameraAgora() {
    if (ra && ra.estado().modo === 'webxr' && renderer.xr.isPresenting) {
      var c = renderer.xr.getCamera(camera);
      return (c.cameras && c.cameras[0]) || c;
    }
    return camera;
  }

  function tocarNaCena(x, y) {
    if (!posta()) { ra.posicionar(); pintarTela(); return; }
    if (!podeExplorar() || dados.key) return;
    var alvos = alvosAtivos(); if (!alvos.length) return;
    raio.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, 1 - y / innerHeight * 2), cameraAgora());
    var grupos = alvos.map(function (a) { return a.grupo; });
    var acertos = raio.intersectObjects(grupos, true).filter(function (h) { return objetoVisivel(h.object); });
    if (!acertos.length) return;
    var primeiro = acertos[0];
    /* Um alvo atrás de uma parede não conta: sem isto, tocar na fachada
       acertaria o armário que está do outro lado dela. */
    var todos = raio.intersectObject(mundo.raiz, true).filter(function (h) {
      return objetoVisivel(h.object) && !h.object.userData.halo && h.object !== mundo.chave;
    });
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].distance < primeiro.distance - 0.0015 && !pertenceAAlvo(todos[i].object)) return;
    }
    var dono = primeiro.object;
    while (dono && !dono.userData.object) dono = dono.parent;
    if (dono && dono.userData.object) examinar(dono.userData.object);
  }

  function pertenceAAlvo(o) { for (var n = o; n; n = n.parent) if (n.userData && n.userData.object) return true; return false; }

  /* ---------- gestos ---------- */

  function ligarGestos() {
    var tela = renderer.domElement;
    on(tela, 'pointerdown', function (e) {
      if (!ra || !mundo) return;
      toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (toques.size === 1) { tocouEm = { x: e.clientX, y: e.clientY, t: performance.now() }; giroAtivo = { x: e.clientX }; }
      if (toques.size === 2) { pinca = distanciaEntreToques(); giroAtivo = null; tocouEm = null; }
      try { tela.setPointerCapture(e.pointerId); } catch (err) {}
    });
    on(tela, 'pointermove', function (e) {
      if (!ra || !toques.has(e.pointerId)) return;
      toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (toques.size === 2) {
        var d = distanciaEntreToques();
        if (pinca > 0 && ra.estado().modo !== 'mesa') ra.mudarEscala(d / pinca);
        pinca = d; tocouEm = null; return;
      }
      if (giroAtivo && ra.estado().modo !== 'mesa' && posta()) {
        var dx = e.clientX - giroAtivo.x;
        if (Math.abs(dx) > 0.5) { ra.girar(dx * 0.006); giroAtivo.x = e.clientX; }
        if (tocouEm && Math.hypot(e.clientX - tocouEm.x, e.clientY - tocouEm.y) > 9) tocouEm = null;
      }
    });
    ['pointerup', 'pointercancel'].forEach(function (tipo) {
      on(tela, tipo, function (e) {
        if (!ra) return;
        toques.delete(e.pointerId); if (toques.size < 2) pinca = 0;
        if (toques.size === 0) giroAtivo = null;
        if (tipo === 'pointerup' && tocouEm && performance.now() - tocouEm.t < 900 &&
            Math.hypot(e.clientX - tocouEm.x, e.clientY - tocouEm.y) <= 9) tocarNaCena(e.clientX, e.clientY);
        if (toques.size === 0) tocouEm = null;
      });
    });
  }

  function distanciaEntreToques() {
    var v = Array.from(toques.values());
    if (v.length < 2) return 0;
    return Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y);
  }

  /* ---------- arrasto da chave ---------- */

  function ligarChave() {
    var pega = $('key-grip');
    on(pega, 'pointerdown', function (e) {
      if (!podeExplorar() || !dados.key || vooDaChave || terminando) return;
      e.preventDefault(); arrastando = true;
      poeira.resetTrail(); poeira.trace(mundo.chave.position);
      if (controles) controles.enabled = false;
      try { pega.setPointerCapture(e.pointerId); } catch (err) {}
      /* O plano do arrasto passa pela fechadura: resolve a PROFUNDIDADE para
         quem não pode vê-la, e deixa a orientação do colega valer em duas
         dimensões — que é o que dá para dizer em voz alta. */
      var deslocamento = mundo.chavePonta.getWorldPosition(new THREE.Vector3()).sub(mundo.chave.getWorldPosition(new THREE.Vector3()));
      var alvoMundo = mundo.raiz.localToWorld(vetorDaFechadura()).sub(deslocamento);
      planoDeArrasto.setFromNormalAndCoplanarPoint(cameraAgora().getWorldDirection(new THREE.Vector3()), alvoMundo);
    });
    on(pega, 'pointermove', function (e) {
      if (!arrastando) return;
      raio.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, 1 - e.clientY / innerHeight * 2), cameraAgora());
      if (raio.ray.intersectPlane(planoDeArrasto, ponto)) mundo.chave.position.copy(mundo.raiz.worldToLocal(ponto.clone()));
      poeira.trace(mundo.chave.position);
      publicarMovimento(false);
    });
    ['pointerup', 'pointercancel'].forEach(function (tipo) {
      on(pega, tipo, function (e) {
        if (!arrastando) return;
        arrastando = false;
        if (controles) controles.enabled = ra.estado().modo === 'mesa';
        try { pega.releasePointerCapture(e.pointerId); } catch (err) {}
        if (tipo === 'pointerup') encaixar(); else poeira.resetTrail();
      });
    });
    on(pega, 'keydown', function (e) {
      if (!podeExplorar() || !dados.key || terminando) return;
      var passo = { ArrowLeft: [-0.006, 0, 0], ArrowRight: [0.006, 0, 0], ArrowUp: [0, 0.006, 0], ArrowDown: [0, -0.006, 0], PageUp: [0, 0, -0.006], PageDown: [0, 0, 0.006] }[e.key];
      if (passo) { e.preventDefault(); mundo.chave.position.add(new THREE.Vector3(passo[0], passo[1], passo[2])); poeira.trace(mundo.chave.position); publicarMovimento(false); }
      if (e.key === 'Enter') { e.preventDefault(); encaixar(); }
    });
  }

  /* A posição da fechadura do capítulo corrente, no espaço do modelo. Quem tem
     a chave NÃO recebe esse identificador; nesse caso o plano do arrasto passa
     pelo centro da maquete, que é neutro. */
  function vetorDaFechadura() {
    var i = dados ? dados.level : 0;
    if (motor && motor.FECHADURAS[i]) return new THREE.Vector3().fromArray(motor.FECHADURAS[i]);
    return new THREE.Vector3(0, 0.5, 0);
  }

  /* ---------- laço ---------- */

  function desenhar(tempo, quadroXR) {
    if (descartado) return;
    var dt = Math.min(0.1, (tempo - tempoAnterior) / 1000 || 0);
    tempoAnterior = tempo;
    if (ra) { ra.atualizar(dt, quadroXR); chao.visible = ra.estado().modo === 'mesa'; }
    if (controles && ra && ra.estado().modo === 'mesa') controles.update();
    if (mundo) {
      animarCamadas(dt);
      atualizarRealces(tempo / 1000);
      if (leituraInicio !== null && !leituraEnviada && dados && !dados.ready && online) {
        var quanto = Math.min(1, (tempo - leituraInicio) / 1000);
        $('reading').firstElementChild.style.width = quanto * 100 + '%';
        if (quanto === 1) { leituraEnviada = true; enviar('maquete_orientar').then(function (ok) { if (!ok) leituraEnviada = false; }); }
      } else if (!dados || !dados.ready) { $('reading').firstElementChild.style.width = '0'; }
      if (vooDaChave) {
        vooDaChave.t += dt; var t = Math.min(1, vooDaChave.t / 0.7), s = t * t * (3 - 2 * t);
        mundo.chave.position.copy(vooDaChave.de).lerp(vooDaChave.para, s);
        mundo.chave.position.y += Math.sin(Math.PI * t) * 0.04;
        if (t === 1) vooDaChave = null;
      }
      poeira.update(dt, mundo.chave.visible && podeExplorar() && (arrastando || vooDaChave) ? mundo.chave.position : null, innerHeight * renderer.getPixelRatio());
      posicionarPega();
      atualizarFarol(tempo);
      if (mundo.chave.visible && podeExplorar() && !vooDaChave && !terminando && arrastando) publicarMovimento(false);
    }
    renderer.render(cena, camera);
  }

  function posicionarPega() {
    var pega = $('key-grip');
    if (!mundo.chave.visible) return;
    mundo.raiz.updateMatrixWorld(true);
    var tela = mundo.chave.getWorldPosition(new THREE.Vector3()).project(cameraAgora());
    pega.style.left = (tela.x + 1) * innerWidth / 2 + 'px';
    pega.style.top = (1 - tela.y) * innerHeight / 2 + 'px';
    pega.hidden = !!vooDaChave || !podeExplorar() || !dados || !dados.key || tela.z < -1 || tela.z > 1;
  }

  function atualizarFarol(tempo) {
    var guiando = dados && !dados.complete && dados.papel === 'fechadura';
    var fresco = movimento && performance.now() - movimentoEm + (movimento.age || 0) < 1500;
    farol.visible = !!(guiando && dados.key && fresco && online && posta());
    $('alignment').hidden = !guiando || !dados.key;
    if (farol.visible) {
      farol.position.fromArray(movimento.tip);
      var d = farol.position.distanceTo(vetorDaFechadura());
      $('alignment').textContent = d < motor.TOLERANCIA ? 'A ponta está na fechadura. Diga a ele para soltar.'
        : d < 0.10 ? 'A ponta está perto. Ajuste o último palmo.'
          : 'O ponto de luz é a ponta da chave do colega. Leve-o até a fechadura.';
    } else if (guiando && dados && dados.key) {
      $('alignment').textContent = 'Aguarde: a ponta da chave aparece quando seu colega a mover.';
    }
  }

  /* ---------- portal de entrada ---------- */

  function montarPortal() {
    ra.modosPossiveis(function (modos) {
      $('portal-ra').hidden = !modos.webxr;
      $('portal-camera').hidden = !modos.camera || modos.webxr;
      $('portal-aviso').textContent = modos.webxr ? ''
        : modos.camera ? 'Este aparelho não faz rastreio de superfície. A casa vai aparecer sobre a imagem da câmera e você a gira com um dedo.'
          : 'Sem câmera disponível neste navegador. A maquete abre numa bancada e a investigação continua igual.';
    });
    on($('portal-ra'), 'click', function () { abrir('webxr'); });
    on($('portal-camera'), 'click', function () { abrir('camera'); });
    on($('portal-mesa'), 'click', function () { abrir('mesa'); });
    on($('reposition'), 'click', function () { ra.soltar(); pintarTela(); });
  }

  function abrir(modo) {
    entrarAtividade();
    $('portal-aviso').textContent = 'Preparando…';
    ra.entrar(modo).then(function (qual) {
      $('portal-aviso').textContent = '';
      if (qual === 'mesa') {
        var e = ra.estado();
        ra.mudarEscala(1 / e.escala);
        ra.posicionar();
        controles.enabled = true;
        enquadrar();
      }
      pintarTela();
    }).catch(function (erro) {
      $('portal-aviso').textContent = modo === 'camera'
        ? 'A câmera não foi liberada. Você pode continuar sem ela.'
        : 'A realidade aumentada não abriu neste aparelho. Você pode continuar sem ela.';
      if (erro && erro.name === 'NotAllowedError') $('portal-camera').textContent = 'Tentar a câmera de novo';
    });
  }

  /* ---------- ligação com o motor ---------- */

  function receber(snapshot) {
    if (snapshot.soloRole) papel = snapshot.soloRole;
    movimento = snapshot.keyMotion; movimentoEm = performance.now();
    var antes = dados, estavaOnline = online;
    dados = snapshot.maquete;
    var papeis = (snapshot.percurso && snapshot.percurso.fragmento && snapshot.percurso.fragmento.membros.map(function (m) { return m.papel; })) || ['luz', 'conhecimento'];
    online = papeis.every(function (r) { return snapshot.online.indexOf(r) >= 0; });
    $('coop-status').textContent = online ? 'Dupla conectada' : 'Aguardando seu colega';

    if (antes && dados && dados.mistakes > antes.mistakes) avisar('Não era este. Conversem outra vez antes de tentar.');
    if (antes && dados && dados.level > antes.level) {
      vooDaChave = null; poeira.resetTrail();
      poeira.burst(vetorDaFechaduraDe(antes.level));
      if (!dados.complete) avisar(capituloFechado(antes.level));
      leituraEnviada = false; leituraInicio = null;
    }
    if (antes && dados && !antes.key && dados.key && dados.papel === 'chave') {
      var origem = mundo && mundo.alvos[ultimoExaminado] ? mundo.alvos[ultimoExaminado].centro.clone() : new THREE.Vector3(0, 0.55, 0.2);
      var camada = mundo && mundo.alvos[ultimoExaminado] ? mundo.camadas[mundo.alvos[ultimoExaminado].camada] : null;
      if (camada) origem = origem.clone().add(new THREE.Vector3(0, camada.position.y, 0));
      poeira.burst(origem); poeira.resetTrail();
      var pouso = origem.clone().add(new THREE.Vector3(0, 0.06, 0.04));
      if (reduzido) mundo.chave.position.copy(pouso);
      else { mundo.chave.position.copy(origem); vooDaChave = { de: origem.clone(), para: pouso, t: 0 }; }
    }
    if (dados && dados.level !== nivelAnterior) { nivelAnterior = dados.level; leituraEnviada = false; }
    if (!antes || estavaOnline !== online || JSON.stringify(antes) !== JSON.stringify(dados)) pintarTela();
    if (dados && dados.complete && !concluidoEnviado) {
      concluidoEnviado = true;
      $('final-score').textContent = '3 camadas · ' + dados.score + ' pontos. Nenhuma acusação foi concluída.';
      try { $('discovery').showModal(); } catch (e) {}
      if (params.get('demo') === 'solo') {
        try { parent.postMessage({ mosaico: 'ac-solo-maquete-completa', score: dados.score, evidence: dados.evidence }, location.origin); } catch (e) {}
      }
    }
  }

  function vetorDaFechaduraDe(nivel) {
    if (motor && motor.FECHADURAS[nivel]) return new THREE.Vector3().fromArray(motor.FECHADURAS[nivel]);
    return new THREE.Vector3(0, 0.5, 0);
  }
  function capituloFechado(nivel) {
    return (motor && motor.CAPITULOS[nivel] && motor.CAPITULOS[nivel].fecho) || 'A camada se soltou.';
  }

  /* ---------- botões ---------- */

  function ligarBotoes() {
    on($('manuscript'), 'pointerdown', function (e) {
      if (!online || !dados || dados.ready || dados.papel !== 'fechadura') return;
      entrarAtividade(); e.preventDefault(); leituraInicio = performance.now();
      try { $('manuscript').setPointerCapture(e.pointerId); } catch (err) {}
    });
    ['pointerup', 'pointercancel', 'blur'].forEach(function (t) { on($('manuscript'), t, function () { leituraInicio = null; }); });
    on($('manuscript'), 'keydown', function (e) {
      if (e.key === 'Enter' && !e.repeat) { entrarAtividade(); e.preventDefault(); enviar('maquete_orientar'); }
      else if (e.key === ' ' && !e.repeat) { entrarAtividade(); e.preventDefault(); leituraInicio = performance.now(); }
    });
    on($('manuscript'), 'keyup', function () { leituraInicio = null; });

    on($('alternative'), 'click', function () { abrirListaDeObjetos(); });
    on($('solo-action'), 'click', function () {
      if (!solo || !dados || dados.complete) return;
      entrarAtividade();
      if (!dados.ready) { enviar('maquete_orientar'); return; }
      if (!dados.key) { abrirListaDeObjetos(); return; }
      mundo.chave.position.copy(vetorDaFechadura()).sub(new THREE.Vector3().fromArray(pontaRelativa()));
      publicarMovimento(true).then(function (ok) { if (ok) enviar('maquete_encaixar'); });
    });
    on($('help'), 'click', function (ev) {
      if (window.ACJanelas) { window.ACJanelas.ajuda(ev); return; }
      try { $('instructions').showModal(); } catch (e) {}
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (el) {
      on(el, 'click', function () { var d = el.closest('dialog'); if (d) { try { d.close(); } catch (e) {} } if (window.ACJanelas) window.ACJanelas.recolher(); });
    });
  }

  function pontaRelativa() {
    mundo.raiz.updateMatrixWorld(true);
    var ponta = mundo.raiz.worldToLocal(mundo.chavePonta.getWorldPosition(new THREE.Vector3()));
    return ponta.sub(mundo.chave.position).toArray();
  }

  function abrirListaDeObjetos() {
    if (!dados || !dados.candidatos) return;
    var capitulo = motor.CAPITULOS[dados.level];
    /* Sorteado por partida: escrita à mão, esta lista nasceria com o
       esconderijo em primeiro lugar em todos os capítulos. */
    var ordem = motor.ordemDosCandidatos(capitulo, semente());
    var caixa = $('object-list'); caixa.textContent = '';
    ordem.forEach(function (id) {
      var b = document.createElement('button');
      b.textContent = (dados.rotulos && dados.rotulos[id]) || id;
      b.onclick = function () { examinar(id); try { $('objects').close(); } catch (e) {} };
      caixa.appendChild(b);
    });
    try { $('objects').showModal(); } catch (e) {}
  }

  function semente() { return params.get('sala') || params.get('run') || 'AC-COSTA'; }

  /* ---------- partida ---------- */

  function comecar() {
    montarCena();
    ligarGestos(); ligarChave(); ligarBotoes();

    var voltar = new URLSearchParams(location.search); voltar.set('rever', '1');
    $('return-desk').href = 'AC-escrivaninha.html?' + voltar;

    import(new URL('ac-maquete-state.mjs', MEU_SRC).href).then(function (m) {
      motor = m;
      return new Promise(function (ok, falha) {
        ACMaquetteMundo.carregar({ pontos: m.FECHADURAS }, ok, falha);
      });
    }).then(function (m) {
      mundo = m;
      cena.add(mundo.raiz);
      /* A poeira mora DENTRO da maquete: assim acompanha escala, giro e pose
         sem nenhuma conversão de coordenadas. */
      poeira = createACGoldDust(mundo.raiz, { reduced: reduzido });
      farol = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe3a1 }));
      farol.visible = false; farol.userData.exportExclude = true; farol.raycast = function () {};
      mundo.raiz.add(farol);
      mundo.chave.visible = false;

      controles = new THREE.OrbitControls(camera, renderer.domElement);
      controles.enableDamping = true; controles.minDistance = 0.12; controles.maxDistance = 14;
      controles.maxPolarAngle = Math.PI * 0.495; controles.enabled = false;

      ra = ACMaquetteRA.criar({ renderer: renderer, cena: cena, camera: camera, raiz: mundo.raiz, baseY: mundo.baseY, aoMudar: aoMudarRA });
      montarPortal();
      $('portal-titulo').textContent = 'Ponha a maquete na sua mesa.';
      $('portal-texto').textContent = 'A caixa veio fechada. Procure uma superfície plana e apoie a casa nela.';
      habilitarPortal(true);
      ligarCooperacao();
      pintarTela();
      renderer.setAnimationLoop(desenhar);
      window.__maquete = { mundo: mundo, ra: ra, motor: motor, estado: function () { return dados; },
        quadro: function () { desenhar(performance.now(), null); } };
    }).catch(function (erro) {
      $('portal-aviso').textContent = 'A maquete não pôde ser carregada. ' + (erro && erro.message ? erro.message : '');
      $('description').textContent = 'A maquete não pôde ser carregada neste aparelho.';
    });
  }

  function habilitarPortal(ligado) {
    ['portal-ra', 'portal-camera', 'portal-mesa'].forEach(function (id) { $(id).disabled = !ligado; });
  }

  function aoMudarRA() {
    var e = ra.estado();
    $('pousar').hidden = !(e.modo === 'webxr' && !e.posta);
    $('pousar').textContent = e.temHit ? 'Toque no círculo para apoiar a casa.' : 'Aponte devagar para uma superfície plana.';
    if (e.modo === 'camera' && !e.posta) { $('pousar').hidden = false; $('pousar').textContent = 'Toque na tela para apoiar a casa à sua frente.'; }
    if (controles) controles.enabled = e.modo === 'mesa' && e.posta;
    pintarTela();
  }

  function ligarCooperacao() {
    ACCooperation(receber, function (ligado) {
      if (!ligado) { online = false; $('coop-status').textContent = 'Reconectando…'; pintarTela(); }
    }, { maquette: true }).then(function (c) {
      coop = c;
      if (c.demo) c.send('iniciar_maquete');
      if (params.get('percurso') === '1') { var marca = document.querySelector('.brand'); if (marca) marca.removeAttribute('href'); }
      if (c.invite) { $('invite').href = c.invite; $('invite').hidden = false; }
    }).catch(function (e) { $('description').textContent = e.message; });
  }

  on(window, 'resize', function () {
    if (!camera || !renderer) return;
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (ra && ra.estado().modo === 'mesa' && ra.estado().posta) enquadrar();
  });
  on(document, 'visibilitychange', function () { leituraInicio = null; });
  on(window, 'pagehide', function (e) {
    if (e.persisted) { renderer.setAnimationLoop(null); return; }
    descartado = true;
    if (poeira) poeira.dispose();
    clearTimeout(avisoTimer);
    if (coop) coop.close();
    if (ra) ra.sair();
    desligar.forEach(function (fn) { fn(); });
    if (controles) controles.dispose();
    renderer.setAnimationLoop(null);
    renderer.dispose();
  });

  comecar();
})();
