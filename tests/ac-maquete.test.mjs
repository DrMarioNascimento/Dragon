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


test('modelo publicado: casa-da-costa-pisos.glb traz as partes, os medalhoes e nada que a RA perca',async()=>{
 const {readFileSync,statSync}=await import('node:fs');
 const arquivo='v1/assets/ac/casa-da-costa-pisos.glb',bytes=readFileSync(arquivo);
 assert.ok(statSync(arquivo).size<5*1024*1024,'GLB acima de 5 MB');
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 const nomes=new Set(json.nodes.map(n=>n.name));
 for(const parte of ['terreno','porao','piso-1','piso-2','telhado','verga-porta','varanda-oeste','varanda-leste','louca','forro-piso-2'])assert.ok(nomes.has(parte),'falta a parte '+parte);
 const objetos=json.nodes.filter(n=>n.extras?.object).map(n=>n.extras.object).sort();
 assert.deepEqual(objetos,['armario-leste','armario-norte','armario-oeste','armario-sul','escrivaninha','espelho','relogio','vela']);
 for(const mesh of json.meshes)for(const p of mesh.primitives)assert.equal(p.attributes.COLOR_0,undefined,'cor por vertice nao chega ao iPhone: '+mesh.name);
 assert.ok(json.materials.every(m=>!m.doubleSided),'dupla face nao chega ao iPhone');
 assert.ok(!(json.extensionsUsed||[]).some(e=>/draco|meshopt/i.test(e)),'o leitor r128 da maquete nao descomprime');
});

function cenaMinima(T){
 const scene=new T.Group(),casa=new T.Group();casa.name='casa-da-costa';casa.position.set(.23,13.19,-.4);scene.add(casa);
 const parte=name=>{const g=new T.Group();g.name=name;casa.add(g);return g;};
 const peca=(pai,name,[x,y,z],[w,h,d],extras)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial());m.name=name;m.position.set(x-.23,y-13.19,z+.4);if(extras)m.userData=extras;pai.add(m);return m;};
 const terreno=parte('terreno'),porao=parte('porao'),p1=parte('piso-1'),p2=parte('piso-2'),telhado=parte('telhado');
 peca(terreno,'estrato-3',[0,9.5,0],[30,2,18.9]);
 peca(porao,'piso-do-porao',[0,10,-3],[16,.2,10]);peca(porao,'abobada',[0,13,-3],[16,.3,10]);
 const e1=new T.Group();e1.name='estrutura-piso-1';p1.add(e1);peca(e1,'parede-frente',[0,15.7,2.55],[16,3.5,.5]);peca(e1,'soalho-piso-1',[0,13.95,-1],[16,.1,7]);
 const portada=new T.Group();portada.name='portada';p1.add(portada);peca(portada,'verga-porta',[5.63,17.34,6.7],[2.8,.34,.46]);
 for(const [nome,x] of [['varanda-oeste',-11.92],['varanda-leste',12.38]]){const v=new T.Group();v.name=nome;p1.add(v);peca(v,'pilar-torneado',[x,15.5,3.7],[.26,2.8,.26]);peca(v,'pilar-torneado',[x+(x<0?1.6:-1.6),15.5,3.7],[.26,2.8,.26]);}
 peca(p1,'louca',[6.8,15.1,1.95],[1.5,.16,.22]);
 peca(p1,'medalhao-relogio',[-3.87,14.02,-.2],[.32,.04,.32],{object:'relogio',label:'Base do relógio'});
 peca(p2,'forro-piso-2',[0,20.64,-.9],[16,.1,6.4]);
 peca(p2,'medalhao-armario-oeste',[-7.32,17.52,2.41],[.28,.04,.28],{object:'armario-oeste',label:'Armário do quarto oeste'});
 peca(telhado,'telhado-principal',[0,22,-1],[18,3,9]);
 return scene;
}

test('maquete a partir do modelo: partes nos grupos certos, fechadura na regra do servidor e medalhoes tocaveis',async()=>{
 const {readFileSync}=await import('node:fs');const vm=await import('node:vm');
 const gradient={addColorStop(){}};
 const canvasContext=new Proxy({}, {get:(target,key)=>target[key]??(key.startsWith('create')?()=>gradient:()=>{}),set:(target,key,value)=>(target[key]=value,true)});
 const context=vm.createContext({window:{},console,document:{createElement(){return {width:128,height:128,getContext(){return canvasContext;}};}}});
 vm.runInContext(readFileSync('v1/js/three.min.js','utf8'),context);context.window.THREE=context.THREE;
 for(const file of ['ac-maquete-model.js','ac-maquete-spatial.js']){vm.runInContext(readFileSync('v1/js/'+file,'utf8'),context);Object.assign(context,context.window);}
 const T=context.THREE,model=context.window.createACMaquette({gltf:cenaMinima(T)});
 assert.equal(model.ready,true);
 for(const [grupo,parte] of [['base','terreno'],['cellar','porao'],['lower','piso-1'],['upper','piso-2'],['roof','telhado']])assert.ok(model[grupo].getObjectByName(parte),parte+' entra em '+grupo);
 assert.equal(model.root.getObjectByName('forro-piso-2'),undefined,'o forro esconderia os armarios');
 assert.equal(model.root.getObjectByName('abobada'),undefined,'a abobada esconderia o porao');
 assert.ok(model.facades[0].getObjectByName('parede-frente'),'a parede da frente sai com a fachada');
 assert.ok(model.facades[0].getObjectByName('portada'));
 assert.ok(model.lower.getObjectByName('soalho-piso-1').parent.name==='estrutura-piso-1','o piso fica');
 const ids=Array.from(model.targets,t=>t.userData.object).sort();
 assert.deepEqual(ids,['armario-oeste','folha','louca','ondas','relogio','rosa']);
 const {KEY_SOCKET}=await import('../ferramentas/ac-cooperacao.mjs');
 model.root.updateMatrixWorld(true);
 assert.ok(model.keySocket.getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3(...KEY_SOCKET))<1e-8,'fechadura e servidor concordam');
 // A face do estrato cai atras da fechadura, rente a ela.
 const face=new T.Box3().setFromObject(model.base.getObjectByName('estrato-3')).max.z,backOfLock=KEY_SOCKET[2]-.008-.006;
 assert.ok(Math.abs(face-backOfLock)<.004,'fechadura rente ao penhasco: '+face+' vs '+backOfLock);
 for(const scale of [.3,1]){
  model.root.scale.setScalar(scale);model.root.rotation.y=.7;model.root.updateMatrixWorld(true);
  model.key.position.copy(model.root.worldToLocal(model.keySocket.getWorldPosition(new T.Vector3())));
  assert.equal(context.window.ACMaquetteSpatial.keyFits(model),false,'argola sobre fechadura nao encaixa');
  const delta=model.keySocket.getWorldPosition(new T.Vector3()).sub(model.keyTip.getWorldPosition(new T.Vector3()));
  model.key.position.copy(model.root.worldToLocal(model.key.getWorldPosition(new T.Vector3()).add(delta)));
  assert.equal(context.window.ACMaquetteSpatial.keyFits(model),true,'ponta encaixa mesmo com escala e rotacao RA');
 }
 model.root.scale.setScalar(1);model.root.rotation.y=0;model.root.updateMatrixWorld(true);
 for(const name of ['rosa','folha','ondas']){
  const object=model.targets.find(o=>o.userData.object===name);
  const origin=object.localToWorld(new T.Vector3(0,.08,0)),target=object.localToWorld(new T.Vector3(0,.004,0));
  assert.ok(origin.z>target.z,name+' olha para a frente');
  const hit=new T.Raycaster(origin,target.clone().sub(origin).normalize()).intersectObject(model.root,true)[0];
  let owner=hit?.object;while(owner&&!owner.userData.object)owner=owner.parent;assert.equal(owner?.userData.object,name,name+' nao esta enterrado');
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

test('abertura da maquete enquadra de mais longe',async()=>{
 const {readFileSync}=await import('node:fs');
 const src=readFileSync(new URL('../v1/js/ac-maquete.js',import.meta.url),'utf8');
 const paisagem=readFileSync(new URL('../v1/js/ac-paisagem.js',import.meta.url),'utf8');
 assert.match(src,/Math\.max\(4\.6,/);
 assert.match(src,/mobile\?1\.55:1\.75\)/);
 assert.match(src,/complete\?3\.6:3\.0\)/);
 assert.match(paisagem,/Math\.max\(8, Math\.min\(22, Math\.max\(size\.x, size\.z\) \* 2\.4\)\)/);
});
