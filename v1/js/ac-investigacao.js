/* Bancada jogavel da AC. Estado local separado da apresentacao e da sala publicada. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const startWithoutInstructions = new URLSearchParams(location.search).get('iniciar') === '1';
  const machine = window.ACInvestigationState;
  let state = {...machine.initial(),stage:'posicionar'};
  let coop=null, role=new URLSearchParams(location.search).get('papel')||'luz', connected=false, shared=null;
  let fallback=false, arSupported=false, lastBeam=0, beamPending=false, discoverPending=false, registerPending=false;
  const clueText='Procure pelo lar onde o telhado não protege da chuva, os móveis nunca mudam de lugar e os moradores são pequenos demais. É lá onde todos os projetos se iniciam, é lá que o segredo repousa.';
  let disposed = false, modelReady = false, orbiting = false, hold = 0, noticeTimer;
  let xrSession = null, hitSource = null, xrGeneration = 0, hasHit = false, xrPlaced = false;
  let motionEnabled = false, motionOrigin = null, lightTransfer = 0;
  let draggingCandle = false, snapReady = false, draggingDesk = false;
  const dragPlane = new THREE.Plane(), dragRay = new THREE.Raycaster(), dragPoint = new THREE.Vector3();
  const cleanup = [];
  const on = (target, type, fn, options) => { target.addEventListener(type, fn, options); cleanup.push(() => target.removeEventListener(type, fn, options)); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function notify(message) { $('notice').textContent = message; $('notice').style.display = 'block'; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { $('notice').style.display = 'none'; }, 5000); }
  function dispatch(type) { if(!connected||!coop)return;coop.send(type).catch(()=>notify('Conexão interrompida. Aguarde a reconexão.')); }
  function beginAction(){if(role==='luz'&&shared&&!shared.started)dispatch('iniciar');}
  function setFallback(reason){fallback=true;$('accessible').closest('label').hidden=false;$('fallback-description').textContent=reason+' O modo 3D permite arrastar para explorar; os botões são opcionais.';updateUI();}

  const descriptions = {
    posicionar: ['PORTADOR DA LUZ', 'A luz voltou.', 'A luz voltou, ache um lugar seguro para segurar a vela e auxiliar seu colega na tarefa', 'Posicionar escrivaninha'],
    castical: ['PORTADOR DA LUZ', 'Um lugar seguro.', 'A luz voltou, ache um lugar seguro para segurar a vela e auxiliar seu colega na tarefa', 'Colocar a vela no castiçal'],
    iluminar: ['PORTADOR DA LUZ', 'Ilumine para seu colega.', 'Agora essa luz pode esclarecer um segredo escondido que só seu colega consegue ver!', 'Investigar'],
    encontrado: ['DESCOBERTA EM DUPLA', 'Um segredo revelado.', 'Seu colega pode ler a etiqueta e guardar a descoberta.', 'Examinar fragmento'],
    registrado: ['DOSSIÊ', 'A descoberta permanece.', 'A pista foi guardada pela dupla. Ela orienta a próxima investigação.', 'Reabrir fragmento']
  };

  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x091515); scene.fog = new THREE.Fog(0x091515, 6, 14);
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .02, 35);
  camera.position.set(1.6, 1.45, 2.35);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (_) { $('loading').textContent = 'Este navegador não conseguiu abrir o 3D. Tente com aceleração gráfica ativada.'; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .82;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true; $('scene').appendChild(renderer.domElement);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, .47, 0); controls.enableDamping = true; controls.dampingFactor = .09;
  controls.minDistance = .12; controls.maxDistance = 22; controls.maxPolarAngle = Math.PI * .96; controls.enablePan = false;
  function frameDesk(){
    const distance=2.8;
    camera.fov=Math.max(40,Math.min(95,THREE.MathUtils.radToDeg(2*Math.atan(1.65/(2*distance*camera.aspect*.87)))));
    camera.updateProjectionMatrix();controls.target.set(0,.5,0);
    camera.position.copy(new THREE.Vector3(1.2,.8,2.6).normalize().multiplyScalar(distance).add(controls.target));controls.update();
  }
  frameDesk();
  controls.update();
  scene.add(camera);
  const environment = new THREE.Group(); scene.add(environment);
  const ambient = new THREE.HemisphereLight(0xa8c8c7, 0x393122, .8); scene.add(ambient);
  const windowLight = new THREE.DirectionalLight(0xbedee8, 2); windowLight.position.set(-2, 3, 1); scene.add(windowLight);
  const rim = new THREE.DirectionalLight(0xe6b777, .6); rim.position.set(2, 2, -2); scene.add(rim);
  // The room is expressed in desk-local coordinates so cooperative light and
  // physical AR placement keep their existing coordinate system.
  const roomSeed=ACRoom.seed(),room=ACRoom.create({seed:roomSeed,desk:false,powered:true});
  const deskPose=room.objects.escrivaninha;
  const inverseDesk=new THREE.Matrix4().compose(deskPose.position,deskPose.quaternion,new THREE.Vector3(1,1,1)).invert();
  room.root.applyMatrix4(inverseDesk);environment.add(room.root);
  room.objects.escrivaninha.visible=false;
  controls.maxDistance=3.4;
  const deskRoot = new THREE.Group(); scene.add(deskRoot);
  let desk;
  const placement = new THREE.Mesh(new THREE.RingGeometry(.55, .56, 64), new THREE.MeshBasicMaterial({ color: 0xc5b07f, side: THREE.DoubleSide, transparent: true, opacity: .45 }));
  placement.rotation.x = -Math.PI / 2; placement.position.y = .009; deskRoot.add(placement);
  const reticle = new THREE.Mesh(new THREE.RingGeometry(.13, .15, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf4d199 }));
  reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);

  // Castical torneado, cera com borda irregular e chama volumetrica: sem sprite de emoji.
  const holder = new THREE.Group(); holder.position.set(.28, .765, .02); deskRoot.add(holder);
  const brass = new THREE.MeshStandardMaterial({ color: 0xb59351, metalness: .8, roughness: .29 });
  const profile = [[0,0],[.072,0],[.081,.008],[.079,.016],[.05,.026],[.031,.032],[.022,.048],[.017,.115],[.03,.129],[.045,.138],[.048,.15],[.033,.156],[0,.156]].map(p => new THREE.Vector2(...p));
  const holderMesh = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), brass); holderMesh.castShadow = true; holder.add(holderMesh);
  const candle = new THREE.Group(); scene.add(candle);
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xe9d5a5, roughness: .6 });
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(.025,.028,.2,40), waxMat); wax.position.y = .1; wax.castShadow = true; candle.add(wax);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(.022,.005,8,32), waxMat); lip.rotation.x = Math.PI / 2; lip.position.y = .2; candle.add(lip);
  for (let i=0;i<6;i++) { const a=i*2.4, len=.015+(i%3)*.014; const drip=new THREE.Mesh(new THREE.CylinderGeometry(.003,.004,len,8),waxMat); drip.position.set(Math.cos(a)*.024,.193-len/2,Math.sin(a)*.024); candle.add(drip); }
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(.0016,.0019,.014,8), new THREE.MeshBasicMaterial({color:0x352619})); wick.position.y=.211; candle.add(wick);
  const flame = new THREE.Group(); flame.position.y = .235; candle.add(flame);
  const outer = new THREE.Mesh(new THREE.SphereGeometry(.015,20,16), new THREE.MeshBasicMaterial({color:0xff9c2a,transparent:true,opacity:.6,depthWrite:false})); outer.scale.set(.7,1.8,.7); flame.add(outer);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(.008,16,12), new THREE.MeshBasicMaterial({color:0xffefbb,transparent:true,opacity:.96,depthWrite:false})); inner.scale.set(.8,2,.8); flame.add(inner);
  outer.visible=false;inner.visible=false;
  const flameMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv; uniform float time; void main(){ float y=vUv.y; float sway=sin(y*9.0-time*4.0)*0.035*y; float x=vUv.x-0.5-sway; float width=0.27*pow(max(0.0,1.0-y),0.75)*smoothstep(0.0,0.18,y); float edge=1.0-smoothstep(width*0.6,width+0.025,abs(x)); float alpha=edge*smoothstep(0.0,0.09,y)*(1.0-smoothstep(0.91,1.0,y)); vec3 color=mix(vec3(1.0,0.26,0.025),vec3(1.0,0.86,0.39),pow(edge,3.0)); color=mix(color,vec3(0.12,0.23,0.8),(1.0-smoothstep(0.02,0.16,y))*0.6); gl_FragColor=vec4(color,alpha); }`});
  const flamePlane=new THREE.Mesh(new THREE.PlaneGeometry(.072,.078),flameMaterial);flamePlane.position.y=.013;flame.add(flamePlane);
  const candleLight = new THREE.PointLight(0xffc572, .85, 2.5, 2); candleLight.position.y=.24; candle.add(candleLight);
  const torch = new THREE.SpotLight(0xffdc9d, 4, 5, Math.PI / 7, .6, 1.4); torch.castShadow = true; torch.shadow.mapSize.set(512,512); scene.add(torch); scene.add(torch.target);
  const pointer = new THREE.Vector2(0,0); const ray = new THREE.Raycaster();
  const beamDirection = new THREE.Vector3();
  const clueCanvas = document.createElement('canvas'); clueCanvas.width=1024; clueCanvas.height=512;
  const cc=clueCanvas.getContext('2d');cc.fillStyle='#a09273';cc.fillRect(0,0,1024,512);cc.fillStyle='#29251e';cc.font='38px Georgia';
  let line='',y=65;for(const word of clueText.split(' ')){const next=line+word+' ';if(cc.measureText(next).width>920){cc.fillText(line,48,y);y+=53;line=word+' ';}else line=next;}cc.fillText(line,48,y);
  const clue = new THREE.Mesh(new THREE.PlaneGeometry(.065,.0325),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(clueCanvas),roughness:.95,transparent:true,opacity:0}));
  // Etiqueta de 6,5 cm sob o pedestal das gavetas, com a face voltada para o chao.
  clue.position.set(.47,.098,.10);clue.rotation.x=Math.PI/2;deskRoot.add(clue);
  let clueExposed = false;

  function updateUI() {
    const [step,heading,description,label]=descriptions[state.stage];
    $('step').textContent=step;$('heading').textContent=heading;$('description').textContent=description;$('primary').textContent=label;
    $('primary').disabled=!modelReady || state.stage==='iluminar';
    $('primary').hidden=!(fallback&&$('accessible').checked)||role!=='luz'||['iluminar','encontrado','registrado'].includes(state.stage);
    for(const id of ['orbit','below','motion'])$(id).hidden=!(fallback&&$('accessible').checked);
    $('ar').hidden=!arSupported;
    $('dossier').hidden=role!=='conhecimento'||!['encontrado','registrado'].includes(state.stage);
    if(role==='conhecimento'&&['posicionar','castical','iluminar'].includes(state.stage)){ $('step').textContent='PORTADOR DO CONHECIMENTO';$('heading').textContent=state.stage==='iluminar'?'O que só você pode ver.':'Um não vê sem o outro.';$('description').textContent=['posicionar','castical'].includes(state.stage)?'Seu colega precisa achar um lugar para segurar a vela, só assim a tarefa dará seguimento!':'A vela pode iluminar com segurança algo escondido que pode estar nessa escrivaninha, ela ilumina o que só você pode ver!'; }
    if(role==='apoio'){$('step').textContent='LEITURA E ORIENTAÇÃO';$('heading').textContent='Ajude seu Fragmento.';$('description').textContent='Acompanhe as instruções e oriente os colegas. Um posiciona e ilumina; o outro examina a etiqueta. Na maquete, você também poderá ler o manuscrito.';}
    if(xrSession&&!xrPlaced){$('heading').textContent='Posicione a escrivaninha.';$('description').textContent='Aponte para uma superfície e confirme quando o círculo aparecer.';$('primary').textContent='Posicionar escrivaninha';$('primary').disabled=!hasHit||!modelReady;}
    for(const id of ['step','heading','description','primary']){
      const element=$(id),words=element.textContent;
      element.textContent=words.replace(/\bluz\b/gi,'💡').replace(/\bvela\b/gi,'🕯️');
      element.setAttribute('aria-label',words);
    }
    const searching=state.stage==='iluminar';
    $('reticle').style.display=searching&&!orbiting?'block':'none';$('progress').style.display=searching&&role==='conhecimento'?'block':'none';
    $('count').textContent=state.evidence.length;
    controls.mouseButtons.LEFT=role==='conhecimento'?THREE.MOUSE.ROTATE:(orbiting?THREE.MOUSE.ROTATE:null);controls.mouseButtons.RIGHT=THREE.MOUSE.ROTATE;
    controls.enabled=fallback&&!xrSession&&!draggingCandle&&(orbiting||role==='conhecimento'||state.stage==='iluminar');
    $('orbit').disabled=!!xrSession;$('below').disabled=!!xrSession || !modelReady;
    placement.visible=role==='luz'&&!xrSession&&state.stage==='posicionar';
    holder.visible=role==='luz'&&state.stage==='castical'; candle.visible=role==='luz'&&['posicionar','castical'].includes(state.stage);
    if(candle.visible){ camera.add(candle); candle.position.set(0,-.08,-.55); candle.scale.setScalar(.5); candle.rotation.set(0,0,-.06); }
    torch.visible=searching||state.stage==='encontrado'||state.stage==='registrado';
    const dark=state.stage==='apagao'; ambient.intensity=dark?.08:.32; windowLight.intensity=dark?.1:.8; rim.intensity=dark?.1:.4;
    if(role!=='conhecimento')clue.material.opacity=0;
    $('candle-grip').hidden=role!=='luz'||state.stage!=='castical'||(!!xrSession&&!xrPlaced)||!connected;
    $('socket').hidden=true; // Encontrar o castical faz parte do desafio: sem marcador que entregue o lugar.
  }
  function dockCandle(){
    if(role!=='luz'||state.stage!=='castical'||!connected)return;
    draggingCandle=false;snapReady=false;dispatch('encaixar');
    lightTransfer=reduced?0:1.2;holder.visible=lightTransfer>0;candle.visible=lightTransfer>0;
    holder.add(candle);candle.position.set(0,.153,0);candle.scale.setScalar(1);candle.rotation.set(0,0,0);
    notify('Agora essa luz pode esclarecer um segredo escondido que só seu colega consegue ver!');
  }
  function placeAtHit(){
    if(!modelReady||!xrSession||xrPlaced||!hasHit)return;
    deskRoot.position.setFromMatrixPosition(reticle.matrix);deskRoot.quaternion.setFromRotationMatrix(reticle.matrix);
    xrPlaced=true;deskRoot.visible=true;reticle.visible=false;
    if(role==='luz'&&state.stage==='posicionar'){beginAction();dispatch('posicionar');}else updateUI();
  }
  function openFragment(){
    if(role!=='conhecimento')return;
    $('fragment-card').innerHTML=Mosaico3D.htmlCartao3D('ac-estudo','<span class="eyebrow" style="color:#6b5831">SOB AS GAVETAS</span><h3>Uma etiqueta escondida.</h3><p>'+clueText+'</p>','<h3>O lar em miniatura.</h3><p>Registre a pista. A próxima descoberta depende de interpretar o lugar que ela descreve.</p>');
    $('fragment-card').querySelector('.m3d-card-back').setAttribute('aria-hidden','true');
    $('follow-clue').hidden=state.stage!=='registrado';
    $('register').disabled=registerPending||state.stage==='registrado';$('register').textContent=state.stage==='registrado'?'Guardado neste estudo':registerPending?'Guardando…':'Guardar no dossiê deste estudo';
    if(!$('fragment').open)$('fragment').showModal();
  }
  on($('primary'),'click',()=>{
    if(xrSession&&!xrPlaced){placeAtHit();return;}
    if(role!=='luz'||!fallback)return;beginAction();
    if(state.stage==='apagao')dispatch('energia');
    else if(state.stage==='posicionar'){
      if(xrSession){if(!hasHit)return;deskRoot.position.setFromMatrixPosition(reticle.matrix);const q=new THREE.Quaternion().setFromRotationMatrix(reticle.matrix);deskRoot.quaternion.copy(q);}
      dispatch('posicionar');
    } else if(state.stage==='castical'){
      dockCandle();
    } else if(state.stage==='iluminar'){return;}
    else openFragment();
  });
  on($('follow-clue'),'click',()=>{if(shared?.maquete)location.href='AC-maquete.html'+location.search;else dispatch('iniciar_maquete');});
  on($('register'),'click',async()=>{
    if(registerPending||state.stage!=='encontrado')return;
    if(!connected||!coop){notify('Aguarde a reconexão para guardar a pista.');return;}
    registerPending=true;openFragment();
    try{const accepted=await coop.send('registrar');if(!accepted&&state.stage!=='registrado')notify('A pista ainda não foi registrada. Aguarde a atualização da dupla e tente novamente.');}
    catch(_){notify('Não foi possível confirmar o registro. Aguarde a reconexão e tente novamente.');}
    finally{registerPending=false;if($('fragment').open)openFragment();}
  });
  on($('dossier'),'click',()=>{if(state.stage==='encontrado'||state.stage==='registrado')openFragment();else notify('O dossiê está vazio. Investigue a borda inferior da escrivaninha.');});
  on($('help'),'click',()=>$('instructions').showModal());
  on($('accessible'),'change',updateUI);
  function moveDeskOnFloor(event){
    if(xrSession)return false;
    dragRay.setFromCamera(new THREE.Vector2(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2),camera);
    if(!dragRay.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),dragPoint)||dragPoint.distanceTo(camera.position)>=12)return false;
    deskRoot.position.set(0,0,0);return true;
  }
  on(renderer.domElement,'pointerdown',event=>{
    if(role!=='luz'||!connected||!fallback||state.stage!=='posicionar'||xrSession||!modelReady||orbiting)return;beginAction();
    if(moveDeskOnFloor(event)){draggingDesk=true;renderer.domElement.setPointerCapture(event.pointerId);}
  });
  on(renderer.domElement,'pointermove',event=>{if(draggingDesk)moveDeskOnFloor(event);});
  on(renderer.domElement,'pointerup',event=>{if(!draggingDesk)return;draggingDesk=false;if(renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);dispatch('posicionar');});
  on(renderer.domElement,'pointercancel',()=>{draggingDesk=false;});
  on(renderer.domElement,'click',event=>{
    if(!modelReady||!connected||orbiting||draggingCandle)return;
    if(xrSession&&!xrPlaced){placeAtHit();return;}
    if(role!=='luz'||(!fallback&&!xrSession))return;beginAction();
    if(state.stage==='posicionar'){
      const p=new THREE.Vector2(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2);
      dragRay.setFromCamera(p,camera);const ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
      if(dragRay.ray.intersectPlane(ground,dragPoint)&&dragPoint.distanceTo(camera.position)<12){
        deskRoot.position.set(0,0,0);
        dispatch('posicionar');
      }else notify('Toque em uma região do chão.');
    }else if(state.stage==='encontrado'){openFragment();}
  });
  function screenPoint(object,offset){
    const active=xrSession?renderer.xr.getCamera(camera).cameras[0]:camera;
    const world=object.localToWorld(offset.clone()).project(active||camera);
    return {x:(world.x+1)*innerWidth/2,y:(1-world.y)*innerHeight/2,visible:world.z>-1&&world.z<1};
  }
  on($('candle-grip'),'pointerdown',event=>{
    if(role!=='luz'||!connected||state.stage!=='castical'||!modelReady||(!fallback&&!xrSession))return;beginAction();
    event.preventDefault();event.stopPropagation();draggingCandle=true;controls.enabled=false;
    $('candle-grip').setPointerCapture(event.pointerId);
    const active=xrSession?renderer.xr.getCamera(camera).cameras[0]:camera;
    const socketWorld=holder.localToWorld(new THREE.Vector3(0,.153,0));
    const normal=new THREE.Vector3();(active||camera).getWorldDirection(normal);dragPlane.setFromNormalAndCoplanarPoint(normal,socketWorld);
    scene.attach(candle);candle.scale.setScalar(1);
  });
  on($('candle-grip'),'pointermove',event=>{
    if(!draggingCandle)return;event.preventDefault();
    const active=xrSession?renderer.xr.getCamera(camera).cameras[0]:camera;
    dragRay.setFromCamera(new THREE.Vector2(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2),active||camera);
    if(dragRay.ray.intersectPlane(dragPlane,dragPoint))candle.position.copy(dragPoint);
    const socketWorld=holder.localToWorld(new THREE.Vector3(0,.153,0));
    snapReady=machine.canDock(candle.position.distanceTo(socketWorld));
    $('socket').classList.toggle('ready',snapReady);$('socket').firstElementChild.textContent=snapReady?'Solte para encaixar':'Castiçal';
  });
  function endDrag(event){
    if(!draggingCandle)return;draggingCandle=false;
    if($('candle-grip').hasPointerCapture(event.pointerId))$('candle-grip').releasePointerCapture(event.pointerId);
    if(snapReady&&event.type!=='pointercancel')dockCandle();else {snapReady=false;updateUI();notify('Aproxime a base da vela do castiçal e solte no encaixe.');}
    $('socket').classList.remove('ready');$('socket').firstElementChild.textContent='Castiçal';
  }
  on($('candle-grip'),'pointerup',endDrag);on($('candle-grip'),'pointercancel',endDrag);
  document.querySelectorAll('[data-close]').forEach(b=>on(b,'click',()=>b.closest('dialog').close()));
  on($('restart'),'click',()=>{
    $('restart').disabled=true;
    $('instructions').close();
    const next=new URL(location.pathname,location.origin);
    next.searchParams.set('iniciar','1');
    const scenario=new URLSearchParams(location.search).get('cenario');
    if(scenario)next.searchParams.set('cenario',scenario);
    location.href=next.href;
  });
  on($('orbit'),'click',()=>{orbiting=!orbiting;$('orbit').setAttribute('aria-pressed',String(orbiting));$('orbit').textContent=orbiting?'💡':'Girar a mesa';$('orbit').setAttribute('aria-label',orbiting?'Voltar à luz':'Girar a mesa');hold=0;updateUI();});
  on($('below'),'click',()=>{camera.position.copy(deskRoot.localToWorld(new THREE.Vector3(.47,.025,.25)));controls.target.copy(deskRoot.localToWorld(new THREE.Vector3(.47,.098,.10)));controls.update();orbiting=false;$('orbit').setAttribute('aria-pressed','false');$('orbit').textContent='Girar a mesa';pointer.set(0,0);hold=0;updateUI();});
  on(renderer.domElement,'pointermove',event=>{if(orbiting||xrSession)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);$('reticle').style.left=event.clientX+'px';$('reticle').style.top=event.clientY+'px';});
  on(window,'keydown',e=>{if($('fragment').open||$('instructions').open||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();pointer.x=THREE.MathUtils.clamp(pointer.x+(e.key==='ArrowRight'?.035:e.key==='ArrowLeft'?-.035:0),-1,1);pointer.y=THREE.MathUtils.clamp(pointer.y+(e.key==='ArrowUp'?.035:e.key==='ArrowDown'?-.035:0),-1,1);$('reticle').style.left=(pointer.x+1)*innerWidth/2+'px';$('reticle').style.top=(1-pointer.y)*innerHeight/2+'px';});

  on($('motion'),'click',async()=>{
    try{if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted'){setFallback('Movimento não autorizado.');notify('Movimento não autorizado. Continue por toque.');return;}motionEnabled=!motionEnabled;motionOrigin=null;$('motion').textContent=motionEnabled?'Desativar movimento':'Usar movimento';}
    catch(_){notify('Não foi possível ativar movimento. Continue por toque.');}
  });

  on(window,'deviceorientation',e=>{if(!motionEnabled||xrSession||e.beta===null||e.gamma===null)return;if(!motionOrigin)motionOrigin={beta:e.beta,gamma:e.gamma};pointer.set(THREE.MathUtils.clamp((e.gamma-motionOrigin.gamma)/35,-1,1),THREE.MathUtils.clamp(-(e.beta-motionOrigin.beta)/35,-1,1));$('reticle').style.left=(pointer.x+1)*innerWidth/2+'px';$('reticle').style.top=(1-pointer.y)*innerHeight/2+'px';});

  on($('ar'),'click',async()=>{
    if(xrSession){await xrSession.end();return;}
    const generation=++xrGeneration;
    try{
      const session=await navigator.xr.requestSession('immersive-ar',{requiredFeatures:['hit-test','dom-overlay'],domOverlay:{root:document.body}});
      if(disposed||generation!==xrGeneration){await session.end();return;}
      fallback=false;xrSession=session;xrPlaced=false;deskRoot.visible=false;$('accessible').checked=false;$('accessible').closest('label').hidden=true;beginAction();
      session.addEventListener('select',()=>{if(!xrPlaced)placeAtHit();});
      session.addEventListener('end',()=>{hitSource?.cancel();hitSource=null;xrSession=null;hasHit=false;reticle.visible=false;environment.visible=true;deskRoot.visible=true;scene.background=new THREE.Color(0x091515);scene.fog=new THREE.Fog(0x091515,6,14);document.body.classList.remove('in-ar');$('ar').textContent='Colocar em RA';deskRoot.position.set(0,0,0);deskRoot.quaternion.identity();frameDesk();setFallback('A sessão de RA foi encerrada.');},{once:true});
      renderer.xr.setReferenceSpaceType('local');await renderer.xr.setSession(session);
      const viewer=await session.requestReferenceSpace('viewer');
      if(disposed||xrSession!==session)return;
      hitSource=await session.requestHitTestSource({space:viewer});
      if(disposed||xrSession!==session){hitSource.cancel();hitSource=null;return;}
      scene.background=null;scene.fog=null;environment.visible=false;document.body.classList.add('in-ar');$('ar').textContent='Sair da RA';
      // A posicao fisica nao persiste entre sessoes. O dossie permanece intacto.
      if(state.stage==='apagao')dispatch('energia');
      notify('Aponte para o chão e toque no círculo para posicionar a escrivaninha.');updateUI();
    }catch(_){notify('RA não autorizada ou indisponível. Continue em 3D.');if(xrSession)await xrSession.end();setFallback('RA não autorizada ou indisponível.');}
  });
  if(navigator.xr)navigator.xr.isSessionSupported('immersive-ar').then(supported=>{if(disposed)return;arSupported=supported;if(!supported)setFallback('RA não disponível neste navegador.');else updateUI();}).catch(()=>setFallback('Não foi possível verificar a RA.'));else setFallback('RA não disponível neste navegador.');

  ACDesk.load(model=>{
    if(disposed){disposeObject(model);return;}
    desk=model;
    desk.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    deskRoot.add(desk);modelReady=true;$('loading').hidden=true;updateUI();
  },()=>{$('loading').textContent='Não foi possível carregar a escrivaninha. Recarregue a página para tentar novamente.';});

  const clock=new THREE.Clock(); let lastTime=0;
  function render(time,frame){
    if(disposed)return;const dt=Math.min(clock.getDelta(),.1),t=time*.001;
    if(document.hidden){hold=0;return;}
    if(xrSession&&frame&&hitSource){const hits=frame.getHitTestResults(hitSource);hasHit=hits.length>0;if(hasHit){const pose=hits[0].getPose(renderer.xr.getReferenceSpace());if(pose)reticle.matrix.fromArray(pose.transform.matrix);}reticle.visible=hasHit&&!xrPlaced;if(!xrPlaced)$('primary').disabled=!hasHit||!modelReady;}
    if(!xrSession){controls.update();room.updateReflection(renderer,scene);}
    if(role==='luz'&&state.stage==='castical'&&(!xrSession||xrPlaced)&&connected){
      scene.updateMatrixWorld(true);
      const cp=screenPoint(candle,new THREE.Vector3(0,.10,0)),sp=screenPoint(holder,new THREE.Vector3(0,.153,0));
      $('candle-grip').style.left=cp.x+'px';$('candle-grip').style.top=cp.y+'px';$('candle-grip').hidden=!cp.visible;
      $('socket').style.left=sp.x+'px';$('socket').style.top=sp.y+'px';$('socket').hidden=!sp.visible;
    }
    if(!reduced){flame.scale.set(1+Math.sin(t*9)*.04,1+Math.sin(t*7)*.08,1);flameMaterial.uniforms.time.value=t;}
    const flameCameraPosition=new THREE.Vector3();(xrSession?renderer.xr.getCamera(camera):camera).getWorldPosition(flameCameraPosition);flamePlane.lookAt(flameCameraPosition);
    if(lightTransfer>0){lightTransfer=Math.max(0,lightTransfer-dt);const s=Math.min(1,lightTransfer*2);holder.scale.setScalar(Math.max(.001,s));if(!lightTransfer){holder.visible=false;candle.visible=false;holder.scale.setScalar(1);}}
    const activeCamera=xrSession?(renderer.xr.getCamera(camera).cameras[0]||camera):camera;
    const viewerPosition=new THREE.Vector3();activeCamera.getWorldPosition(viewerPosition);
    if(xrSession){ray.ray.origin.copy(viewerPosition);activeCamera.getWorldDirection(ray.ray.direction);}else ray.setFromCamera(pointer,activeCamera);
    const target=new THREE.Vector3();clue.getWorldPosition(target);
    torch.position.copy(viewerPosition);beamDirection.copy(ray.ray.direction);torch.target.position.copy(torch.position).addScaledVector(beamDirection,2);
    if(role==='luz'&&state.stage==='iluminar'&&connected&&(!xrSession||xrPlaced)&&!beamPending&&time-lastBeam>100){
      lastBeam=time;beamPending=true;
      coop.send('feixe',{origin:deskRoot.worldToLocal(torch.position.clone()).toArray(),target:deskRoot.worldToLocal(torch.target.position.clone()).toArray()}).catch(()=>{}).finally(()=>beamPending=false);
    }
    const beam=shared?.beam;
    const lightLive=!!(connected&&beam&&beam.age<1500&&shared.online.includes('luz')&&performance.now()-lastSnapshot<1800);
    if(role==='conhecimento'){
      torch.visible=lightLive&&['iluminar','encontrado','registrado'].includes(state.stage);
      if(lightLive){torch.position.copy(deskRoot.localToWorld(new THREE.Vector3(...beam.origin)));torch.target.position.copy(deskRoot.localToWorld(new THREE.Vector3(...beam.target)));beamDirection.subVectors(torch.target.position,torch.position).normalize();}
    }
    torch.intensity=4+(!reduced?Math.sin(t*8)*.1:0);
    if(modelReady&&role==='conhecimento'&&state.stage==='iluminar'&&(!xrSession||xrPlaced)&&!$('instructions').open&&!$('fragment').open){
      scene.updateMatrixWorld(true);
      const normal=new THREE.Vector3(0,-1,0).applyQuaternion(deskRoot.quaternion);
      const toLabel=target.clone().sub(torch.position);const lightRay=new THREE.Raycaster(torch.position,toLabel.clone().normalize());
      const obstruction=lightRay.intersectObject(desk,true).find(h=>h.distance<toLabel.length()-.004);
      const viewToLabel=target.clone().sub(viewerPosition);const viewRay=new THREE.Raycaster(viewerPosition,viewToLabel.clone().normalize());
      const viewBlocked=viewRay.intersectObject(desk,true).some(h=>h.distance<viewToLabel.length()-.004);
      const lit=lightLive&&toLabel.clone().normalize().dot(beamDirection)>Math.cos(torch.angle*.85)&&normal.dot(toLabel.clone().normalize())<-.1&&!obstruction;
      const near=viewerPosition.distanceTo(target)<.4;
      const projected=target.clone().project(activeCamera);const inView=Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&projected.z>-1&&projected.z<1;
      const visible=lit&&near&&inView&&!viewBlocked&&normal.dot(viewToLabel.clone().normalize())<-.2;
      clueExposed=visible;clue.material.opacity=visible?.95:0;
      hold=machine.dwell(hold,visible,dt);$('progress').firstElementChild.style.width=(hold/1.2*100)+'%';$('progress').setAttribute('aria-valuenow',String(Math.round(hold/1.2*100)));
      if(hold>=1.2&&!discoverPending){discoverPending=true;coop.send('descobrir').catch(()=>{}).finally(()=>{discoverPending=false;});}
    }
    // O painel so acompanha o ponteiro enquanto esta sendo inspecionado; o giro usa outro no.
    if($('fragment').open&&!reduced){const tilt=$('fragment-card').querySelector('.m3d-card-tilt');if(tilt)tilt.style.transform=`rotateX(${-pointer.y*3}deg) rotateY(${pointer.x*4}deg)`;}
    renderer.render(scene,camera);lastTime=time;
  }
  function disposeObject(root){const textures=new Set(),materials=new Set(),geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);Object.values(m).forEach(v=>{if(v&&v.isTexture)textures.add(v);});}});textures.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());geometries.forEach(x=>x.dispose());}
  function dispose(){if(disposed)return;disposed=true;xrGeneration++;clearTimeout(noticeTimer);renderer.setAnimationLoop(null);coop?.close();cleanup.forEach(fn=>fn());hitSource?.cancel();xrSession?.end().catch(()=>{});controls.dispose();disposeObject(scene);renderer.dispose();}
  on(window,'resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(!xrSession)frameDesk();});
  on(document,'visibilitychange',()=>{hold=0;clock.getDelta();});
  on(window,'pagehide',e=>{if(!e.persisted)dispose();else{hold=0;renderer.setAnimationLoop(null);}});
  on(window,'pageshow',e=>{if(e.persisted&&!disposed){clock.getDelta();renderer.setAnimationLoop(render);}});
  let lastSnapshot=0;
  ACCooperation(snapshot=>{
    if(snapshot.maquete&&!new URLSearchParams(location.search).has('rever')){location.replace('AC-maquete.html'+location.search);return;}
    const previous=state.stage;shared=snapshot;lastSnapshot=performance.now();
    state={...state,stage:snapshot.stage,evidence:snapshot.stage==='registrado'?['ac-etiqueta-maquete']:[]};
    if(previous==='encontrado'&&state.stage==='registrado')notify('Fragmento guardado no dossiê deste estudo.');
    const minutes=Math.floor(snapshot.elapsed/60),seconds=Math.floor(snapshot.elapsed%60);
    $('timer').textContent=String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0')+' · Bônus '+snapshot.bonus+' pontos';
    const other=role==='luz'?'conhecimento':'luz';
    $('coop-status').textContent=snapshot.online.includes(other)?'Dupla conectada':role==='luz'?'Aguardando o portador do conhecimento · convite na ajuda':'Aguardando o portador da luz';
    if(new URLSearchParams(location.search).get('demo')==='solo'&&!new URLSearchParams(location.search).has('sala')){$('timer').textContent='Demonstração · sem pontuação';$('coop-status').textContent='Colega automático: a etiqueta está iluminada. Use Ver por baixo.';}
    if(previous!==state.stage){hold=0;updateUI();if(role==='conhecimento'&&(state.stage==='encontrado'||(state.stage==='registrado'&&$('fragment').open)))openFragment();}
  },online=>{connected=online;if(!online){hold=0;$('coop-status').textContent='Reconectando… a luz compartilhada está suspensa.';}updateUI();}).then(connection=>{
    coop=connection;role=connection.role;
    if(new URLSearchParams(location.search).get('percurso')==='1'){$('restart').hidden=true;document.querySelector('.brand').removeAttribute('href');}
    if(connection.demo){
      $('accessible').checked=true;
      document.querySelector('.edition').textContent='DEMONSTRAÇÃO INDIVIDUAL';
      $('follow-clue').hidden=true;
      $('follow-clue').disabled=true;
    }
    if(connection.invite){$('invite').href=connection.invite;$('invite-wrap').hidden=false;}
    updateUI();if(!startWithoutInstructions&&!connection.demo)$('instructions').showModal();
  }).catch(error=>{$('coop-status').textContent=error.message;$('loading').textContent='A cooperação exige o servidor local da AC.';$('loading').hidden=false;});
  updateUI();renderer.setAnimationLoop(render);

})();
