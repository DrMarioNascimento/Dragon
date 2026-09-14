import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../v1/js/ac-investigacao-state.js', import.meta.url), 'utf8');
const ctx = vm.createContext({}); vm.runInContext(source, ctx); const m = ctx.ACInvestigationState;
test('encaixe exige proximidade real e rejeita distancia invalida',()=>{assert.equal(m.canDock(.08),true);assert.equal(m.canDock(.12),true);for(const d of [.121,1,Infinity,NaN,-1])assert.equal(m.canDock(d),false);});
test('a descoberta exige a sequencia e nao registra recompensas repetidas', () => {
  let s=m.initial(); assert.equal(m.reduce(s,{type:'registrar'}),s);
  for(const type of ['energia','posicionar','encaixar','descobrir','registrar'])s=m.reduce(s,{type});
  assert.equal(s.stage,'registrado');assert.equal(s.evidence.length,1);
  assert.equal(m.reduce(s,{type:'registrar'}),s);
});
test('restaura o dossie sem aceitar evidencias arbitrarias do armazenamento',()=>{
  const s=m.restore({version:1,stage:'registrado',evidence:['qualquer','duplicada']});
  assert.equal(s.evidence.length,1);assert.equal(s.evidence[0],'ac-estudo-marca-externa');
  assert.equal(m.restore({version:1,stage:'invalida'}).stage,'apagao');
  assert.equal(m.restore({version:2,stage:'registrado'}).stage,'apagao');
});
test('permanencia usa segundos, equivalente a 30, 60 e 120 fps',()=>{
  for(const fps of [30,60,120]){let n=0;for(let i=0;i<fps*1.3;i++)n=m.dwell(n,true,1/fps);assert.equal(n,1.2);assert.equal(m.dwell(n,false,.1),0);}
  assert.equal(m.dwell(0,true,40),.1,'retorno de aba nao conta 40 segundos de observacao');
});
test('inclinar e virar atuam em elementos separados no cartao real',()=>{
  const context=vm.createContext({window:{},document:{readyState:'loading',addEventListener(){}}});
  vm.runInContext(readFileSync(new URL('../v1/js/mosaico-3d-engine.js',import.meta.url),'utf8'),context);
  const html=context.window.Mosaico3D.htmlCartao3D('teste','frente','verso');
  assert.match(html,/m3d-card-tilt m3d-tilt-box/);assert.doesNotMatch(html,/m3d-card-3d m3d-tilt-box/);
  assert.match(html,/<button type="button"[^>]*aria-controls="card-3d-teste"/);
});

test('acabamento compartilhado conserva a base da pista e a altura do castical',()=>{
  const paint=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const context=vm.createContext({window:{},document:{currentScript:{src:'http://localhost/v1/js/ac-desk.js'},createElement:()=>({getContext:()=>paint})},URL,console});
  vm.runInContext(readFileSync(new URL('../v1/js/three.min.js',import.meta.url),'utf8'),context);
  const T=context.THREE;context.window.THREE=T;
  vm.runInContext(readFileSync(new URL('../v1/js/ac-desk.js',import.meta.url),'utf8'),context);
  const root=new T.Group();
  for(const name of ['Tampo','Madeira','Metal','Gaveta']){const mesh=new T.Mesh(new T.BoxGeometry(.2,.2,.2),new T.MeshStandardMaterial());mesh.name=name;root.add(mesh);}
  const pedestal=root.getObjectByName('Madeira'),geometry=pedestal.geometry;
  const drawer=root.getObjectByName('Gaveta');drawer.position.set(.412,.207833,.286);
  context.window.ACDesk.finish(root);root.updateMatrixWorld(true);
  assert.equal(pedestal.geometry,geometry,'base original preservada para a etiqueta');
  assert.deepEqual(Array.from(drawer.position.toArray()),[.412,.207833,.286]);
  const top=root.getObjectByName('Tampo-arredondado'),box=new T.Box3().setFromObject(top);
  assert.ok(Math.abs(box.max.y-.765)<.00001,'castical continua apoiado no tampo');
  assert.ok(Math.abs(box.min.y-.727)<.00001);
  assert.equal(root.getObjectByName('Metal').visible,false,'puxadores antigos nao se sobrepoem aos novos');
});

test('a planta canonica e os objetos sao compartilhados entre sala e vela',()=>{
  const gradient={addColorStop(){}};
  const canvasContext=new Proxy({}, {get:(target,key)=>target[key]??(key.startsWith('create')?()=>gradient:()=>{}),set:(target,key,value)=>(target[key]=value,true)});
  const context=vm.createContext({window:{},console,document:{createElement:()=>({width:512,height:512,getContext:()=>canvasContext})}});
  vm.runInContext(readFileSync(new URL('../v1/js/three.min.js',import.meta.url),'utf8'),context);
  context.window.THREE=context.THREE;
  for(const file of ['ac-room-layout.js','ac-room-art.js']){vm.runInContext(readFileSync(new URL('../v1/js/'+file,import.meta.url),'utf8'),context);Object.assign(context,context.window);}
  vm.runInContext(readFileSync(new URL('../v1/js/ac-room.js',import.meta.url),'utf8'),context);
  const model=context.ACRoom.create({seed:'TESTE-COSTA',desk:false}),again=context.ACRoom.layout('TESTE-COSTA');
  assert.equal(JSON.stringify(model.layout),JSON.stringify(again));
  assert.equal(JSON.stringify(again.objects),JSON.stringify(context.ACRoom.layout('OUTRA').objects),'a planta fisica nao muda com outra partida');
  for(const [id,pose] of Object.entries(again.objects)){
    if(id==='secretaria')continue;
    const object=model.objects[id];assert.ok(object,id);
    assert.equal(object.position.x,pose.pos[0]);assert.equal(object.position.z,-pose.pos[1]);assert.equal(object.position.y,pose.alt);
    assert.ok(Math.abs(object.position.x)<2.75&&Math.abs(object.position.z)<2.15);
  }
  const T=context.THREE,desk=model.objects.escrivaninha;
  const inverse=new T.Matrix4().compose(desk.position,desk.quaternion,new T.Vector3(1,1,1)).invert();
  model.root.applyMatrix4(inverse);model.root.updateMatrixWorld(true);
  assert.ok(desk.getWorldPosition(new T.Vector3()).length()<1e-10,'sala da vela muda origem sem mudar distribuicao');
  const angles=[];canvasContext.rotate=a=>angles.push(a);context.ACRoomArt(canvasContext).relogio(context.ACRoom.definitions.relogio);
  assert.ok(angles.some(a=>Math.abs(a+29/60*Math.PI*2)<1e-10),'minutos indicam 29');
  assert.ok(angles.some(a=>Math.abs(a+(9+29/60)/12*Math.PI*2)<1e-10),'hora indica 21h29');
  assert.equal(model.objects.pendulo.rotation.z,.16,'pendulo permanece parado');
});
