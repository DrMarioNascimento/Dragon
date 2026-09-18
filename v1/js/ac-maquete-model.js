/* Maquete da Casa da Costa a partir de assets/ac/casa-da-costa-pisos.glb.
   O modelo chega em metros, com cinco partes que o jogo move por nome:
   terreno, porao, piso-1, piso-2 e telhado. Aqui ele vira miniatura (1:15,6)
   e cada parte entra no grupo que o jogo já abria por chave. A fechadura, a
   chave e os medalhões que o arquivo não traz são desenhados por código. */
(function(global){
  // Metros do modelo -> unidades da maquete. A escala é a da sala do apagão
  // (.064), e a origem é escolhida para a face do penhasco cair exatamente na
  // fechadura: KEY_SOCKET (ac-core.mjs) é regra do servidor e não se move.
  const ESCALA=.064,ORIGEM=new THREE.Vector3(.23,13.19,-4.2),TOPO=.106;
  const KEY_SOCKET=[.48,-.13,.888],CLAREAR=2.2;
  const PARTES={terreno:'base',porao:'cellar','piso-1':'lower','piso-2':'upper',telhado:'roof'};
  function metros(x,y,z){return new THREE.Vector3((x-ORIGEM.x)*ESCALA,(y-ORIGEM.y)*ESCALA+TOPO,(z-ORIGEM.z)*ESCALA);}

  global.createACMaquette=function(options={}){
    const root=new THREE.Group(),layers=[],targets=[],doorways=[];
    function group(name,y){const g=new THREE.Group();g.name=name;g.position.y=y;g.userData.restY=y;root.add(g);layers.push(g);return g;}
    const base=group('Jardim e fundacao',0),cellar=group('Fundacao oculta',.08);cellar.visible=false;
    const lower=group('Piso 1',.09),upper=group('Piso 2',.43),roof=group('Telhado e sotao',.77);
    const groups={base,cellar,lower,upper,roof};
    // Frente de cada piso (alas, torre, portada, parede e vãos da frente): sai quando a chave abre o andar.
    const facades=[new THREE.Group(),new THREE.Group()];facades[0].name='Fachada terreo';facades[1].name='Fachada primeiro andar';lower.add(facades[0]);upper.add(facades[1]);
    const gold=new THREE.MeshStandardMaterial({color:0xc4a363,roughness:.35,metalness:.55});gold.color.convertSRGBToLinear();

    function mark(g,id,label,position,rotation,scale=1){
      const m=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.006,24),gold);m.position.copy(position).y-=g.userData.restY||0;m.rotation.x=rotation;m.scale.setScalar(scale);m.userData={object:id,label};
      const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#c4a363';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#594522';ctx.lineWidth=3;ctx.beginPath();ctx.arc(64,64,53,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#594522';ctx.textAlign='center';ctx.font='48px Georgia';ctx.fillText(({rosa:'N',folha:'❧',ondas:'≈'})[id]||'⌘',64,81);
      const engraving=new THREE.Mesh(new THREE.PlaneGeometry(.044,.044),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(canvas),roughness:.8}));engraving.rotation.x=-Math.PI/2;engraving.position.y=.0035;engraving.userData.decoration=true;m.add(engraving);
      g.add(m);targets.push(m);return m;
    }

    // Fechadura na face do penhasco: recebe cada chave por arrasto.
    const lock=new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.012,16),gold);lock.position.set(KEY_SOCKET[0],KEY_SOCKET[1],KEY_SOCKET[2]-.008);lock.rotation.x=Math.PI/2;lock.castShadow=true;base.add(lock);lock.userData.label='Fechadura da maquete';
    const keyholeMaterial=new THREE.MeshBasicMaterial({color:0x20180b});
    const hole=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,.002,16),keyholeMaterial);hole.position.y=.008;lock.add(hole);
    const slot=new THREE.Mesh(new THREE.BoxGeometry(.010,.002,.027),keyholeMaterial);slot.position.set(0,.008,.016);lock.add(slot);
    const key=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(.025,.006,8,24),gold);ring.rotation.x=Math.PI/2;key.add(ring);
    const stem=new THREE.Mesh(new THREE.BoxGeometry(.009,.009,.085),gold);stem.position.z=.06;key.add(stem);for(const z of [.075,.095]){const tooth=new THREE.Mesh(new THREE.BoxGeometry(.025,.009,.009),gold);tooth.position.set(.009,0,z);key.add(tooth);}key.rotation.x=Math.PI/2;key.rotation.z=-.22;key.scale.setScalar(1.8);
    const keyMaterial=gold.clone();keyMaterial.emissive.setHex(0xc68c24);keyMaterial.emissiveIntensity=.35;key.traverse(o=>{if(o.isMesh)o.material=keyMaterial;});const keyTip=new THREE.Object3D();keyTip.name='Ponta da chave';keyTip.position.set(0,0,.1025);key.add(keyTip);root.add(key);key.visible=false;

    const model={root,base,lower,upper,roof,cellar,targets,lock,key,keyTip,keySocket:hole,layers,facades,doorways,livingRoom:null,
      center:metros(.23,13.19,.93).setY(0),ready:false};

    function place(scene){
      scene.updateMatrixWorld(true);
      const toMaquette=new THREE.Matrix4().makeTranslation(-ORIGEM.x*ESCALA,-ORIGEM.y*ESCALA+TOPO,-ORIGEM.z*ESCALA).multiply(new THREE.Matrix4().makeScale(ESCALA,ESCALA,ESCALA));
      for(const [name,key] of Object.entries(PARTES)){
        const node=scene.getObjectByName(name);if(!node)throw new Error('O modelo da maquete não tem a parte "'+name+'".');
        const target=groups[key],local=new THREE.Matrix4().makeTranslation(0,-target.userData.restY,0).multiply(toMaquette).multiply(node.matrixWorld);
        node.parent.remove(node);local.decompose(node.position,node.quaternion,node.scale);target.add(node);
      }
      root.updateMatrixWorld(true);
      const frontZ=metros(0,0,2.2).z;
      for(const [floor,facade,n] of [[lower,facades[0],1],[upper,facades[1],2]]){
        const moving=[];
        for(const name of ['ala-oeste-piso-'+n,'ala-central-piso-'+n,'torre-piso-'+n,...(n===1?['portada']:[])]){const o=floor.getObjectByName(name);if(o)moving.push(o);}
        // Da estrutura e dos vãos, só o que fica na face da frente: parede, fiadas, cantaria e janelas.
        for(const holder of ['estrutura-piso-'+n,'vaos-piso-'+n])floor.getObjectByName(holder)?.children.forEach(o=>{if(!/^(soalho|vigamento|divisoria|aduela|rodape|escada|patamar|sala|cozinha|forro)/.test(o.name)&&new THREE.Box3().setFromObject(o).min.z>frontZ)moving.push(o);});
        moving.forEach(o=>facade.attach(o));
      }
      // Forro por cima dos quartos esconderia a busca pelos armários.
      const ceiling=upper.getObjectByName('forro-piso-2');ceiling?.parent.remove(ceiling);
      // A abóbada fecha o porão por cima; sem ela a descoberta aparece.
      const vaults=[];cellar.traverse(o=>{if(/^abobada/.test(o.name))vaults.push(o);});vaults.forEach(o=>o.parent.remove(o));
      root.updateMatrixWorld(true);
      root.traverse(o=>{
        if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
        // three r128 ignora KHR_materials_emissive_strength: janela e chama acesas perdem o brilho sem isto.
        const m=o.material;
        if(m&&/^(lit|flame)/.test(m.name||'')){m.emissive.copy(m.color);m.emissiveIntensity=1.1;}
        // O arquivo foi pintado para a luz forte do editor: pedra e ardósia com albedo 0,02–0,1 somem sob o luar da maquete.
        else if(m?.color&&!m.userData.clareado){m.userData.clareado=true;const k=Math.max(m.color.r,m.color.g,m.color.b);m.color.multiplyScalar(Math.min(CLAREAR,.85/Math.max(k,1e-3)));}
        if(o.userData.object&&!targets.includes(o))targets.push(o);
      });
      const box=name=>{const node=root.getObjectByName(name);return node&&new THREE.Box3().setFromObject(node);};
      const boxes=pattern=>{const out=[];root.traverse(o=>{if(o.isMesh&&pattern.test(o.name))out.push(new THREE.Box3().setFromObject(o));});return out;};
      // Rosa dos ventos: na verga da portada da torre, olhando para a frente.
      const lintel=box('verga-porta');
      if(lintel)mark(lower,'rosa','Rosa dos ventos',new THREE.Vector3((lintel.min.x+lintel.max.x)/2,lintel.max.y+.018,lintel.max.z+.004),Math.PI/2,.8);
      // Folha e ondas: nos pilares da frente das varandas oeste e leste.
      for(const [porch,id,label,side] of [['varanda-oeste','folha','Folha entalhada',-1],['varanda-leste','ondas','Ondas entalhadas',1]]){
        const node=root.getObjectByName(porch);if(!node)continue;const posts=[];node.traverse(o=>{if(o.isMesh&&/^pilar-torneado/.test(o.name))posts.push(new THREE.Box3().setFromObject(o));});
        const post=posts.sort((a,b)=>(b.max.z-a.max.z)||side*(b.max.x-a.max.x))[0];
        if(post)mark(lower,id,label,new THREE.Vector3((post.min.x+post.max.x)/2,(post.min.y+post.max.y)/2,post.max.z+.004),Math.PI/2,.5);
      }
      // Prateleira da despensa: no chão diante da louça, como os medalhões que vieram no modelo.
      const dishes=boxes(/^louca/),floorMark=targets.find(o=>o.userData.object==='relogio');
      if(dishes.length){const all=dishes.reduce((a,b)=>a.union(b),dishes[0].clone());const y=floorMark?floorMark.getWorldPosition(new THREE.Vector3()).y:all.min.y;
        mark(lower,'louca','Prateleira da despensa',new THREE.Vector3((all.min.x+all.max.x)/2,y,all.min.z-.03),0,.7);}
      model.ready=true;
    }
    model.place=place;
    if(options.gltf){place(options.gltf);}
    else if(options.url!==false&&THREE.GLTFLoader){
      new THREE.GLTFLoader().load(options.url||'assets/ac/casa-da-costa-pisos.glb',gltf=>{
        try{place(gltf.scene);}catch(error){options.onError?.(error);return;}
        options.onReady?.(model);
      },undefined,error=>options.onError?.(error));
    }
    return model;
  };
  global.createACMaquette.KEY_SOCKET=KEY_SOCKET;
  global.createACMaquette.metros=metros;
})(window);
