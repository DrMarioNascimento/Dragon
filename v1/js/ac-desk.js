/* One desk asset and finish for the dark room and the cooperative AR study. */
(function(global){
  'use strict';
  const script=document.currentScript;
  const asset=new URL('../assets/ac/escrivaninha.glb',script.src).href;
  function finish(root){
    const T=global.THREE;
    const woodCanvas=document.createElement('canvas');woodCanvas.width=woodCanvas.height=512;
    const woodCtx=woodCanvas.getContext('2d');woodCtx.fillStyle='#61402d';woodCtx.fillRect(0,0,512,512);
    for(let i=0;i<150;i++){woodCtx.strokeStyle=i%3?'rgba(39,26,18,.13)':'rgba(170,128,89,.12)';woodCtx.lineWidth=.6;woodCtx.beginPath();for(let x=0;x<=512;x+=8)woodCtx.lineTo(x,i*3.43+Math.sin(x*.012+i)*1.9);woodCtx.stroke();}
    const woodMap=new T.CanvasTexture(woodCanvas);woodMap.encoding=T.sRGBEncoding;
    root.name='AC-escrivaninha';
    root.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;
      if(o.material){o.material=o.material.clone();if(['Madeira','Gavetas','Tampo'].includes(o.material.name)){o.material.color.setHex(0xffffff);o.material.map=woodMap;o.material.roughness=o.material.name==='Tampo'?.5:.65;}}
    });
    // Keep pedestal undersides at y=.100: the tiny cooperative clue lives below them.
    const top=root.getObjectByName('Tampo'), metal=root.getObjectByName('Metal');
    if(top){
      const s=new T.Shape(),x=.64,z=.3145,r=.025;
      s.moveTo(-x+r,-z);s.lineTo(x-r,-z);s.quadraticCurveTo(x,-z,x,-z+r);s.lineTo(x,z-r);s.quadraticCurveTo(x,z,x-r,z);s.lineTo(-x+r,z);s.quadraticCurveTo(-x,z,-x,z-r);s.lineTo(-x,-z+r);s.quadraticCurveTo(-x,-z,-x+r,-z);
      const geometry=new T.ExtrudeGeometry(s,{depth:.030,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.004,bevelThickness:.004,curveSegments:8});
      const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+x)/(2*x),(uv.getY(i)+z)/(2*z));
      const rounded=new T.Mesh(geometry,top.material);rounded.name='Tampo-arredondado';rounded.rotation.x=-Math.PI/2;rounded.position.y=.731;rounded.castShadow=rounded.receiveShadow=true;top.visible=false;root.add(rounded);
    }
    if(metal)metal.visible=false;
    const brass=new T.MeshStandardMaterial({color:0xc39b51,metalness:.75,roughness:.3});
    function handle(parent,x,y,z){
      const plate=new T.Mesh(new T.CylinderGeometry(.013,.013,.003,16),brass);plate.rotation.x=Math.PI/2;plate.position.set(x,y,z);parent.add(plate);
      const ring=new T.Mesh(new T.TorusGeometry(.021,.003,8,24),brass);ring.position.set(x,y-.017,z+.006);ring.castShadow=true;parent.add(ring);
    }
    for(const x of [-.412,.412])for(const y of [.207833,.4135,.619167]){
      const drawer=root.getObjectByName('Gaveta');
      if(x>0&&y===.207833&&drawer)handle(drawer,0,0,.012);else handle(root,x,y,.299);
      const parent=x>0&&y===.207833&&drawer?drawer:root,cx=parent===drawer?0:x,cy=parent===drawer?0:y,cz=parent===drawer?.016:.302;
      for(const s of [-1,1]){const horizontal=new T.Mesh(new T.BoxGeometry(.328,.004,.002),brass);horizontal.position.set(cx,cy+s*.078,cz);parent.add(horizontal);const vertical=new T.Mesh(new T.BoxGeometry(.004,.16,.002),brass);vertical.position.set(cx+s*.164,cy,cz);parent.add(vertical);}
    }
    // The same papers and capped inkpot appear before and after the blackout.
    for(const name of ['Sextante','Braco']){const old=root.getObjectByName(name);if(old)old.visible=false;}
    const paperCanvas=document.createElement('canvas');paperCanvas.width=512;paperCanvas.height=354;const pc=paperCanvas.getContext('2d');pc.fillStyle='#e5dcc6';pc.fillRect(0,0,512,354);pc.strokeStyle='rgba(90,75,50,.28)';pc.lineWidth=3;
    for(let i=0;i<5;i++){pc.beginPath();pc.moveTo(49,63+i*58);pc.lineTo(463,63+i*58);pc.stroke();}
    const paperMap=new T.CanvasTexture(paperCanvas);paperMap.encoding=T.sRGBEncoding;
    const paperMat=new T.MeshStandardMaterial({map:paperMap,roughness:.94});
    for(let i=0;i<4;i++){const paper=new T.Mesh(new T.BoxGeometry(.21,.001,.145),paperMat);paper.position.set(i===3?.16:-.20+i*.014,.766+i*.0015,-.04);paper.rotation.y=i===3?.38:i*.04;root.add(paper);}
    const ink=new T.Mesh(new T.BoxGeometry(.070,.058,.070),new T.MeshStandardMaterial({color:0x171b22,roughness:.38}));ink.position.set(.36,.794,-.08);root.add(ink);
    const cap=new T.Mesh(new T.BoxGeometry(.070,.012,.070),brass);cap.position.set(.36,.829,-.08);root.add(cap);
    return root;
  }
  function load(done,error){new global.THREE.GLTFLoader().load(asset,g=>done(finish(g.scene)),undefined,error);}
  global.ACDesk={load,finish};
})(window);
