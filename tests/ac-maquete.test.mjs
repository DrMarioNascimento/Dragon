import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startMaquette,actMaquette,maquetteView} from '../ferramentas/ac-maquete-state.mjs';
import {createRoom,apply,snapshot} from '../ferramentas/ac-cooperacao.mjs';
test('manuscrito e papel se alternam; respostas nao vazam na visao do explorador',()=>{
 const s=startMaquette();assert.equal(maquetteView(s,'luz').clue,null);assert.match(maquetteView(s,'conhecimento').clue,/direções/);
 assert.equal(actMaquette(s,'luz',{type:'maquete_orientar'}),false);
 assert.equal(actMaquette(s,'luz',{type:'maquete_examinar',object:'rosa'}),false);
 actMaquette(s,'conhecimento',{type:'maquete_orientar'});
 assert.equal(actMaquette(s,'conhecimento',{type:'maquete_examinar',object:'rosa'}),false);
 actMaquette(s,'luz',{type:'maquete_examinar',object:'rosa'});actMaquette(s,'luz',{type:'maquete_encaixar'});
 assert.equal(s.level,1);assert.equal(maquetteView(s,'conhecimento').clue,null);assert.match(maquetteView(s,'luz').clue,/guardião/);
});
test('fundacao so e liberada por tres chaves em ordem e nao repete recompensa',()=>{
 const s=startMaquette();for(const [i,object] of ['rosa','relogio','armario-oeste'].entries()){
  const explorer=i===1?'conhecimento':'luz',guide=i===1?'luz':'conhecimento';
  assert.equal(actMaquette(s,explorer,{type:'maquete_encaixar'}),false);
  actMaquette(s,guide,{type:'maquete_orientar'});actMaquette(s,explorer,{type:'maquete_examinar',object});actMaquette(s,explorer,{type:'maquete_encaixar'});
  assert.equal(maquetteView(s,explorer).complete,i===2);
 }
 assert.equal(s.score,24);assert.equal(s.evidence.length,3);assert.equal(actMaquette(s,'luz',{type:'maquete_encaixar'}),false);assert.equal(s.score,24);
});
test('erros reduzem recompensa sem impedir concluir e repeticoes rapidas nao contam',()=>{
 const s=startMaquette();actMaquette(s,'conhecimento',{type:'maquete_orientar'});
 actMaquette(s,'luz',{type:'maquete_examinar',object:'ondas'},1000);assert.equal(actMaquette(s,'luz',{type:'maquete_examinar',object:'ondas'},1100),false);
 for(let i=2;i<12;i++)actMaquette(s,'luz',{type:'maquete_examinar',object:'ondas'},i*1000);
 actMaquette(s,'luz',{type:'maquete_examinar',object:'rosa'},13000);actMaquette(s,'luz',{type:'maquete_encaixar'},14000);assert.equal(s.score,2);
});
test('sequencia da escrivaninha exige registro e dupla online; snapshots preservam maquete',()=>{
 const r=createRoom();assert.equal(apply(r,'conhecimento',{type:'iniciar_maquete'}),false);r.stage='registrado';assert.equal(apply(r,'luz',{type:'iniciar_maquete'}),false);
 assert.equal(apply(r,'conhecimento',{type:'iniciar_maquete'}),true);assert.equal(apply(r,'conhecimento',{type:'iniciar_maquete'}),false);
 assert.equal(apply(r,'conhecimento',{type:'maquete_orientar'}),false);
 r.peers.set('a',{role:'luz'});r.peers.set('b',{role:'conhecimento'});assert.equal(apply(r,'conhecimento',{type:'maquete_orientar'}),true);
 const view=snapshot(r,Date.now(),'luz');assert.equal(view.maquete.level,0);assert.equal(view.maquete.clue,null);assert.equal(view.maquete.ready,true);
});


test('geometria real: medalhoes ficam acessiveis e a miniatura usa instancias',async()=>{
 const {readFileSync}=await import('node:fs');const vm=await import('node:vm');
 const gradient={addColorStop(){}};
 const canvasContext=new Proxy({}, {get:(target,key)=>target[key]??(key.startsWith('create')?()=>gradient:()=>{}),set:(target,key,value)=>(target[key]=value,true)});
 const context=vm.createContext({window:{},console,document:{createElement(){return {width:128,height:128,getContext(){return canvasContext;}};}},URLSearchParams,location:{search:''}});
 vm.runInContext(readFileSync('v1/js/three.min.js','utf8'),context);context.window.THREE=context.THREE;
 context.ACDesk={load(done){done(new context.THREE.Group());}};
 for(const file of ['ac-room-layout.js','ac-room-art.js','ac-room.js','ac-maquete-model.js']){vm.runInContext(readFileSync('v1/js/'+file,'utf8'),context);Object.assign(context,context.window);}
 vm.runInContext(readFileSync('v1/js/ac-maquete-spatial.js','utf8'),context);
 const T=context.THREE,model=context.window.createACMaquette();
 assert.equal(model.livingRoom.root.scale.x,.064);
 const canonical=context.ACRoom.create({seed:'OUTRA-PARTIDA'});
 for(const id of Object.keys(canonical.layout.objects)){
   const source=canonical.objects[id],copy=model.livingRoom.objects[id];assert.ok(source&&copy,id);
   assert.deepEqual(Array.from(source.position.toArray()),Array.from(copy.position.toArray()),id+' conserva posicao local');
   assert.deepEqual(Array.from(source.quaternion.toArray()),Array.from(copy.quaternion.toArray()),id+' conserva orientacao');
   const signature=object=>{const out=[];object.traverse(o=>{if(o.isMesh)out.push([o.geometry.attributes.position.count,o.material.color?.getHex(),o.material.roughness,o.material.metalness,o.material.map?.image?.width,o.material.map?.image?.height]);});return JSON.stringify(out);};
   assert.equal(signature(source),signature(copy),id+' conserva geometria e materiais');
 }
 const {KEY_SOCKET}=await import('../ferramentas/ac-cooperacao.mjs');assert.ok(model.keySocket.getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3(...KEY_SOCKET))<1e-8);
 for(const scale of [.3,1]){
  model.root.scale.setScalar(scale);model.root.rotation.y=.7;
  model.key.position.copy(model.root.worldToLocal(model.keySocket.getWorldPosition(new T.Vector3())));
  assert.equal(context.window.ACMaquetteSpatial.keyFits(model),false,'argola sobre fechadura nao encaixa');
  const delta=model.keySocket.getWorldPosition(new T.Vector3()).sub(model.keyTip.getWorldPosition(new T.Vector3()));
  model.key.position.copy(model.root.worldToLocal(model.key.getWorldPosition(new T.Vector3()).add(delta)));
  assert.equal(context.window.ACMaquetteSpatial.keyFits(model),true,'ponta encaixa mesmo com escala e rotacao RA');
 }
 model.root.scale.setScalar(1);model.root.rotation.y=0;
model.roof.visible=false;model.upper.visible=false;model.root.updateMatrixWorld(true);
 let instanceCount=0;model.root.traverse(o=>{if(o.isInstancedMesh)instanceCount++;});assert.ok(instanceCount>10&&instanceCount<100);
 assert.equal(model.doorways.length,8);
 for(const doorway of model.doorways){
  const origin=doorway.wall.localToWorld(new T.Vector3(doorway.x-.018,.07,doorway.z));
  const ray=new T.Raycaster(origin,new T.Vector3(1,0,0),0,.036);
  const wallHit=ray.intersectObject(doorway.wall,true).find(h=>h.object.material?.color&&h.object!==model.key);
  assert.equal(wallHit,undefined,'vao atravessa divisoria: '+doorway.frame.name);
 }
 for(const name of ['rosa','relogio','armario-oeste']){
  const object=model.targets.find(o=>o.userData.object===name);assert.ok(object);
  model.upper.visible=name==='armario-oeste';model.root.updateMatrixWorld(true);
  const origin=object.localToWorld(new T.Vector3(0,.08,0)),target=object.localToWorld(new T.Vector3(0,.004,0));const ray=new T.Raycaster(origin,target.clone().sub(origin).normalize());
  const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};const hit=ray.intersectObject(model.root,true).find(h=>visible(h.object));assert.ok(hit,name+' tem superficie atingivel');
  let owner=hit.object;while(owner&&!owner.userData.object)owner=owner.parent;assert.equal(owner?.userData.object,name,name+' nao esta enterrado no movel');
 }
});


test('exportacao preserva instancias e pose apoiada nao enterra a base',async()=>{
 const {readFileSync}=await import('node:fs');const vm=await import('node:vm');
 const context=vm.createContext({window:{},console});vm.runInContext(readFileSync('v1/js/three.min.js','utf8'),context);vm.runInContext(readFileSync('v1/js/ac-maquete-spatial.js','utf8'),context);
 const T=context.THREE,api=context.window.ACMaquetteSpatial,root=new T.Group();
 const instances=new T.InstancedMesh(new T.BoxGeometry(2,.2,2),new T.MeshStandardMaterial(),2);
 instances.setMatrixAt(0,new T.Matrix4().makeTranslation(0,-.4,0));instances.setMatrixAt(1,new T.Matrix4().makeTranslation(3,1,0));root.add(instances);
 const clue=new T.Group();clue.userData.object='segredo';root.add(clue);root.scale.setScalar(.4);root.position.set(4,5,6);
 const copy=api.exportModel({root});let meshes=0;copy.traverse(o=>{assert.ok(!o.isInstancedMesh);assert.ok(!o.userData.object);if(o.isMesh)meshes++;});assert.equal(meshes,2);assert.equal(root.children.length,2);assert.equal(root.scale.x,.4);
 const bounds=new T.Box3().setFromObject(copy);assert.ok(Math.abs(bounds.min.y+.5)<1e-7);
 for(const scale of [.3,.5,1]){api.groundedPose(copy,new T.Matrix4().makeTranslation(2,.8,-1),scale,bounds.min.y);assert.ok(Math.abs(new T.Box3().setFromObject(copy).min.y-.8)<1e-7);}
});


test('poeira dourada limita particulas, desaparece e nao intercepta pistas',async()=>{
 const {readFileSync}=await import('node:fs');const vm=await import('node:vm');const context=vm.createContext({window:{},console});
 vm.runInContext(readFileSync('v1/js/three.min.js','utf8'),context);vm.runInContext(readFileSync('v1/js/ac-gold-dust.js','utf8'),context);
 const T=context.THREE,parent=new T.Group(),dust=context.window.createACGoldDust(parent,{capacity:48}),point=new T.Vector3();const cloud=parent.children[0];
 for(let i=0;i<100;i++)dust.burst(point);assert.equal(cloud.geometry.attributes.position.count,48);assert.equal(parent.children.length,1);assert.equal(cloud.userData.exportExclude,true);
 const hits=[];cloud.raycast(new T.Raycaster(),hits);assert.equal(hits.length,0);
 dust.update(1,null,800);assert.ok([...cloud.geometry.attributes.life.array].every(v=>v===0));
 dust.update(0,point,800);dust.update(.01,new T.Vector3(.2,0,0),800);assert.ok([...cloud.geometry.attributes.life.array].some(v=>v>0));
 dust.update(1,null,800);dust.resetTrail();dust.trace(point);
 for(let i=1;i<=12;i++)dust.trace(new T.Vector3(i*.001,0,0));
 assert.ok([...cloud.geometry.attributes.life.array].some(v=>v>0),'movimentos lentos acumulam distancia e deixam rastro');
 dust.dispose();assert.equal(parent.children.length,0);
 const quiet=context.window.createACGoldDust(parent,{reduced:true});quiet.update(0,point,800);quiet.update(.01,new T.Vector3(1,0,0),800);assert.ok([...parent.children[0].geometry.attributes.life.array].every(v=>v===0));quiet.dispose();
});
