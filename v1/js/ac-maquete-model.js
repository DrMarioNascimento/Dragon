/* Miniatura procedural baseada na fachada e na planta 1867 do repositorio.
   Volumes por piso, instanciamento de madeira/pedra e objetos inspecionaveis. */
(function(global){
  global.createACMaquette=function(){
    const root=new THREE.Group(),layers=[],targets=[],facades=[],doorways=[];
    const colors={stone:0x85817a,wood:0x39291f,plaster:0xc1b69e,slate:0x344a4f,gold:0xc4a363,glass:0x9bb8aa,floor:0x805d3e,green:0x2e5947,paper:0xcabb91,rock:0x555650,water:0x152e3c};
    const mats=Object.fromEntries(Object.entries(colors).map(([k,color])=>[k,new THREE.MeshStandardMaterial({color,roughness:k==='gold'?.35:.85,metalness:k==='gold'?.55:0})]));
    Object.values(mats).forEach(m=>m.color.convertSRGBToLinear());
    const textured=global.createACMaterials?.()||{};for(const [key,mat] of Object.entries(textured)){mats[key].dispose();mats[key]=mat;}
    const pools=new Map(),boxGeo=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
    function group(name,y){const g=new THREE.Group();g.name=name;g.position.y=y;g.userData.restY=y;root.add(g);layers.push(g);return g;}
    function box(g,x,y,z,w,h,d,material='wood',rotation=0){
      const id=g.uuid+material;if(!pools.has(id))pools.set(id,{g,material,items:[]});
      q.setFromAxisAngle(new THREE.Vector3(0,0,1),rotation);matrix.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(w,h,d));pools.get(id).items.push(matrix.clone());
    }
    function round(g,x,y,z,r,h,material='gold'){
      const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),mats[material]);mesh.position.set(x,y,z);mesh.castShadow=true;g.add(mesh);return mesh;
    }
    function mark(g,id,label,x,y,z,rotation=0){
      const m=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.006,24),mats.gold);m.position.set(x,y,z);m.rotation.x=rotation;m.userData={object:id,label};
      const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#c4a363';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#594522';ctx.lineWidth=3;ctx.beginPath();ctx.arc(64,64,53,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#594522';ctx.textAlign='center';ctx.font='48px Georgia';ctx.fillText(({rosa:'N',folha:'❧',ondas:'≈',relogio:'XII'})[id]||'⌘',64,81);
      const engraving=new THREE.Mesh(new THREE.PlaneGeometry(.044,.044),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(canvas),roughness:.8}));engraving.rotation.x=-Math.PI/2;engraving.position.y=.0035;engraving.userData.decoration=true;m.add(engraving);
      g.add(m);targets.push(m);return m;
    }
    function corridorWall(g,x){
      const openings=[-.12,.22],width=.12,height=.15,half=.375;
      let start=-half;
      for(const z of openings){
        const edge=z-width/2;
        box(g,x,height/2,(start+edge)/2,.014,height,edge-start,'plaster');
        // Lintel leaves a real opening through the partition, rather than a door painted on it.
        box(g,x,.144,z,.014,.012,width,'plaster');
        const frame=new THREE.Group();frame.name='Porta '+(x<0?'oeste':'leste')+' '+(z<0?'fundo':'frente');frame.position.set(x,.021,z);frame.rotation.y=Math.PI/2;g.add(frame);
        for(const side of [-1,1])box(frame,side*(width/2-.004),.058,0,.008,.116,.027,'wood');
        box(frame,0,.119,0,width,.009,.027,'wood');
        const hinge=new THREE.Group();hinge.position.x=-width/2+.009;hinge.rotation.y=x<0?1.18:-1.18;frame.add(hinge);
        const leafWidth=width-.020;box(hinge,leafWidth/2,.057,0,leafWidth,.110,.009,'wood');
        for(const y of [.030,.081])box(hinge,leafWidth/2,y,0,leafWidth-.022,.035,.013,'floor');
        const handle=round(hinge,leafWidth-.012,.056,.008,.0035,.010,'gold');handle.rotation.x=Math.PI/2;
        doorways.push({frame,wall:g,x,z,width,height:.11});start=z+width/2;
      }
      box(g,x,height/2,(start+half)/2,.014,height,half-start,'plaster');
    }
    function windowAt(g,x,y,z){
      box(g,x,y,z,.105,.145,.014,'glass');
      for(const dx of [-.057,0,.057])box(g,x+dx,y,z+.009,.008,.16,.019);
      for(const dy of [-.079,0,.079])box(g,x,y+dy,z+.01,.124,.008,.021);
      box(g,x,y-.086,z+.024,.14,.012,.055,'stone');
    }
    function chair(g,x,z,turn=0){box(g,x,.105,z,.07,.018,.07);box(g,x,.155,z+turn*.034,.075,.12,.014);for(const a of [-1,1])for(const b of [-1,1])box(g,x+a*.027,.05,z+b*.027,.009,.10,.009);}
    function table(g,x,z,w,d){box(g,x,.16,z,w,.023,d);for(const a of [-1,1])for(const b of [-1,1])box(g,x+a*(w/2-.02),.08,z+b*(d/2-.02),.016,.15,.016);}
    const base=group('Jardim e fundacao',0);
    box(base,0,.015,0,1.65,.06,1.28,'wood');box(base,0,.049,0,1.62,.014,1.25,'green');
    // Calcamento, canteiros, muros e caminho de chegada.
    for(let i=0;i<8;i++)for(let j=0;j<3;j++)box(base,(j-1)*.055,.063,.47+i*.021,.05,.008,.018,'stone');
    for(const side of [-1,1])for(let i=0;i<12;i++)box(base,side*.73,.08,-.52+i*.085,.055,.05,.065,'stone');
    for(const x of [-.69,.69])for(const z of [-.46,.34]){
      round(base,x,.09,z,.05,.035,'stone');
      round(base,x,.15,z,.008,.18,'wood');for(let i=0;i<7;i++){const bush=new THREE.Mesh(new THREE.ConeGeometry(.067-i*.007,.09,9),mats.green);bush.position.set(x,.16+i*.031,z);bush.rotation.y=i*.71;bush.castShadow=true;base.add(bush);}
    }
    // Porão e trajeto ficam ocultos ate a ultima chave.
    const cellar=group('Fundacao oculta',.08);cellar.visible=false;
    box(cellar,.39,.02,.16,.38,.035,.48,'stone');
    for(const x of [.205,.575])box(cellar,x,.075,.16,.018,.14,.48,'stone');
    box(cellar,.39,.075,-.075,.38,.14,.018,'stone');
    for(let i=0;i<9;i++)box(cellar,.39,.155-i*.015,.32-i*.03,.16,.018,.032,'wood');
    const trail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.39,.17,.42),new THREE.Vector3(.39,.17,.20),new THREE.Vector3(.39,.06,-.02)]),20,.005,6,false),new THREE.MeshBasicMaterial({color:0xe9c77d}));cellar.add(trail);
    const lower=group('Piso 1',.09),upper=group('Piso 2',.43),roof=group('Telhado e sotao',.77);
    for(const g of [lower,upper]){
      const facade=new THREE.Group();g.add(facade);facades.push(facade);box(facade,0,.17,.377,1.18,.28,.023,g===lower?'stone':'plaster');
      // Planta: salas a oeste, circulacao central, servicos/quartos a leste.
      box(g,0,.007,0,1.2,.02,.78,'floor');
      for(let i=0;i<32;i++)box(g,-.585+i*.037,.019,0,.002,.001,.77,'wood');
      box(g,0,.155,-.39,1.2,.31,.022,g===lower?'stone':'plaster');
      for(const side of [-1,1])box(g,side*.60,.155,0,.025,.31,.8,g===lower?'stone':'plaster');
      for(const x of [-.50,-.30,0,.30,.50]){
        box(g,x,.155,.392,.035,.31,.027,'wood');
        if(x!==0)windowAt(g,x,.18,.399);
      }
      for(const y of [.025,.31])box(g,0,y,.4,1.24,.018,.036,'wood');
      // Meia parede frontal preserva a vista quando o piso e aberto.
      box(g,0,.04,.385,1.18,.08,.02,'plaster');
      for(const x of [-.20,.19])corridorWall(g,x);
      box(g,-.40,.075,0,.39,.15,.012,'plaster');box(g,.40,.075,-.05,.39,.15,.012,'plaster');
      for(let i=0;i<10;i++)box(g,0,.025+i*.025,-.19+i*.033,.15,.025,.034,'wood');
      for(let i=0;i<5;i++)box(g,-.10,.15+i*.022,-.18+i*.064,.008,.22,.008,'wood');
    }
    // Fachada em enxaimel, varanda e portao central, coerentes com a referencia.
    for(const x of [-.59,-.20,.20,.59]){box(lower,x,.15,.50,.024,.30,.024);box(lower,x,.29,.50,.016,.03,.20);}
    box(lower,0,.01,.49,1.24,.024,.20,'floor');box(lower,0,.30,.49,1.3,.025,.24,'slate');
    box(lower,0,.11,.404,.12,.22,.024);round(lower,.04,.12,.424,.005,.01);
    for(const side of [-1,1])for(let j=0;j<8;j++)box(lower,side*(.12+j*.06),.095,.59,.007,.15,.009);
    box(lower,0,.17,.59,1.18,.012,.012);
    // Sala de jantar: mesa, pratos, cadeiras e relogio.
    table(lower,-.40,-.20,.22,.20);
    for(const x of [-.48,-.32])for(const z of [-.25,-.15])round(lower,x,.177,z,.020,.003,'paper');
    for(const x of [-.52,-.28])chair(lower,x,-.20,1);
    // This room is the exact room factory used in the blackout and candle scene.
    // Uniform scale preserves geometry, wood grain, object positions and proportions.
    const livingRoom=ACRoom.create({seed:ACRoom.seed(),miniature:true});
    livingRoom.root.scale.setScalar(.064);livingRoom.root.position.set(-.405,.015,.225);lower.add(livingRoom.root);
    // Cozinha/despensa com loucas e prateleiras.
    box(lower,.47,.08,-.29,.19,.15,.13,'stone');for(const x of [.42,.51])round(lower,x,.16,-.29,.025,.008,'slate');
    for(const y of [.06,.14,.22]){box(lower,.55,y,.08,.07,.012,.17);for(let i=0;i<3;i++)round(lower,.55,y+.021,.02+i*.05,.013,.033,'paper');}
    // Quatro quartos conforme a planta; camas, mantas e armarios.
    for(const side of [-1,1])for(const back of [-1,1]){
      const x=side*.39,z=back*.21;
      box(upper,x,.05,z,.18,.07,.21);box(upper,x,.095,z,.17,.035,.20,'paper');box(upper,x,.116,z+.025,.175,.009,.13,'green');box(upper,x,.12,z-.068,.12,.015,.05,'paper');
      box(upper,side*.55,.13,z,.07,.24,.10);box(upper,side*.51,.13,z,.004,.22,.003,'gold');
    }
    // Tres volumes de telhado, com empenas frontais reais e alas assimetricas.
    function gable(cx,width,height,depth,baseY){
      const zFront=depth/2;
      for(const side of [-1,1]){
        const face=new THREE.BufferGeometry();face.setAttribute('position',new THREE.Float32BufferAttribute([cx-width/2,baseY,side*zFront,cx+width/2,baseY,side*zFront,cx,baseY+height,side*zFront],3));face.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));face.computeVertexNormals();
        const material=mats.plaster.clone();material.side=THREE.DoubleSide;const triangle=new THREE.Mesh(face,material);roof.add(triangle);
        box(roof,cx,baseY+.008,side*(zFront+.012),width,.019,.028,'wood');
        box(roof,cx,baseY+height*.43,side*(zFront+.012),.018,height*.86,.025,'wood');
        for(const sign of [-1,1]){
          const length=Math.hypot(width/2,height),angle=sign*-Math.atan2(height,width/2);
          box(roof,cx+sign*width/4,baseY+height/2,side*(zFront+.014),length+.025,.025,.033,'wood',angle);
          box(roof,cx+sign*width*.23,baseY+height*.23,side*(zFront+.015),.012,height*.44,.027,'wood');
        }
      }
      const angle=Math.atan2(height,width/2),slope=Math.hypot(width/2,height);
      for(const sign of [-1,1]){
        const panel=new THREE.Mesh(new THREE.BoxGeometry(slope+.045,.012,depth+.085),mats.slate);panel.position.set(cx+sign*width/4,baseY+height/2,0);panel.rotation.z=-sign*angle;roof.add(panel);panel.castShadow=true;panel.updateMatrix();
        if(!mats.tile){mats.tile=new THREE.MeshStandardMaterial({color:0x414b54,roughness:.86});mats.tile.color.convertSRGBToLinear();}
        const id=roof.uuid+'shingles';if(!pools.has(id))pools.set(id,{g:roof,material:'tile',items:[]});
        for(let row=0;row<8;row++)for(let col=0;col<18;col++){
          const local=new THREE.Matrix4().makeTranslation(-slope/2+(row+.5)*slope/8,.009,-depth/2+(col+.5)*depth/18);
          const transform=new THREE.Matrix4().multiplyMatrices(panel.matrix,local).multiply(new THREE.Matrix4().makeScale(slope/8-.001,.008,depth/18-.001));pools.get(id).items.push(transform);
        }
      }
      box(roof,cx,baseY+height+.011,0,.025,.024,depth+.105,'slate');
      // Cumeeira ornamentada: repeticoes instanciadas, sem luzes extras.
      for(let i=0;i<15;i++)box(roof,cx,baseY+height+.035,-depth/2+i*depth/14,.007,.029,.007,'wood');
    }
    gable(-.34,.57,.38,.86,0);gable(.16,.47,.34,.85,0);gable(.49,.30,.25,.77,-.045);
    for(const [x,z,h] of [[-.48,-.05,.57],[.31,-.15,.48]]){
      box(roof,x,h/2,z,.085,h,.080,'stone');
      for(const y of [h-.08,h-.045,h])box(roof,x,y,z,.112,.022,.106,'stone');
      for(const dx of [-.025,.025])round(roof,x+dx,h+.045,z,.016,.08,'stone');
    }
    // Enxaimel com profundidade nas fachadas e nas laterais.
    for(const g of [lower,upper]){
      for(const z of [-.405,.414])for(const x of [-.57,-.36,-.15,.16,.39,.57]){
        box(g,x,.17,z,.014,.29,.026,'wood');
        if(z<0)box(g,x,.17,z,.15,.009,.02,'wood',.9);
      }
      for(const side of [-1,1]){
        for(const z of [-.34,-.12,.12,.34])box(g,side*.616,.17,z,.021,.29,.014,'wood');
        for(const y of [.025,.12,.31])box(g,side*.616,y,0,.022,.013,.80,'wood');
        for(const z of [-.23,.23]){
          const glass=new THREE.Mesh(new THREE.BoxGeometry(.014,.15,.11),mats.glass);glass.position.set(side*.619,.195,z);g.add(glass);
          for(const dz of [-.058,0,.058])box(g,side*.632,.195,z+dz,.025,.166,.008,'wood');
          for(const y of [.113,.195,.277])box(g,side*.632,y,z,.025,.008,.125,'wood');
        }
      }
    }
    // Molduras, capiteis e balaustres da varanda.
    for(const x of [-.59,-.20,.20,.59]){
      for(const y of [.025,.045,.25,.275])box(lower,x,y,.50,.045,.016,.044,'wood');
      for(const side of [-1,1])box(lower,x+side*.039,.258,.50,.10,.012,.023,'wood',-side*.65);
    }
    for(const side of [-1,1])for(let i=0;i<13;i++){
      const x=side*(.13+i*.035);box(lower,x,.10,.59,.010,.135,.012,'wood');box(lower,x,.10,.59,.018,.024,.018,'wood');
    }
    for(let i=0;i<5;i++)box(base,0,.09-i*.021,.62+i*.044,.19,.025,.05,'stone');
    // Embasamento costeiro estratificado, sem esconder o acesso revelado.
    box(base,0,-.34,.04,1.92,.055,1.62,'wood');box(base,0,-.305,.04,1.88,.028,1.58,'gold');
    box(base,0,-.18,-.04,1.70,.25,1.27,'rock');
    let seed=1876;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    const cliffGeo=new THREE.DodecahedronGeometry(1,1),cliffMat=mats.rock;
    const rocks=new THREE.InstancedMesh(cliffGeo,cliffMat,44);
    for(let i=0;i<44;i++){
      const side=i%2?-1:1,x=i<28?- .85+i*.063:side*(.77+rnd()*.07),z=i<28?.53+rnd()*.12:-.51+rnd();
      const r=.07+rnd()*.06;matrix.compose(new THREE.Vector3(x,-.20+rnd()*.10,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(),rnd(),rnd())),new THREE.Vector3(r,.12+rnd()*.11,r*.7));rocks.setMatrixAt(i,matrix);
    }
    rocks.castShadow=true;rocks.receiveShadow=true;base.add(rocks);
    const water=new THREE.Mesh(new THREE.PlaneGeometry(1.86,.46),mats.water);water.rotation.x=-Math.PI/2;water.position.set(0,-.29,.59);base.add(water);
    // Muros baixos e pequenas pedras claras na linha d'agua.
    for(let i=0;i<25;i++){const x=-.80+i*.065;box(base,x,.075,-.57,.061,.042,.029,'stone');box(base,x,.102,-.57,.065,.012,.037,'stone');}
    const foliage=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),mats.green,110);
    for(let i=0;i<110;i++){
      const x=(i%2?1:-1)*(.67+rnd()*.13),z=-.52+rnd()*1.08,size=.014+rnd()*.022;
      matrix.compose(new THREE.Vector3(x,.086+rnd()*.03,z),new THREE.Quaternion(),new THREE.Vector3(size,size*.8,size));foliage.setMatrixAt(i,matrix);
    }
    foliage.castShadow=true;base.add(foliage);
    // Medalhoes sao objetos 3D tocaveis, nao botoes sobrepostos.
    mark(lower,'rosa','Rosa dos ventos',.14,.19,.435,Math.PI/2);
    mark(lower,'folha','Folha entalhada',-.58,.14,.55,Math.PI/2);
    mark(lower,'ondas','Ondas entalhadas',.58,.14,.55,Math.PI/2);
    function roomMark(id,label,offset){
      const object=livingRoom.objects[id],p=offset.clone().applyQuaternion(object.quaternion).add(object.position).multiplyScalar(.064).add(livingRoom.root.position);
      const marker=mark(lower,id,label,p.x,p.y,p.z);marker.quaternion.copy(object.quaternion);marker.rotateX(Math.PI/2);marker.scale.setScalar(.45);
    }
    roomMark('relogio','Base do relógio',new THREE.Vector3(0,-.35,.10));
    roomMark('escrivaninha','Gaveta da escrivaninha',new THREE.Vector3(.412,.414,.34));
    mark(lower,'louca','Prateleira da despensa',.50,.12,.08,Math.PI/2);
    mark(upper,'armario-oeste','Armário do quarto oeste',-.55,.15,-.152,Math.PI/2);
    mark(upper,'armario-sul','Armário do quarto sul',-.55,.15,.268,Math.PI/2);
    mark(upper,'armario-norte','Armário do quarto norte',.55,.15,-.152,Math.PI/2);
    mark(upper,'armario-leste','Armário do quarto leste',.55,.15,.268,Math.PI/2);
    for(const pool of pools.values()){

      const mesh=new THREE.InstancedMesh(boxGeo,mats[pool.material],pool.items.length);pool.items.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;pool.g.add(mesh);
    }
    // Fechadura na base: recebe cada chave por arrasto.
    const lock=round(base,.48,-.13,.88,.047,.012,'gold');lock.rotation.x=Math.PI/2;lock.userData.label='Fechadura da maquete';
    const keyholeMaterial=new THREE.MeshBasicMaterial({color:0x20180b});
    const hole=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,.002,16),keyholeMaterial);hole.position.y=.008;lock.add(hole);
    const slot=new THREE.Mesh(new THREE.BoxGeometry(.010,.002,.027),keyholeMaterial);slot.position.set(0,.008,.016);lock.add(slot);
    const key=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(.025,.006,8,24),mats.gold);ring.rotation.x=Math.PI/2;key.add(ring);
    const stem=new THREE.Mesh(new THREE.BoxGeometry(.009,.009,.085),mats.gold);stem.position.z=.06;key.add(stem);for(const z of [.075,.095]){const tooth=new THREE.Mesh(new THREE.BoxGeometry(.025,.009,.009),mats.gold);tooth.position.set(.009,0,z);key.add(tooth);}key.rotation.x=Math.PI/2;key.rotation.z=-.22;key.scale.setScalar(1.8);
    const keyMaterial=mats.gold.clone();keyMaterial.emissive.setHex(0xc68c24);keyMaterial.emissiveIntensity=.35;key.traverse(o=>{if(o.isMesh)o.material=keyMaterial;});const keyTip=new THREE.Object3D();keyTip.name='Ponta da chave';keyTip.position.set(0,0,.1025);key.add(keyTip);root.add(key);key.visible=false;
    return {root,base,lower,upper,roof,cellar,targets,lock,key,keyTip,keySocket:hole,layers,facades,doorways,livingRoom};
  };
})(window);
