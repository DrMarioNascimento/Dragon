/* MOSAICO · paisagem da abertura — a casa vista da costa, à noite.
   Não é a maquete. Não tem chave, piso nem RA. Um palco atrás da narração:
   órbita curta com um dedo, toque na porta para entrar. */
(function (global) {
  'use strict';

  const AQUI = new URL('.', document.currentScript.src);
  const url = (p) => new URL(p, AQUI).href;
  const THREE_SRC = url('three.min.js');
  const LOADER_SRC = url('vendor/GLTFLoader.js');
  const CONTROLS_SRC = url('vendor/OrbitControls.js');

  const PORTA = /porta|portao|portão/i;
  const CENARIO = /terreno|terra-batida|borda|estrato|rochedo|poca|poça|agua|água|foam|mar|estrada|sulco|pedra-solta|moita|gravel/i;

  let disposed = false;
  let renderer, scene, camera, controls, raf, root, hint;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (src.indexOf('three.min') >= 0 && global.THREE && global.THREE.WebGLRenderer) {
        resolve(); return;
      }
      if (src.indexOf('GLTFLoader') >= 0 && global.THREE && global.THREE.GLTFLoader) {
        resolve(); return;
      }
      if (src.indexOf('OrbitControls') >= 0 && global.THREE && global.THREE.OrbitControls) {
        resolve(); return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('falha ' + src));
      document.head.appendChild(s);
    });
  }

  function nomeDe(obj) {
    let n = obj.name || '';
    if (obj.userData && obj.userData.name) n += ' ' + obj.userData.name;
    return n;
  }

  function ePorta(obj) {
    return PORTA.test(nomeDe(obj));
  }

  function encostar(alvo, onPorta) {
    if (disposed || typeof onPorta !== 'function') return;
    onPorta();
  }

  function montar(palco, opts) {
    opts = opts || {};
    const glb = opts.glb;
    const onPorta = opts.onPorta;
    const onPronto = opts.onPronto;
    const onFalha = opts.onFalha;
    disposed = false;

    const tela = document.createElement('div');
    tela.id = 'abPaisagem';
    tela.setAttribute('aria-label', 'A Casa da Costa à noite');
    palco.insertBefore(tela, palco.firstChild);

    hint = document.createElement('button');
    hint.type = 'button';
    hint.id = 'abEntrarPorta';
    hint.hidden = true;
    hint.textContent = 'Toque na porta para entrar';
    palco.appendChild(hint);
    hint.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      encostar(hint, onPorta);
    });

    const timeout = setTimeout(() => {
      if (disposed || (renderer && root)) return;
      if (typeof onFalha === 'function') onFalha('timeout');
    }, 5000);

    loadScript(THREE_SRC)
      .then(() => loadScript(LOADER_SRC))
      .then(() => loadScript(CONTROLS_SRC))
      .then(() => {
        if (disposed) return;
        const THREE = global.THREE;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x04070b);
        scene.fog = new THREE.FogExp2(0x061018, 0.028);

        camera = new THREE.PerspectiveCamera(42, 1, 0.2, 180);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.72;
        renderer.shadowMap.enabled = false;
        tela.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0x6a86a8, 0x080604, 0.45));
        const lua = new THREE.DirectionalLight(0x9bb8d4, 0.35);
        lua.position.set(-8, 14, 6);
        scene.add(lua);
        const janela = new THREE.PointLight(0xffb45a, 1.4, 18, 2);
        janela.position.set(0, 3.2, 2.4);
        scene.add(janela);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.enableZoom = true;
        controls.rotateSpeed = 0.45;
        controls.minPolarAngle = Math.PI * 0.38;
        controls.maxPolarAngle = Math.PI * 0.52;
        controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

        function tamanho() {
          const w = palco.clientWidth || innerWidth;
          const h = palco.clientHeight || innerHeight;
          camera.aspect = Math.max(0.4, w / Math.max(1, h));
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        }
        tamanho();
        global.addEventListener('resize', tamanho);

        const loader = new THREE.GLTFLoader();
        loader.load(
          glb,
          (gltf) => {
            if (disposed) return;
            clearTimeout(timeout);
            root = gltf.scene || gltf.scenes[0];
            scene.add(root);

            const porta = [];
            const casa = new THREE.Box3();
            const tudo = new THREE.Box3().setFromObject(root);
            root.traverse((obj) => {
              if (!obj.isMesh) return;
              obj.castShadow = false;
              obj.receiveShadow = false;
              const n = nomeDe(obj);
              const mat = obj.material;
              if (mat && /lit/i.test(mat.name || '')) {
                mat.emissive = new THREE.Color(0xff9a3a);
                mat.emissiveIntensity = 1.6;
              }
              if (ePorta(obj)) {
                porta.push(obj);
                obj.userData.acPorta = true;
              }
              if (!CENARIO.test(n)) casa.expandByObject(obj);
            });

            const alvo = new THREE.Vector3();
            if (porta.length) {
              const pb = new THREE.Box3();
              porta.forEach((m) => pb.expandByObject(m));
              pb.getCenter(alvo);
            } else if (!casa.isEmpty()) {
              casa.getCenter(alvo);
            } else {
              tudo.getCenter(alvo);
            }

            const span = tudo.getSize(new THREE.Vector3()).length();
            const dist = Math.max(7, Math.min(22, span * 0.22));
            controls.target.copy(alvo);
            camera.position.set(alvo.x + dist * 0.55, alvo.y + dist * 0.22, alvo.z + dist * 0.82);
            controls.minDistance = dist * 0.65;
            controls.maxDistance = dist * 1.35;
            const baseAz = Math.atan2(camera.position.x - alvo.x, camera.position.z - alvo.z);
            controls.minAzimuthAngle = baseAz - 0.55;
            controls.maxAzimuthAngle = baseAz + 0.55;
            controls.update();
            janela.position.set(alvo.x, alvo.y + 1.6, alvo.z + 1.2);

            const ray = new THREE.Raycaster();
            const ptr = new THREE.Vector2();
            let sx = 0, sy = 0;
            renderer.domElement.addEventListener('pointerdown', (ev) => {
              sx = ev.clientX; sy = ev.clientY;
            });
            renderer.domElement.addEventListener('pointerup', (ev) => {
              if (disposed) return;
              if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 14) return;
              const r = renderer.domElement.getBoundingClientRect();
              ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
              ptr.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
              ray.setFromCamera(ptr, camera);
              const hits = ray.intersectObjects(root.children, true);
              const hit = hits.find((h) => {
                let o = h.object;
                while (o) {
                  if (o.userData && o.userData.acPorta) return true;
                  if (ePorta(o)) return true;
                  o = o.parent;
                }
                return false;
              });
              if (hit) encostar(hit.object, onPorta);
            });

            hint.hidden = false;
            if (typeof onPronto === 'function') onPronto();
          },
          undefined,
          () => {
            clearTimeout(timeout);
            if (typeof onFalha === 'function') onFalha('glb');
          }
        );

        function loop() {
          if (disposed) return;
          raf = requestAnimationFrame(loop);
          if (controls) controls.update();
          renderer.render(scene, camera);
        }
        loop();
      })
      .catch(() => {
        clearTimeout(timeout);
        if (typeof onFalha === 'function') onFalha('webgl');
      });

    return { desmontar };
  }

  function desmontar() {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    try { if (controls) controls.dispose(); } catch (e) {}
    try {
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    } catch (e) {}
    const tela = document.getElementById('abPaisagem');
    if (tela && tela.parentNode) tela.parentNode.removeChild(tela);
    const bt = document.getElementById('abEntrarPorta');
    if (bt && bt.parentNode) bt.parentNode.removeChild(bt);
    renderer = scene = camera = controls = root = hint = null;
  }

  global.MosaicoPaisagem = { montar, desmontar };
})(window);
