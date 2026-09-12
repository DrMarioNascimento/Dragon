/**
 * ============================================================
 * MOSAICO RA & 3D ENGINE — MOTOR VOLUMÉTRICO E REALIDADE AUMENTADA
 * A Casa da Costa — Dragon Games
 * ============================================================
 * Integra 3 vivências imersivas no celular:
 *  1. "sala3d": Sala volumétrica realista Three.js com lanterna cônica,
 *     sombras dinâmicas e inspeção tátil 360° dos 9 objetos canônicos.
 *  2. "camera-ra": Visor espectral com câmera real do smartphone,
 *     filtro de luz negra UV forense e pistas luminescentes no quarto físico.
 *  3. "anamorfose": Fragmentos espaciais 3D suspensos que só se alinham
 *     e revelam o horário/código no ponto de vista exato ("A Marca Partida").
 */
(function (global) {
  "use strict";

  var MosaicoRA = {
    ativo: false,
    modo: "sala3d", // "sala3d" | "camera-ra" | "anamorfose"
    container: null,
    renderer: null,
    scene: null,
    camera: null,
    spotlight: null,
    ambientLight: null,
    videoElement: null,
    videoTexture: null,
    animId: null,
    orientacao: { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 },
    objetos3D: {},
    inspecionando: null,
    anamorfoseTracos: [],
    anamorfoseAlvo: { yaw: 137, pitch: 11 },
    anamorfoseAlinhada: false,
    emCopa: false
  };

  /* ------------------------------------------------------------
     1. INICIALIZAÇÃO DO MOTOR E CONTAINER
     ------------------------------------------------------------ */
  MosaicoRA.iniciar = function (containerId, modoInicial) {
    document.body.classList.add("modo-ra-ativo");
    var gate = document.getElementById("dragonRoomGate");
    if(gate) { gate.style.display = "none"; try{ gate.remove(); }catch(e){} }

    var cont = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!cont) {
      cont = document.createElement("div");
      cont.id = "mosaico-ra-viewport";
      document.body.appendChild(cont);
    }
    MosaicoRA.container = cont;
    MosaicoRA.container.className = "mosaico-ra-container";
    MosaicoRA.container.innerHTML = "";
    MosaicoRA.container.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:200000;background:#04060a;overflow:hidden;";

    MosaicoRA.modo = (modoInicial === "ra" || modoInicial === "camera-ra") ? "camera-ra" : (modoInicial || "sala3d");
    MosaicoRA.ativo = true;

    if (typeof THREE === "undefined") {
      console.warn("Aguardando Three.js...");
      setTimeout(function(){ MosaicoRA.iniciar(containerId, modoInicial); }, 50);
      return;
    }

    var w = window.innerWidth;
    var h = window.innerHeight;

    // Vídeo de fundo com Câmera Real (Visor RA)
    var vid = document.createElement("video");
    vid.id = "mosaico-ra-video-bg";
    vid.autoplay = true;
    vid.playsInline = true;
    vid.muted = true;
    vid.setAttribute("playsinline", "");
    vid.setAttribute("webkit-playsinline", "");
    vid.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;display:none;filter:contrast(1.2) hue-rotate(240deg) saturate(1.4);";
    cont.appendChild(vid);
    MosaicoRA.videoElement = vid;

    // Renderer WebGL com transparência alpha para sobrepor à câmera
    MosaicoRA.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    MosaicoRA.renderer.setSize(w, h);
    MosaicoRA.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    MosaicoRA.renderer.shadowMap.enabled = true;
    MosaicoRA.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    MosaicoRA.renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:auto;";
    cont.appendChild(MosaicoRA.renderer.domElement);

    // Camera
    MosaicoRA.camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 50);
    MosaicoRA.camera.position.set(0, 1.55, 0);

    // Scene
    MosaicoRA.scene = new THREE.Scene();
    MosaicoRA.scene.background = new THREE.Color(0x04060a);

    // Iluminação
    MosaicoRA.ambientLight = new THREE.AmbientLight(0x1a2634, 0.4);
    MosaicoRA.scene.add(MosaicoRA.ambientLight);

    // Lanterna Cônica (Spotlight) presa à câmera
    MosaicoRA.spotlight = new THREE.SpotLight(0xffecd0, 2.2, 16, Math.PI / 6.5, 0.4, 1.2);
    MosaicoRA.spotlight.position.set(0, 0, 0.1);
    MosaicoRA.spotlight.castShadow = true;
    MosaicoRA.spotlight.shadow.mapSize.width = 1024;
    MosaicoRA.spotlight.shadow.mapSize.height = 1024;
    MosaicoRA.spotlight.shadow.camera.near = 0.2;
    MosaicoRA.spotlight.shadow.camera.far = 18;

    var spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0, -3);
    MosaicoRA.camera.add(spotTarget);
    MosaicoRA.spotlight.target = spotTarget;
    MosaicoRA.camera.add(MosaicoRA.spotlight);
    MosaicoRA.scene.add(MosaicoRA.camera);

    // Montar Cenário
    MosaicoRA.construirSala3D();
    MosaicoRA.construirAnamorfose();
    MosaicoRA.montarHUD();
    MosaicoRA.ligarControles();

    if (MosaicoRA.modo === "camera-ra") {
      MosaicoRA.ativarCameraRA();
    } else if (MosaicoRA.modo === "anamorfose") {
      MosaicoRA.trocarModo("anamorfose");
    }

    window.addEventListener("resize", MosaicoRA.redimensionar);
    MosaicoRA.animar();
  };

  /* ------------------------------------------------------------
     2. CONSTRUÇÃO DA SALA 3D E OBJETOS CANÔNICOS
     ------------------------------------------------------------ */
  MosaicoRA.construirSala3D = function () {
    var s = MosaicoRA.scene;
    var salaGroup = new THREE.Group();
    salaGroup.name = "salaGroup";
    MosaicoRA.salaGroup = salaGroup;
    s.add(salaGroup);

    // Textura procedural de tábuas de cedro para o chão
    var floorCanvas = document.createElement("canvas");
    floorCanvas.width = 512; floorCanvas.height = 512;
    var fctx = floorCanvas.getContext("2d");
    fctx.fillStyle = "#160e08"; fctx.fillRect(0, 0, 512, 512);
    fctx.strokeStyle = "rgba(42, 22, 12, 0.8)";
    fctx.lineWidth = 4;
    for (var i = 0; i < 512; i += 64) {
      fctx.beginPath(); fctx.moveTo(0, i); fctx.lineTo(512, i); fctx.stroke();
    }
    for (var j = 0; j < 512; j += 16) {
      fctx.strokeStyle = "rgba(255, 200, 150, 0.03)";
      fctx.lineWidth = 1;
      fctx.beginPath(); fctx.moveTo(0, j); fctx.lineTo(512, j); fctx.stroke();
    }
    var floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(6, 6);

    // Chão
    var floorGeo = new THREE.PlaneGeometry(10, 10);
    var floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.72,
      metalness: 0.1
    });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    salaGroup.add(floor);

    // Teto com Vigas
    var ceilGeo = new THREE.PlaneGeometry(10, 10);
    var ceilMat = new THREE.MeshStandardMaterial({ color: 0x070b10, roughness: 0.9 });
    var ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 3.2;
    salaGroup.add(ceiling);

    // Paredes de Alvenaria Escura
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x0c131c, roughness: 0.85 });
    var wallNorth = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallMat);
    wallNorth.position.set(0, 1.6, -5); wallNorth.receiveShadow = true; salaGroup.add(wallNorth);

    var wallSouth = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallMat);
    wallSouth.rotation.y = Math.PI; wallSouth.position.set(0, 1.6, 5); wallSouth.receiveShadow = true; salaGroup.add(wallSouth);

    var wallEast = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallMat);
    wallEast.rotation.y = -Math.PI / 2; wallEast.position.set(5, 1.6, 0); wallEast.receiveShadow = true; salaGroup.add(wallEast);

    var wallWest = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallMat);
    wallWest.rotation.y = Math.PI / 2; wallWest.position.set(-5, 1.6, 0); wallWest.receiveShadow = true; salaGroup.add(wallWest);

    // ------------------------------------------------------------
    // OS 9 OBJETOS CANÔNICOS DA CASA DA COSTA EM 3D
    // ------------------------------------------------------------

    // 1. O Quadro Torto & 8. O Cofre Embutido (Parede Norte)
    var quadroGroup = new THREE.Group();
    quadroGroup.position.set(-1.2, 1.68, -4.96);

    // Moldura Dourada
    var moldura = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.1, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xaa7828, metalness: 0.6, roughness: 0.4 })
    );
    moldura.castShadow = true;
    quadroGroup.add(moldura);

    // Tela da Marinha com Farol
    var telaCanvas = document.createElement("canvas");
    telaCanvas.width = 256; telaCanvas.height = 320;
    var tctx = telaCanvas.getContext("2d");
    tctx.fillStyle = "#06101a"; tctx.fillRect(0, 0, 256, 320);
    tctx.fillStyle = "#ffb266"; tctx.beginPath(); tctx.arc(128, 120, 18, 0, Math.PI*2); tctx.fill();
    tctx.fillStyle = "#0c1824"; tctx.fillRect(0, 200, 256, 120);
    var telaMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(telaCanvas) });
    var tela = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.96), telaMat);
    tela.position.z = 0.025;
    quadroGroup.add(tela);

    // O Cofre atrás do quadro (embutido na parede)
    var cofreGroup = new THREE.Group();
    cofreGroup.position.set(-1.2, 1.68, -4.97);
    var cofreBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.52, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x182c22, metalness: 0.8, roughness: 0.3 })
    );
    cofreGroup.add(cofreBody);

    var dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0xe8a44c, metalness: 0.9, roughness: 0.2 })
    );
    dial.rotation.x = Math.PI / 2;
    dial.position.z = 0.07;
    cofreGroup.add(dial);

    salaGroup.add(cofreGroup);
    salaGroup.add(quadroGroup);
    MosaicoRA.objetos3D["quadro"] = quadroGroup;
    MosaicoRA.objetos3D["cofre"] = cofreGroup;

    // 2. O Vaso de Plantas (Chão, Canto Norte-Oeste)
    var vasoGroup = new THREE.Group();
    vasoGroup.position.set(-3.2, 0, -4.2);

    var vasoMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.16, 0.65, 20),
      new THREE.MeshStandardMaterial({ color: 0x224838, roughness: 0.3, metalness: 0.2 })
    );
    vasoMesh.position.y = 0.325;
    vasoMesh.castShadow = true;
    vasoGroup.add(vasoMesh);

    // Folhagens escuras
    for (var f = 0; f < 6; f++) {
      var folha = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x143224, roughness: 0.6 })
      );
      folha.scale.set(1.5, 0.3, 0.8);
      folha.position.set(Math.cos(f) * 0.18, 0.68 + (f * 0.03), Math.sin(f) * 0.18);
      folha.rotation.z = Math.sin(f) * 0.4;
      vasoGroup.add(folha);
    }
    salaGroup.add(vasoGroup);
    MosaicoRA.objetos3D["vaso"] = vasoGroup;

    // 3. A Escrivaninha de Jacarandá & 9. Secretária com Fita (Parede Leste)
    var escrivGroup = new THREE.Group();
    escrivGroup.position.set(4.3, 0, -1.5);
    escrivGroup.rotation.y = -Math.PI / 2;

    // Tampo da mesa
    var tampo = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.08, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x2a160c, roughness: 0.5, metalness: 0.1 })
    );
    tampo.position.y = 0.76;
    tampo.castShadow = true;
    escrivGroup.add(tampo);

    // Pernas esculpidas
    var pernaMat = new THREE.MeshStandardMaterial({ color: 0x1c0e07, roughness: 0.6 });
    [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].forEach(function (p) {
      var perna = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.76, 0.08), pernaMat);
      perna.position.set(p[0], 0.38, p[1]);
      perna.castShadow = true;
      escrivGroup.add(perna);
    });

    // Gaveta funcional (que desliza ao toque)
    var gavetaGroup = new THREE.Group();
    gavetaGroup.position.set(0, 0.64, 0.1);
    var gavetaCorpo = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.14, 0.52),
      new THREE.MeshStandardMaterial({ color: 0x361d10, roughness: 0.7 })
    );
    gavetaGroup.add(gavetaCorpo);

    var puxador = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.03, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xcca050, metalness: 0.8, roughness: 0.2 })
    );
    puxador.position.set(0, 0, 0.28);
    gavetaGroup.add(puxador);

    // Secretária / Gravador no fundo da gaveta
    var secretariaMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.06, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.4 })
    );
    secretariaMesh.position.set(0, 0.05, -0.05);
    gavetaGroup.add(secretariaMesh);

    // LED vermelho piscante
    var led = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    led.position.set(0.08, 0.09, 0.02);
    gavetaGroup.add(led);

    escrivGroup.add(gavetaGroup);
    salaGroup.add(escrivGroup);
    MosaicoRA.objetos3D["escrivaninha"] = escrivGroup;
    MosaicoRA.objetos3D["gaveta"] = gavetaGroup;
    MosaicoRA.objetos3D["secretaria"] = secretariaMesh;

    // 4. O Espelho Oval (Parede Sul)
    var espelhoGroup = new THREE.Group();
    espelhoGroup.position.set(0.8, 1.7, 4.96);
    espelhoGroup.rotation.y = Math.PI;

    var espelhoMoldura = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.04, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.8, roughness: 0.25 })
    );
    espelhoMoldura.scale.set(0.85, 1.25, 1);
    espelhoGroup.add(espelhoMoldura);

    var espelhoVidro = new THREE.Mesh(
      new THREE.CircleGeometry(0.36, 32),
      new THREE.MeshStandardMaterial({ color: 0xc6e4ff, metalness: 0.95, roughness: 0.05 })
    );
    espelhoVidro.scale.set(0.85, 1.25, 1);
    espelhoVidro.position.z = 0.01;
    espelhoGroup.add(espelhoVidro);
    salaGroup.add(espelhoGroup);
    MosaicoRA.objetos3D["espelho"] = espelhoGroup;

    // 5. A Janela do Mar (Norte)
    var janelaGroup = new THREE.Group();
    janelaGroup.position.set(1.4, 1.7, -4.95);

    var janelaMoldura = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.5, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x111b24, roughness: 0.7 })
    );
    janelaGroup.add(janelaMoldura);

    var vidroJanela = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 1.35),
      new THREE.MeshPhysicalMaterial({
        color: 0x7fd4ff,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.85,
        ior: 1.5
      })
    );
    vidroJanela.position.z = 0.01;
    janelaGroup.add(vidroJanela);
    salaGroup.add(janelaGroup);
    MosaicoRA.objetos3D["janela"] = janelaGroup;

    // 6. O Relógio de Pêndulo (Parede Oeste)
    var relogioGroup = new THREE.Group();
    relogioGroup.position.set(-4.96, 1.82, 0);
    relogioGroup.rotation.y = Math.PI / 2;

    var caixaRelogio = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.95, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x221208, roughness: 0.45 })
    );
    caixaRelogio.castShadow = true;
    relogioGroup.add(caixaRelogio);

    // Mostrador com 21h29
    var mostrador = new THREE.Mesh(
      new THREE.CircleGeometry(0.16, 24),
      new THREE.MeshStandardMaterial({ color: 0xfff4e0, roughness: 0.3 })
    );
    mostrador.position.set(0, 0.22, 0.085);
    relogioGroup.add(mostrador);

    // Pêndulo de Latão
    var penduloGroup = new THREE.Group();
    penduloGroup.position.set(0, 0.08, 0.06);
    var haste = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.32, 0.01), new THREE.MeshStandardMaterial({ color: 0xffc46b, metalness: 0.9 }));
    haste.position.y = -0.16;
    penduloGroup.add(haste);
    var peso = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0xffc46b, metalness: 0.9 }));
    peso.rotation.x = Math.PI / 2;
    peso.position.y = -0.32;
    penduloGroup.add(peso);
    relogioGroup.add(penduloGroup);

    salaGroup.add(relogioGroup);
    MosaicoRA.objetos3D["relogio"] = relogioGroup;
    MosaicoRA.objetos3D["pendulo"] = penduloGroup;

    // 7. A Luminária / Abajur de Pé (Canto Sul-Leste)
    var abajurGroup = new THREE.Group();
    abajurGroup.position.set(3.8, 0, 3.8);

    var hasteAbajur = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.025, 1.6, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 })
    );
    hasteAbajur.position.y = 0.8;
    hasteAbajur.castShadow = true;
    abajurGroup.add(hasteAbajur);

    var cupula = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.32, 18, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xffe8c8, roughness: 0.6, side: THREE.DoubleSide })
    );
    cupula.position.y = 1.55;
    cupula.rotation.x = Math.PI;
    abajurGroup.add(cupula);

    salaGroup.add(abajurGroup);
    MosaicoRA.objetos3D["luminaria"] = abajurGroup;
  };

  /* ------------------------------------------------------------
     3. MECÂNICA DE ANAMORFOSE 3D ("A MARCA PARTIDA")
     ------------------------------------------------------------ */
  MosaicoRA.construirAnamorfose = function () {
    var grupoAnamorfose = new THREE.Group();
    grupoAnamorfose.name = "anamorfoseGroup";

    // Posição canônica do alvo de anamorfose: 137° azimute, 11° elevação
    var alvoRadYaw = (137 * Math.PI) / 180;
    var alvoRadPitch = (11 * Math.PI) / 180;

    // Segmentos que formam a data/hora "21:29" quando alinhados
    // Definidos em coordenadas normalizadas de tela projetadas em raios 3D
    var traços2D = [
      // Número 2
      [-0.45, 0.3, -0.32, 0.3], [-0.32, 0.3, -0.32, 0.15], [-0.32, 0.15, -0.45, 0.0], [-0.45, 0.0, -0.32, 0.0],
      // Número 1
      [-0.18, 0.25, -0.15, 0.3], [-0.15, 0.3, -0.15, 0.0],
      // Dois pontos :
      [-0.02, 0.22, -0.02, 0.20], [-0.02, 0.08, -0.02, 0.06],
      // Número 2
      [0.08, 0.3, 0.21, 0.3], [0.21, 0.3, 0.21, 0.15], [0.21, 0.15, 0.08, 0.0], [0.08, 0.0, 0.21, 0.0],
      // Número 9
      [0.32, 0.3, 0.45, 0.3], [0.32, 0.3, 0.32, 0.15], [0.32, 0.15, 0.45, 0.15], [0.45, 0.3, 0.45, 0.0], [0.32, 0.0, 0.45, 0.0]
    ];

    var matTraço = new THREE.LineBasicMaterial({
      color: 0xffd97d,
      linewidth: 3,
      transparent: true,
      opacity: 0.9
    });

    traços2D.forEach(function (t, idx) {
      // Cada segmento é posicionado ao longo do raio de visão do alvo,
      // mas em profundidades DIVERSAS (de 1.4m até 3.6m), para só se juntar no ângulo correto!
      var distA = 1.4 + ((idx * 7) % 19) * 0.11;
      var distB = 1.4 + ((idx * 11) % 17) * 0.12;

      // Calcular posição 3D no raio
      function projetaRaio(u, v, dist) {
        var dirX = Math.sin(alvoRadYaw) * Math.cos(alvoRadPitch) + u * 0.35;
        var dirY = Math.sin(alvoRadPitch) + v * 0.35;
        var dirZ = -Math.cos(alvoRadYaw) * Math.cos(alvoRadPitch);
        return new THREE.Vector3(dirX * dist, 1.55 + dirY * dist, dirZ * dist);
      }

      var pA = projetaRaio(t[0], t[1], distA);
      var pB = projetaRaio(t[2], t[3], distB);

      var geo = new THREE.BufferGeometry().setFromPoints([pA, pB]);
      var linha = new THREE.Line(geo, matTraço);
      grupoAnamorfose.add(linha);
    });

    MosaicoRA.scene.add(grupoAnamorfose);
    MosaicoRA.anamorfoseGroup = grupoAnamorfose;
  };

  /* ------------------------------------------------------------
     4. CONTROLE DE CÂMERA REAL (VISOR ESPECTRAL UV FORENSE)
     ------------------------------------------------------------ */
  MosaicoRA.ativarCameraRA = function () {
    MosaicoRA.modo = "camera-ra";
    MosaicoRA.atualizarBotoesModo();

    if (MosaicoRA.salaGroup) MosaicoRA.salaGroup.visible = false;
    if (MosaicoRA.anamorfoseGroup) MosaicoRA.anamorfoseGroup.visible = false;
    if (MosaicoRA.scene) MosaicoRA.scene.background = null;
    if (MosaicoRA.renderer) MosaicoRA.renderer.setClearColor(0x000000, 0);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("navigator.mediaDevices.getUserMedia indisponível.");
      MosaicoRA.mostrarPromptCamera(false, "Câmera indisponível no navegador atual ou conexão insegura (HTTPS obrigatório para câmera no iOS/Android).");
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(function (stream) {
      if (!MosaicoRA.videoElement) {
        var vid = document.getElementById("mosaico-ra-video-bg");
        if (!vid && MosaicoRA.container) {
          vid = document.createElement("video");
          vid.id = "mosaico-ra-video-bg";
          vid.autoplay = true;
          vid.playsInline = true;
          vid.muted = true;
          vid.setAttribute("playsinline", "");
          vid.setAttribute("webkit-playsinline", "");
          vid.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;filter:contrast(1.2) hue-rotate(240deg) saturate(1.4);";
          MosaicoRA.container.insertBefore(vid, MosaicoRA.container.firstChild);
        }
        MosaicoRA.videoElement = vid;
      }
      if (MosaicoRA.videoElement) {
        MosaicoRA.videoElement.srcObject = stream;
        MosaicoRA.videoElement.style.display = "block";
        var playPromise = MosaicoRA.videoElement.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function(e){ console.warn("Video play:", e); });
        }
      }

      MosaicoRA.removerPromptCamera();
      MosaicoRA.criarPistasUV();
      MosaicoRA.modo = "camera-ra";
      MosaicoRA.atualizarBotoesModo();
      if (typeof Mosaico3D !== "undefined") Mosaico3D.som.encaixe();
    }).catch(function (err) {
      console.warn("Falha ao abrir câmera RA:", err);
      MosaicoRA.mostrarPromptCamera(true, "Para projetar as pistas em Realidade Aumentada, toque abaixo para permitir a câmera no Safari.");
    });
  };

  MosaicoRA.desativarCameraRA = function () {
    MosaicoRA.removerPromptCamera();
    if (MosaicoRA.videoElement) {
      MosaicoRA.videoElement.style.display = "none";
      if (MosaicoRA.videoElement.srcObject) {
        try {
          MosaicoRA.videoElement.srcObject.getTracks().forEach(function (track) { track.stop(); });
        } catch(e){}
        MosaicoRA.videoElement.srcObject = null;
      }
    }
    if (MosaicoRA.salaGroup) MosaicoRA.salaGroup.visible = true;
    if (MosaicoRA.scene) MosaicoRA.scene.background = new THREE.Color(0x04060a);
    if (MosaicoRA.pistasUVGroup) MosaicoRA.pistasUVGroup.visible = false;
  };

  MosaicoRA.mostrarPromptCamera = function (permitirTentarNovamente, msg) {
    var p = document.getElementById("mosaico-ra-prompt");
    if (!p) {
      p = document.createElement("div");
      p.id = "mosaico-ra-prompt";
      p.className = "mosaico-ra-prompt";
      if (MosaicoRA.container) MosaicoRA.container.appendChild(p);
      else document.body.appendChild(p);
    }
    p.style.display = "flex";
    p.innerHTML = '<div class="mosaico-ra-prompt-card">' +
      '<div style="font-size:44px;margin-bottom:8px">📷</div>' +
      '<h3 style="font-family:Cinzel,serif;color:#ffe889;margin:0 0 8px;font-size:1.35rem">Visor RA (Câmera do Celular)</h3>' +
      '<p style="color:#c9bba3;font-size:14px;line-height:1.5;margin:0 0 16px">' + (msg || "Aponte a câmera para a sua sala para ver pegadas e pistas luminescentes.") + '</p>' +
      (permitirTentarNovamente ? '<button class="btn btn-gold" style="width:100%;margin-bottom:10px;background:#4dfcba;color:#04060a;font-weight:700;border:none;padding:12px 18px;border-radius:8px;font-size:14px;cursor:pointer" onclick="MosaicoRA.ativarCameraRA()">Abrir Câmera Agora</button>' : '') +
      '<button class="btn btn-ghost" style="width:100%;background:rgba(255,255,255,0.08);color:#f3d078;border:1px solid rgba(243,208,120,0.3);padding:10px 16px;border-radius:8px;font-size:13px;cursor:pointer" onclick="MosaicoRA.trocarModo(\'sala3d\')">🕯️ Continuar na Sala 3D Virtual</button>' +
    '</div>';
  };

  MosaicoRA.removerPromptCamera = function () {
    var p = document.getElementById("mosaico-ra-prompt");
    if (p) p.style.display = "none";
  };

  MosaicoRA.criarPistasUV = function () {
    if (MosaicoRA.pistasUVGroup) {
      MosaicoRA.pistasUVGroup.visible = true;
      return;
    }
    var uvGroup = new THREE.Group();

    // Pegadas luminescentes projetadas no chão à frente
    var pegadaMat = new THREE.MeshBasicMaterial({
      color: 0x4dfcba,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });

    [[-0.4, -1.2], [0.2, -1.8], [-0.3, -2.4], [0.3, -3.0]].forEach(function (pos, i) {
      var footprint = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.35), pegadaMat);
      footprint.rotation.x = -Math.PI / 2;
      footprint.rotation.z = i % 2 === 0 ? 0.2 : -0.2;
      footprint.position.set(pos[0], 0.02, pos[1]);
      uvGroup.add(footprint);
    });

    // Envelope confidencial flutuante com lacre de cera no espaço real
    var env = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.24, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xfdfaf2, roughness: 0.4 })
    );
    env.position.set(0.6, 1.4, -2.0);
    env.rotation.y = -0.4;
    uvGroup.add(env);

    var selo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.01, 16),
      new THREE.MeshStandardMaterial({ color: 0xd92626, roughness: 0.3 })
    );
    selo.rotation.x = Math.PI / 2;
    selo.position.set(0.6, 1.4, -1.98);
    uvGroup.add(selo);

    MosaicoRA.scene.add(uvGroup);
    MosaicoRA.pistasUVGroup = uvGroup;
  };

  /* ------------------------------------------------------------
     5. INSPEÇÃO TÁTIL 360° (INSPECT MODE)
     ------------------------------------------------------------ */
  MosaicoRA.examinarObjeto = function (id) {
    var obj = MosaicoRA.objetos3D[id];
    if (!obj) return;

    if (id === "quadro") {
      // Animação da dobradiça do quadro abrindo para revelar o cofre
      if (!obj.aberto) {
        obj.rotation.y = Math.PI / 2.8;
        obj.aberto = true;
        if (typeof Mosaico3D !== "undefined") Mosaico3D.som.encaixe();
      } else {
        obj.rotation.y = 0;
        obj.aberto = false;
      }
      return;
    }

    if (id === "gaveta") {
      // Animação de abrir a gaveta da escrivaninha
      if (!obj.aberto) {
        obj.position.z = 0.42;
        obj.aberto = true;
        if (typeof Mosaico3D !== "undefined") Mosaico3D.som.encaixe();
      } else {
        obj.position.z = 0.1;
        obj.aberto = false;
      }
      return;
    }

    // Modal de Inspeção 3D em Primeiro Plano
    var modal = document.getElementById("mosaico-ra-inspect-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "mosaico-ra-inspect-modal";
      modal.className = "mosaico-ra-modal";
      document.body.appendChild(modal);
    }

    var nomes = {
      relogio: "O Relógio de Parede (Parado às 21h29)",
      cofre: "O Cofre Embutido (Disco de Latão)",
      escrivaninha: "A Escrivaninha (Gaveta com Gravador)",
      vaso: "O Vaso de Plantas (Cerâmica Trincada)",
      espelho: "O Espelho Oval (Moldura Dourada)",
      janela: "A Janela do Mar (Tempestade Lá Fora)",
      luminaria: "O Abajur de Pé (Latão e Linho)"
    };

    modal.innerHTML = '<div class="mosaico-ra-modal-card m3d-tilt-box">' +
      '<div class="mosaico-ra-modal-header">' +
        '<h3>' + (nomes[id] || "Objeto da Casa da Costa") + '</h3>' +
        '<button class="mosaico-ra-modal-close" onclick="MosaicoRA.fecharInspecao()">✕</button>' +
      '</div>' +
      '<p class="lead" style="font-size:13px;color:#8fa3b8;margin:6px 0 14px">Arraste para girar em 360° e examinar detalhes forenses.</p>' +
      '<div id="mosaico-ra-inspect-stage" style="width:100%;height:260px;background:#030508;border-radius:12px;overflow:hidden"></div>' +
      '<button class="btn btn-ambar" style="width:100%;margin-top:14px" onclick="MosaicoRA.fecharInspecao()">Retornar à Investigação</button>' +
    '</div>';
    modal.style.display = "flex";

    MosaicoRA.iniciarStageInspecao(id, "mosaico-ra-inspect-stage");
  };

  MosaicoRA.fecharInspecao = function () {
    var modal = document.getElementById("mosaico-ra-inspect-modal");
    if (modal) modal.style.display = "none";
    if (MosaicoRA.inspectAnimId) {
      cancelAnimationFrame(MosaicoRA.inspectAnimId);
      MosaicoRA.inspectAnimId = null;
    }
  };

  MosaicoRA.iniciarStageInspecao = function (id, stageId) {
    var stage = document.getElementById(stageId);
    if (!stage) return;

    var w = stage.clientWidth || 300, h = stage.clientHeight || 260;
    var ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ren.setSize(w, h);
    stage.innerHTML = "";
    stage.appendChild(ren.domElement);

    var scn = new THREE.Scene();
    scn.background = new THREE.Color(0x080e16);
    var cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 10);
    cam.position.set(0, 0, 2.2);

    var lgt = new THREE.PointLight(0xfff0d0, 1.8, 10);
    lgt.position.set(2, 2, 2);
    scn.add(lgt);
    scn.add(new THREE.AmbientLight(0x223344, 0.8));

    // Clonar malha representativa para exame isolado
    var geom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var mat = new THREE.MeshStandardMaterial({ color: 0xcca050, metalness: 0.5, roughness: 0.3 });
    if (id === "relogio") geom = new THREE.CylinderGeometry(0.45, 0.45, 0.15, 32);
    if (id === "vaso") geom = new THREE.CylinderGeometry(0.35, 0.22, 0.8, 24);
    if (id === "cofre") geom = new THREE.BoxGeometry(0.7, 0.7, 0.4);

    var previewMesh = new THREE.Mesh(geom, mat);
    scn.add(previewMesh);

    // Rotação por toque/arraste
    var dragging = false, prevX = 0, prevY = 0;
    stage.onmousedown = stage.ontouchstart = function (e) {
      dragging = true;
      var pt = e.touches ? e.touches[0] : e;
      prevX = pt.clientX; prevY = pt.clientY;
    };
    window.onmousemove = window.ontouchmove = function (e) {
      if (!dragging) return;
      var pt = e.touches ? e.touches[0] : e;
      var dx = pt.clientX - prevX, dy = pt.clientY - prevY;
      previewMesh.rotation.y += dx * 0.015;
      previewMesh.rotation.x += dy * 0.015;
      prevX = pt.clientX; prevY = pt.clientY;
    };
    window.onmouseup = window.ontouchend = function () { dragging = false; };

    function loopInspect() {
      MosaicoRA.inspectAnimId = requestAnimationFrame(loopInspect);
      if (!dragging) previewMesh.rotation.y += 0.005;
      ren.render(scn, cam);
    }
    loopInspect();
  };

  /* ------------------------------------------------------------
     6. CONTROLES DE ORIENTAÇÃO (GIROSCÓPIO & ARRASTE)
     ------------------------------------------------------------ */
  MosaicoRA.ligarControles = function () {
    // Giroscópio Mobile
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", function (e) {
        if (e.alpha != null && e.beta != null && e.gamma != null) {
          // Converter orientação do aparelho para yaw/pitch
          var yaw = (-e.alpha * Math.PI) / 180;
          var pitch = ((e.beta - 90) * Math.PI) / 180;
          MosaicoRA.orientacao.targetYaw = yaw;
          MosaicoRA.orientacao.targetPitch = Math.max(-1.1, Math.min(1.1, pitch));
        }
      });
    }

    // Arraste por Toque/Mouse na tela
    var arrastando = false, ultX = 0, ultY = 0;
    var dom = MosaicoRA.renderer.domElement;

    dom.addEventListener("mousedown", function (e) {
      arrastando = true; ultX = e.clientX; ultY = e.clientY;
    });
    dom.addEventListener("touchstart", function (e) {
      arrastando = true; ultX = e.touches[0].clientX; ultY = e.touches[0].clientY;
    });

    window.addEventListener("mousemove", function (e) {
      if (!arrastando) return;
      var dx = e.clientX - ultX, dy = e.clientY - ultY;
      MosaicoRA.orientacao.targetYaw -= dx * 0.004;
      MosaicoRA.orientacao.targetPitch = Math.max(-1.1, Math.min(1.1, MosaicoRA.orientacao.targetPitch - dy * 0.004));
      ultX = e.clientX; ultY = e.clientY;
    });
    window.addEventListener("touchmove", function (e) {
      if (!arrastando) return;
      var dx = e.touches[0].clientX - ultX, dy = e.touches[0].clientY - ultY;
      MosaicoRA.orientacao.targetYaw -= dx * 0.004;
      MosaicoRA.orientacao.targetPitch = Math.max(-1.1, Math.min(1.1, MosaicoRA.orientacao.targetPitch - dy * 0.004));
      ultX = e.touches[0].clientX; ultY = e.touches[0].clientY;
    });

    window.addEventListener("mouseup", function () { arrastando = false; });
    window.addEventListener("touchend", function () { arrastando = false; });

    // Raycaster para tocar em objetos 3D
    dom.addEventListener("click", function (e) {
      var rect = dom.getBoundingClientRect();
      var mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      var raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, MosaicoRA.camera);

      var inter = raycaster.intersectObjects(MosaicoRA.scene.children, true);
      if (inter.length > 0) {
        var topMesh = inter[0].object;
        // Identificar qual objeto canônico foi tocado
        Object.keys(MosaicoRA.objetos3D).forEach(function (chave) {
          var grp = MosaicoRA.objetos3D[chave];
          if (grp === topMesh || grp.children.includes(topMesh)) {
            MosaicoRA.examinarObjeto(chave);
          }
        });
      }
    });
  };

  /* ------------------------------------------------------------
     7. HUD E SELETOR DE MODALIDADE
     ------------------------------------------------------------ */
  MosaicoRA.montarHUD = function () {
    var hud = document.createElement("div");
    hud.id = "mosaico-ra-hud";
    hud.className = "mosaico-ra-hud";
    hud.innerHTML = '<div class="mosaico-ra-topbar">' +
      '<div class="mosaico-ra-tabs">' +
        '<button class="mosaico-ra-tab ' + (MosaicoRA.modo === "sala3d" ? "active" : "") + '" onclick="MosaicoRA.trocarModo(\'sala3d\')">🕯️ Sala 3D</button>' +
        '<button class="mosaico-ra-tab ' + (MosaicoRA.modo === "camera-ra" ? "active" : "") + '" onclick="MosaicoRA.trocarModo(\'camera-ra\')">📷 Visor RA</button>' +
        '<button class="mosaico-ra-tab ' + (MosaicoRA.modo === "anamorfose" ? "active" : "") + '" onclick="MosaicoRA.trocarModo(\'anamorfose\')">✨ Anamorfose</button>' +
      '</div>' +
      '<button class="mosaico-ra-btn-fechar" onclick="MosaicoRA.encerrar()">✕ Sair</button>' +
    '</div>' +
    '<div class="mosaico-ra-footer">' +
      '<div id="mosaico-ra-dica-texto" class="mosaico-ra-dica">Mova o celular para iluminar a sala. Toque nos objetos para inspecionar em 360°.</div>' +
      '<div id="mosaico-ra-anamorfose-bar" class="mosaico-ra-prog-bar" style="display:none">' +
        '<div id="mosaico-ra-anamorfose-fill" class="mosaico-ra-prog-fill"></div>' +
      '</div>' +
    '</div>';
    MosaicoRA.container.appendChild(hud);
  };

  MosaicoRA.trocarModo = function (novoModo) {
    if (novoModo === MosaicoRA.modo) return;
    if (MosaicoRA.modo === "camera-ra" && novoModo !== "camera-ra") {
      MosaicoRA.desativarCameraRA();
    }

    MosaicoRA.modo = novoModo;
    if (novoModo === "camera-ra") {
      MosaicoRA.ativarCameraRA();
    } else if (novoModo === "anamorfose") {
      if (MosaicoRA.videoElement) MosaicoRA.videoElement.style.display = "none";
      if (MosaicoRA.salaGroup) MosaicoRA.salaGroup.visible = false;
      if (MosaicoRA.scene) MosaicoRA.scene.background = new THREE.Color(0x020408);
      if (MosaicoRA.anamorfoseGroup) MosaicoRA.anamorfoseGroup.visible = true;
      if (MosaicoRA.pistasUVGroup) MosaicoRA.pistasUVGroup.visible = false;
    } else {
      // sala3d
      if (MosaicoRA.videoElement) MosaicoRA.videoElement.style.display = "none";
      if (MosaicoRA.salaGroup) MosaicoRA.salaGroup.visible = true;
      if (MosaicoRA.scene) MosaicoRA.scene.background = new THREE.Color(0x04060a);
      if (MosaicoRA.anamorfoseGroup) MosaicoRA.anamorfoseGroup.visible = false;
      if (MosaicoRA.pistasUVGroup) MosaicoRA.pistasUVGroup.visible = false;
    }

    MosaicoRA.atualizarBotoesModo();
  };

  MosaicoRA.atualizarBotoesModo = function () {
    var tabs = document.querySelectorAll(".mosaico-ra-tab");
    tabs.forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("onclick").includes("'" + MosaicoRA.modo + "'"));
    });

    var dica = document.getElementById("mosaico-ra-dica-texto");
    var bar = document.getElementById("mosaico-ra-anamorfose-bar");

    if (dica && bar) {
      if (MosaicoRA.modo === "sala3d") {
        dica.textContent = "Mova o celular para iluminar com a lanterna. Toque nos móveis para inspecionar em 360°.";
        bar.style.display = "none";
      } else if (MosaicoRA.modo === "camera-ra") {
        dica.textContent = "Visor Espectral UV: aponte para o chão e paredes da sua sala para ver pegadas e pistas luminescentes.";
        bar.style.display = "none";
      } else if (MosaicoRA.modo === "anamorfose") {
        dica.textContent = "Gire o celular devagar pelo quarto até encontrar o ponto de vista onde os traços formam a hora.";
        bar.style.display = "block";
      }
    }
  };

  MosaicoRA.encerrar = function () {
    MosaicoRA.ativo = false;
    if (MosaicoRA.animId) cancelAnimationFrame(MosaicoRA.animId);
    MosaicoRA.desativarCameraRA();
    if (MosaicoRA.container) {
      MosaicoRA.container.innerHTML = "";
      if (MosaicoRA.container.id === "mosaico-ra-viewport" && MosaicoRA.container.parentNode) {
        MosaicoRA.container.parentNode.removeChild(MosaicoRA.container);
      }
    }
    if (typeof STATE !== "undefined" && (STATE.tela === "sala3d" || STATE.tela === "ra")) {
      STATE.tela = "mosaico";
      if (STATE.doc) STATE.doc.fase = "mosaico";
    }
    if (typeof render === "function") render(true);
  };

  /* ------------------------------------------------------------
     8. LOOP DE RENDERIZAÇÃO & CÁLCULO DE ANAMORFOSE
     ------------------------------------------------------------ */
  MosaicoRA.animar = function () {
    if (!MosaicoRA.ativo) return;
    MosaicoRA.animId = requestAnimationFrame(MosaicoRA.animar);

    // Interpolação suave de orientação
    MosaicoRA.orientacao.yaw += (MosaicoRA.orientacao.targetYaw - MosaicoRA.orientacao.yaw) * 0.12;
    MosaicoRA.orientacao.pitch += (MosaicoRA.orientacao.targetPitch - MosaicoRA.orientacao.pitch) * 0.12;

    MosaicoRA.camera.rotation.set(MosaicoRA.orientacao.pitch, MosaicoRA.orientacao.yaw, 0, "YXZ");

    // Oscilação suave do pêndulo do relógio
    if (MosaicoRA.objetos3D["pendulo"]) {
      MosaicoRA.objetos3D["pendulo"].rotation.z = Math.sin(Date.now() * 0.003) * 0.18;
    }

    // Conferência da Anamorfose (Verificar se a pessoa achou o ângulo alvo)
    if (MosaicoRA.modo === "anamorfose" && MosaicoRA.anamorfoseGroup) {
      var yawAtualGraus = ((-MosaicoRA.orientacao.yaw * 180) / Math.PI + 360) % 360;
      var pitchAtualGraus = ((MosaicoRA.orientacao.pitch * 180) / Math.PI);

      var diffYaw = Math.abs(yawAtualGraus - MosaicoRA.anamorfoseAlvo.yaw);
      if (diffYaw > 180) diffYaw = 360 - diffYaw;
      var diffPitch = Math.abs(pitchAtualGraus - MosaicoRA.anamorfoseAlvo.pitch);

      var desvioTotal = Math.sqrt(diffYaw * diffYaw + diffPitch * diffPitch);
      var proximidade = Math.max(0, Math.min(1, (25 - desvioTotal) / 25));

      var fill = document.getElementById("mosaico-ra-anamorfose-fill");
      if (fill) fill.style.width = (proximidade * 100).toFixed(1) + "%";

      if (desvioTotal < 3.2 && !MosaicoRA.anamorfoseAlinhada) {
        MosaicoRA.anamorfoseAlinhada = true;
        if (typeof Mosaico3D !== "undefined") {
          Mosaico3D.som.sucesso();
          Mosaico3D.vibrar([50, 60, 120]);
        }
        var dicaEl = document.getElementById("mosaico-ra-dica-texto");
        if (dicaEl) {
          dicaEl.innerHTML = "<b style='color:#ffe889'>ANAMORFOSE ALINHADA (21:29) &#10003;</b> Pista registrada no caso!";
        }
      } else if (desvioTotal >= 3.2) {
        MosaicoRA.anamorfoseAlinhada = false;
      }
    }

    MosaicoRA.renderer.render(MosaicoRA.scene, MosaicoRA.camera);
  };

  MosaicoRA.redimensionar = function () {
    if (!MosaicoRA.container || !MosaicoRA.renderer || !MosaicoRA.camera) return;
    var w = MosaicoRA.container.clientWidth || window.innerWidth;
    var h = MosaicoRA.container.clientHeight || window.innerHeight;
    MosaicoRA.camera.aspect = w / h;
    MosaicoRA.camera.updateProjectionMatrix();
    MosaicoRA.renderer.setSize(w, h);
  };

  global.MosaicoRA = MosaicoRA;
})(window);
