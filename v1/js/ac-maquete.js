(function(){
  'use strict';
  const $=id=>document.getElementById(id);let role=new URLSearchParams(location.search).get('papel')||'luz';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let coop=null,online=false,data=null,fallback=false,disposed=false,readStart=null,readingSent=false,soloConcluido=false;
  let xr=null,hitSource=null,placed=false,hasHit=false,dragging=false,nearLock=false,pending=false,lastLevel=-1,lastReady=null,noticeTimer;
  const handlers=[];function on(el,type,fn){el.addEventListener(type,fn);handlers.push(()=>el.removeEventListener(type,fn));}
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x091515);
  const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.015,25);scene.add(camera);
  let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{$('description').textContent='Este navegador não conseguiu abrir o modelo 3D.';return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.xr.enabled=true;$('scene').appendChild(renderer.domElement);
  const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.zoomSpeed=2;controls.minDistance=.18;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.49;
  function frame(){
    const mobile=innerWidth<=700,guide=data&&!data.complete&&data.explorer!==role;
    const panel=document.querySelector('.instruction').getBoundingClientRect();
    const manuscript=document.getElementById('manuscript').getBoundingClientRect();
    const top=mobile?(guide?Math.max(190,manuscript.bottom+16):data?.ready||data?.level>0?142:210):115;
    const bottom=mobile?(guide?Math.max(top+160,panel.top-28):Math.max(top+160,panel.top-16)):innerHeight-85;
    const left=mobile?18:Math.min(panel.right+32,innerWidth*.4),right=innerWidth-(mobile?18:35);
    const usableWidth=Math.max(160,right-left),usableHeight=Math.max(160,bottom-top);
    const centerX=(left+right)/2,centerY=(top+bottom)/2;
    camera.setViewOffset(innerWidth,innerHeight,innerWidth/2-centerX,innerHeight/2-centerY,innerWidth,innerHeight);
    controls.target.copy(model.root.localToWorld(new THREE.Vector3(0,data?.complete?.95:data?.level===2?.65:.52,0)));
    const distance=Math.max(3,2.3/(2*Math.tan(Math.PI/9)*camera.aspect)*(innerWidth/usableWidth),
      (data?.complete?2.7:1.9)/(2*Math.tan(Math.PI/9))*(innerHeight/usableHeight));
    camera.position.copy(new THREE.Vector3(1.2,1.2,1.8).normalize().multiplyScalar(distance*(mobile?1.05:1.25)).add(controls.target));controls.update();
  }
  scene.add(new THREE.HemisphereLight(0xbed2e4,0x33251b,.60));const sun=new THREE.DirectionalLight(0xffe1b5,1.45);sun.position.set(-2,4,3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);scene.add(new THREE.AmbientLight(0xffffff,.10));const coastFill=new THREE.DirectionalLight(0x9ebed5,.6);coastFill.position.set(3,2,-2);scene.add(coastFill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0x071014,roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-.385;floor.receiveShadow=true;scene.add(floor);
  const model=createACMaquette();scene.add(model.root);
  const goldDust=createACGoldDust(model.root,{reduced});let keyFlight=null,lastInspected=null,motion=null,motionTime=0,lastMotionSent=0,motionBusy=false,motionRequest=null,finishing=false;
  const tipBeacon=new THREE.Mesh(new THREE.SphereGeometry(.009,12,8),new THREE.MeshBasicMaterial({color:0xffe3a1}));tipBeacon.userData.exportExclude=true;tipBeacon.raycast=()=>{};tipBeacon.visible=false;model.root.add(tipBeacon);
  model.key.userData.exportExclude=true;model.lock.userData.exportExclude=true;
  frame();
  const baseMinY=new THREE.Box3().setFromObject(ACMaquetteSpatial.exportModel({root:model.base})).min.y;
  const placementMatrix=new THREE.Matrix4();let arScale=.5,startingAR=false;
  const touches=new Map();let pinchDistance=0;
  function preparation(){return data?.level===0&&!data.ready&&!data.key;}
  function applyPlacement(){ACMaquetteSpatial.groundedPose(model.root,placementMatrix,arScale,baseMinY);}
  on(renderer.domElement,'pointerdown',e=>{if(xr){touches.set(e.pointerId,new THREE.Vector2(e.clientX,e.clientY));renderer.domElement.setPointerCapture(e.pointerId);}});
  on(renderer.domElement,'pointermove',e=>{
    if(!xr||!touches.has(e.pointerId))return;touches.set(e.pointerId,new THREE.Vector2(e.clientX,e.clientY));
    if(touches.size!==2||!preparation()){pinchDistance=0;return;}
    const values=[...touches.values()],distance=values[0].distanceTo(values[1]);
    if(pinchDistance>0){arScale=THREE.MathUtils.clamp(arScale*distance/pinchDistance,.3,1);if(placed)applyPlacement();}
    pinchDistance=distance;pressPoint=null;
  });
  for(const event of ['pointerup','pointercancel'])on(renderer.domElement,event,e=>{touches.delete(e.pointerId);pinchDistance=0;});
  $('editor-tools').hidden=!new URLSearchParams(location.search).has('edicao');
  on($('export-glb'),'click',()=>{
    const button=$('export-glb');button.disabled=true;button.textContent='Preparando modelo…';
    try{new THREE.GLTFExporter().parse(ACMaquetteSpatial.exportModel(model),result=>{
      const url=URL.createObjectURL(new Blob([result],{type:'model/gltf-binary'})),link=document.createElement('a');link.href=url;link.download='a-casa-maquete.glb';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);button.disabled=false;button.textContent='Baixar modelo GLB';
    },{binary:true,onlyVisible:false});}catch{button.disabled=false;button.textContent='Baixar modelo GLB';notify('Não foi possível exportar o modelo.');}
  });
  on($('reposition'),'click',()=>{if(!xr)return;placed=false;hasHit=false;model.root.visible=false;reticle.visible=false;$('instructions').close();update();});
  const reticle=new THREE.Mesh(new THREE.RingGeometry(.12,.135,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xf2d194}));reticle.matrixAutoUpdate=false;reticle.visible=false;scene.add(reticle);
  const ray=new THREE.Raycaster(),point=new THREE.Vector3(),dragPlane=new THREE.Plane();let pressPoint=null;
  const allowed=[['rosa','folha','ondas'],['relogio','escrivaninha','louca'],['armario-oeste','armario-sul','armario-norte','armario-leste']];
  function notify(text){$('notice').textContent=text;$('notice').style.display='block';clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').style.display='none',3500);}
  function cameraNow(){return xr?(renderer.xr.getCamera(camera).cameras[0]||camera):camera;}
  function visibleObject(object){for(let node=object;node;node=node.parent)if(!node.visible)return false;return true;}
  function activeTargets(){return model.targets.filter(o=>allowed[data?.level]?.includes(o.userData.object));}
  function canExplore(){return online&&data&&!data.complete&&data.explorer===role&&data.ready&&(!xr||placed);}
  async function send(type,extra={}){if(!online||!coop||pending)return false;pending=true;try{return await coop.send(type,extra);}catch{notify('Aguarde a reconexão da dupla.');return false;}finally{pending=false;}}
  function update(){
    if(!data){$('heading').textContent='Siga a pista da escrivaninha.';$('description').textContent='Encontre e registre a etiqueta com seu colega para liberar esta investigação.';return;}
    $('step').textContent=data.name;$('score').textContent='Chaves '+data.evidence.length+' · '+data.score+' pontos de ensaio';
    const explore=data.explorer===role;
    model.lock.visible=!explore&&!data.complete;
    document.body.dataset.roleMode=data.complete?'complete':explore?'explorer':'guide';
    document.body.classList.toggle('investigating',data.ready||data.level>0);
    $('reposition').hidden=!xr||!placed;
    $('scale-note').textContent=preparation()?'Em RA, use dois dedos para ajustar o tamanho antes da primeira leitura.':'O tamanho está fixo para esta investigação. Você pode reposicionar a maquete nas instruções.';
    $('manuscript').hidden=explore||data.complete;
    $('clue').textContent=data.ready?(data.clue||'Oriente seu colega pela voz.'):'Segure o manuscrito para ler e orientar seu colega.';
    $('heading').textContent=data.complete?'O espaço que faltava.':explore?'Seu olhar encontra o caminho.':'Sua leitura orienta o caminho.';
    $('description').textContent=data.complete?'A fundação revelou uma passagem sob a despensa. A descoberta foi guardada.':explore?(data.ready?(data.key?'Você encontrou a chave. Só seu colega vê a fechadura. Siga a orientação dele e leve a ponta da chave até ela.':'Ouça a orientação do colega. Aproxime-se e toque no detalhe correspondente.'):'Aguarde seu colega ler o manuscrito.'):data.ready?'Compartilhe a orientação com seu colega. Só ele pode manipular a chave deste piso.':'Mantenha o dedo no manuscrito por um instante.';
    $('alternative').hidden=!fallback||!explore||data.complete||data.key;
    if(!canExplore()){keyFlight=null;goldDust.resetTrail();dragging=false;nearLock=false;readStart=null;controls.enabled=!xr;$('key-grip').classList.remove('ready');}
    $('key-grip').hidden=!canExplore()||!data.key;
    model.key.visible=data.key&&explore;

    for(const target of model.targets)target.visible=activeTargets().includes(target);
    const changed=lastLevel!==data.level;
    if(changed){model.key.position.set(.30,.25,.91);lastLevel=data.level;readingSent=false;readStart=null;}
    if(changed||lastReady!==data.ready){lastReady=data.ready;if(!xr)frame();}
    if(data.complete&&changed){$('final-score').textContent='3 chaves · '+data.score+' pontos de ensaio. Nenhuma acusação foi concluída.';$('discovery').showModal();}

    if(xr&&!placed){$('heading').textContent='Posicione a maquete.';$('description').textContent='Aponte para uma superfície e toque no círculo. Depois, examine a casa de perto.';}
    if(!online)$('description').textContent='A dupla precisa estar conectada para continuar. O progresso está preservado neste servidor.';
  }
  function inspect(object){if(!canExplore()||data.key)return;lastInspected=object;send('maquete_examinar',{object});}
  on(renderer.domElement,'pointerdown',e=>{pressPoint={x:e.clientX,y:e.clientY};});
  on(renderer.domElement,'pointerup',e=>{
    if(!pressPoint||Math.hypot(e.clientX-pressPoint.x,e.clientY-pressPoint.y)>8)return;pressPoint=null;
    if(xr&&!placed){place();return;}if(!canExplore())return;
    ray.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),cameraNow());
    const hits=ray.intersectObjects(activeTargets(),true).filter(h=>visibleObject(h.object));if(!hits.length)return;
    const first=hits[0],all=ray.intersectObject(model.root,true);const obstruction=all.find(h=>visibleObject(h.object)&&h.object!==first.object&&!h.object.userData.decoration&&h.distance<first.distance-.01);
    if(obstruction)return;let object=first.object;while(!object.userData.object&&object.parent)object=object.parent;
    if(cameraNow().getWorldPosition(point).distanceTo(first.point)>1.5*model.root.scale.x){notify('Aproxime-se para examinar o detalhe.');return;}inspect(object.userData.object);
  });
  on(renderer.domElement,'pointercancel',()=>pressPoint=null);
  on(controls,'start',()=>document.body.classList.add('manipulating'));
  on(controls,'end',()=>document.body.classList.remove('manipulating'));
  on(window,'blur',()=>document.body.classList.remove('manipulating'));
  on($('manuscript'),'pointerdown',e=>{if(!online||data?.ready)return;e.preventDefault();readStart=performance.now();$('manuscript').setPointerCapture(e.pointerId);});
  for(const event of ['pointerup','pointercancel','blur'])on($('manuscript'),event,()=>{readStart=null;});
  on($('manuscript'),'keydown',e=>{if(e.key==='Enter'&&!e.repeat){e.preventDefault();send('maquete_orientar');}else if(e.key===' '&&!e.repeat){e.preventDefault();readStart=performance.now();}});on($('manuscript'),'keyup',()=>readStart=null);
  on($('key-grip'),'pointerdown',e=>{if(!canExplore()||!data.key||keyFlight||finishing)return;e.preventDefault();dragging=true;goldDust.resetTrail();goldDust.trace(model.key.position);controls.enabled=false;$('key-grip').setPointerCapture(e.pointerId);const offset=model.keyTip.getWorldPosition(new THREE.Vector3()).sub(model.key.getWorldPosition(new THREE.Vector3()));const world=model.keySocket.getWorldPosition(new THREE.Vector3()).sub(offset);dragPlane.setFromNormalAndCoplanarPoint(cameraNow().getWorldDirection(new THREE.Vector3()),world);});
  on($('key-grip'),'pointermove',e=>{if(!dragging)return;ray.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),cameraNow());if(ray.ray.intersectPlane(dragPlane,point))model.key.position.copy(model.root.worldToLocal(point.clone()));goldDust.trace(model.key.position);nearLock=ACMaquetteSpatial.keyFits(model);publishMotion();});
  function tipLocal(){return model.root.worldToLocal(model.keyTip.getWorldPosition(new THREE.Vector3())).toArray();}
  async function publishMotion(force=false){
    if(!coop||!canExplore()||!data.key)return false;
    if(!force&&(motionBusy||performance.now()-lastMotionSent<100))return false;
    if(force&&motionRequest)await motionRequest.catch(()=>{});
    lastMotionSent=performance.now();motionBusy=true;
    try{motionRequest=coop.send('maquete_mover',{tip:tipLocal()});return await motionRequest;}catch{return false;}finally{motionBusy=false;motionRequest=null;}
  }
  async function finishKey(){
    if(finishing||!canExplore())return;finishing=true;
    try{if(await publishMotion(true)){const ok=await send('maquete_encaixar');if(!ok)notify('Peça ao colega para orientar a ponta até a fechadura.');}}finally{finishing=false;nearLock=false;goldDust.resetTrail();}
  }
  for(const event of ['pointerup','pointercancel'])on($('key-grip'),event,e=>{if(!dragging)return;dragging=false;controls.enabled=!xr;$('key-grip').releasePointerCapture(e.pointerId);if(event==='pointerup')finishKey();else{nearLock=false;goldDust.resetTrail();}});
  on($('key-grip'),'keydown',e=>{
    if(!canExplore()||!data.key||keyFlight||finishing)return;
    const delta={ArrowLeft:[-.008,0,0],ArrowRight:[.008,0,0],ArrowUp:[0,.008,0],ArrowDown:[0,-.008,0],PageUp:[0,0,-.008],PageDown:[0,0,.008]}[e.key];
    if(delta){e.preventDefault();model.key.position.add(new THREE.Vector3(...delta));goldDust.trace(model.key.position);publishMotion();}
    if(e.key==='Enter'){e.preventDefault();finishKey();}
  });
  on($('alternative'),'click',()=>{
    $('object-list').replaceChildren();for(const obj of activeTargets()){const button=document.createElement('button');button.textContent=obj.userData.label;button.onclick=()=>{inspect(obj.userData.object);$('objects').close();};$('object-list').appendChild(button);}$('objects').showModal();
  });

  on($('help'),'click',()=>$('instructions').showModal());document.querySelectorAll('[data-close]').forEach(el=>on(el,'click',()=>el.closest('dialog').close()));
  on(document.body,'beforexrselect',e=>{if(e.target.closest('dialog,header,.tools,#manuscript,#key-grip'))e.preventDefault();});
  const previousParams=new URLSearchParams(location.search);previousParams.set('rever','1');$('return-desk').href='AC-escrivaninha.html?'+previousParams;
  function enableFallback(reason){fallback=true;$('fallback-note').textContent=reason+' A exploração continua em 3D, com uma alternativa por nomes de objetos.';update();}
  function place(){if(!xr||placed||!hasHit)return;placementMatrix.copy(reticle.matrix);applyPlacement();model.root.visible=true;placed=true;reticle.visible=false;update();}
  on($('ar'),'click',async()=>{
    if(xr){await xr.end();return;}if(startingAR)return;startingAR=true;
    try{
      const session=await navigator.xr.requestSession('immersive-ar',{requiredFeatures:['hit-test','dom-overlay'],domOverlay:{root:document.body}});if(disposed){await session.end();return;}
      camera.clearViewOffset();xr=session;placed=false;hasHit=false;touches.clear();pinchDistance=0;controls.enabled=false;model.root.visible=false;
      session.addEventListener('select',place);
      session.addEventListener('end',()=>{hitSource?.cancel();hitSource=null;xr=null;placed=false;reticle.visible=false;floor.visible=true;model.root.visible=true;model.root.position.set(0,0,0);model.root.quaternion.identity();model.root.scale.setScalar(1);hasHit=false;touches.clear();scene.background=new THREE.Color(0x091515);document.body.classList.remove('in-ar');$('ar').textContent='Explorar em RA';controls.enabled=true;frame();enableFallback('A sessão de RA foi encerrada.');},{once:true});
      renderer.xr.setReferenceSpaceType('local');await renderer.xr.setSession(session);if(xr!==session||disposed)return;const viewer=await session.requestReferenceSpace('viewer');if(xr!==session||disposed)return;const source=await session.requestHitTestSource({space:viewer});if(xr!==session||disposed){source.cancel();return;}hitSource=source;
      fallback=false;floor.visible=false;scene.background=null;document.body.classList.add('in-ar');$('ar').textContent='Sair da RA';update();
    }catch{if(xr)await xr.end().catch(()=>{});enableFallback('RA indisponível ou não autorizada.');}finally{startingAR=false;}
  });
  if(navigator.xr)navigator.xr.isSessionSupported('immersive-ar').then(supported=>{if(disposed)return;$('ar').hidden=!supported;if(!supported)enableFallback('Este navegador não oferece RA.');}).catch(()=>enableFallback('Não foi possível iniciar RA.'));else enableFallback('Este navegador não oferece RA.');
  let lastTime=0;
  function render(time,frameXR){
    if(disposed)return;const dt=Math.min(.1,(time-lastTime)/1000||0);lastTime=time;
    if(document.hidden){readStart=null;return;}
    if(xr&&frameXR&&hitSource){const hits=frameXR.getHitTestResults(hitSource);hasHit=!!hits.length;if(hasHit){const pose=hits[0].getPose(renderer.xr.getReferenceSpace());hasHit=!!pose;if(pose)reticle.matrix.fromArray(pose.transform.matrix);}reticle.visible=hasHit&&!placed;}
    if(!xr)controls.update();
    if(readStart!==null&&!readingSent&&data&&!data.ready&&online){const amount=Math.min(1,(time-readStart)/1000);$('reading').firstElementChild.style.width=amount*100+'%';if(amount===1){readingSent=true;send('maquete_orientar').then(ok=>{if(!ok)readingSent=false;});}}else if(!data?.ready)$('reading').firstElementChild.style.width='0';
    const level=data?.level||0;
    // Abertura por partes: o segredo nao aparece antes da ultima chave.
    for(const [g,lift] of [[model.roof,level>0?1.5:0],[model.upper,level===1?1.2:level===3?.95:0],[model.lower,level>2?.48:0]]){
      const target=g.userData.restY+lift;g.position.y=reduced?target:THREE.MathUtils.lerp(g.position.y,target,1-Math.exp(-dt*4));g.visible=!(g===model.roof&&level>0&&g.position.y>1.7)&&!(g===model.upper&&level===1&&g.position.y>1.45);
    }
    model.facades[0].visible=level===0;model.facades[1].visible=level<2;
    model.cellar.visible=level>=3;
    if(keyFlight){keyFlight.elapsed+=dt;const t=Math.min(1,keyFlight.elapsed/.8),ease=t*t*(3-2*t);model.key.position.copy(keyFlight.from).lerp(keyFlight.to,ease);model.key.position.y+=Math.sin(Math.PI*t)*.10;if(t===1)keyFlight=null;}
    goldDust.update(dt,model.key.visible&&canExplore()&&(dragging||keyFlight)?model.key.position:null,innerHeight*renderer.getPixelRatio());
    if(model.key.visible){model.root.updateMatrixWorld(true);const screen=model.key.getWorldPosition(new THREE.Vector3()).project(cameraNow());$('key-grip').style.left=(screen.x+1)*innerWidth/2+'px';$('key-grip').style.top=(1-screen.y)*innerHeight/2+'px';$('key-grip').hidden=!!keyFlight||!canExplore()||!data?.key||screen.z< -1||screen.z>1;}
    if(model.key.visible&&canExplore()&&!keyFlight&&!finishing)publishMotion();
    const guiding=data&&!data.complete&&data.explorer!==role;
    const fresh=motion&&performance.now()-motionTime+motion.age<1500;
    tipBeacon.visible=!!(guiding&&data.key&&fresh&&online&&(!xr||placed));
    $('alignment').hidden=!guiding||!data.key;
    if(tipBeacon.visible){tipBeacon.position.fromArray(motion.tip);const socket=model.root.worldToLocal(model.keySocket.getWorldPosition(new THREE.Vector3()));const distance=tipBeacon.position.distanceTo(socket);$('alignment').textContent=distance<.025?'Ponta alinhada. Diga ao colega para soltar.':distance<.10?'A ponta está perto. Oriente o ajuste final.':'O ponto luminoso mostra a ponta da chave. Oriente seu colega até a fechadura.';}
    else if(guiding&&data.key)$('alignment').textContent='Aguarde seu colega mover a chave para acompanhar a ponta.';
    if(!xr&&model.lower.visible)model.livingRoom.updateReflection(renderer,scene);
    renderer.render(scene,camera);
  }
  ACCooperation(snapshot=>{
    if(snapshot.soloRole)role=snapshot.soloRole;
    motion=snapshot.keyMotion;motionTime=performance.now();
    const old=data,wasOnline=online;data=snapshot.maquete;online=(snapshot.percurso?.fragmento?.membros.map(m=>m.papel)||['luz','conhecimento']).every(r=>snapshot.online.includes(r));$('coop-status').textContent=online?'Dupla conectada':'Aguardando seu colega';
    if(old&&data&&data.mistakes>old.mistakes)notify('Esse detalhe não corresponde à orientação. Converse com seu colega.');
    if(old&&data&&data.level>old.level){keyFlight=null;goldDust.resetTrail();goldDust.burst(model.root.worldToLocal(model.lock.getWorldPosition(new THREE.Vector3())));}
    if(!old||wasOnline!==online||JSON.stringify(old)!==JSON.stringify(data))update();
    if(old&&data&&!old.key&&data.key&&data.explorer===role){
      const source=model.targets.find(o=>o.userData.object===lastInspected);
      const origin=source?model.root.worldToLocal(source.getWorldPosition(new THREE.Vector3())):model.key.position.clone();
      goldDust.burst(origin);goldDust.resetTrail();
      if(!reduced){keyFlight={from:origin.clone(),to:new THREE.Vector3(.30,.25,.91),elapsed:0};model.key.position.copy(origin);}
    }
    if(data&&data.complete&&!soloConcluido&&new URLSearchParams(location.search).get('demo')==='solo'){
      soloConcluido=true;
      try{parent.postMessage({mosaico:'ac-solo-completo',score:data.score,evidence:data.evidence},location.origin)}catch(_){ }
    }
  },connected=>{if(!connected){online=false;$('coop-status').textContent='Reconectando…';update();}},{maquette:true}).then(c=>{coop=c;if(new URLSearchParams(location.search).get('percurso')==='1')document.querySelector('.brand').removeAttribute('href');const backParams=new URLSearchParams(location.search);backParams.set('rever','1');$('return-desk').href='AC-escrivaninha.html?'+backParams;if(c.invite){$('invite').href=c.invite;$('invite').hidden=false;}$('instructions').showModal();}).catch(e=>{$('description').textContent=e.message;});
  on(window,'resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(!xr)frame();});
  on(document,'visibilitychange',()=>readStart=null);
  on(window,'pagehide',e=>{if(e.persisted){renderer.setAnimationLoop(null);return;}disposed=true;goldDust.dispose();clearTimeout(noticeTimer);coop?.close();hitSource?.cancel();xr?.end().catch(()=>{});handlers.forEach(fn=>fn());controls.dispose();renderer.setAnimationLoop(null);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.bumpMap?.dispose();m.dispose();});renderer.dispose();});
  on(window,'pageshow',e=>{if(e.persisted&&!disposed){lastTime=performance.now();renderer.setAnimationLoop(render);}});
  update();renderer.setAnimationLoop(render);
})();
