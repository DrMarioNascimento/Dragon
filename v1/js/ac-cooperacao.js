/* Transporte do ensaio em dupla. Nao simula o outro jogador. */
(function(global){
  global.ACCooperation = async function(onState,onStatus,options={}){
    let params=new URLSearchParams(location.search),tokens;
    // Percurso solo integral: os dois papeis continuam existindo, mas o mesmo
    // aparelho alterna entre eles. Estado local, sem API e sem cortar 3D/RA.
    if(params.get('demo')==='solo'&&!params.has('sala')){
      const KEY='ac:solo-integral:v1';
      const chapters=[
        {name:'Exterior',explorer:'luz',target:'rosa',clue:'Na entrada, procure o desenho que conhece todas as direções, mas nunca sai do lugar. A primeira chave repousa no centro dele.'},
        {name:'Piso 1 · Térreo',explorer:'conhecimento',target:'relogio',clue:'Na sala do apagão há um guardião parado às 21h29. Procure abaixo de seu mostrador.'},
        {name:'Piso 2 · Primeiro andar',explorer:'luz',target:'armario-oeste',clue:'No quarto onde o sol termina o dia, a madeira guarda mais do que roupas. Examine o armário junto à parede oeste.'}
      ];
      let saved=null;try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(_){ }
      let local=saved&&saved.version===1?saved:{version:1,stage:'posicionar',started:Date.now(),maquete:null,keyMotion:null};
      const persist=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(local))}catch(_){ }};
      const soloRole=()=>{
        if(!local.maquete)return ['posicionar','castical'].includes(local.stage)?'luz':'conhecimento';
        const c=chapters[local.maquete.level];if(!c)return 'conhecimento';return local.maquete.ready?c.explorer:(c.explorer==='luz'?'conhecimento':'luz');
      };
      const maquetteView=()=>{if(!local.maquete)return null;const m=local.maquete,c=chapters[m.level];return {...m,complete:!c,name:c?.name||'A passagem revelada',explorer:c?.explorer||null,target:c?.target||null,targetLabel:c?.target==='rosa'?'rosa dos ventos':c?.target==='relogio'?'relógio parado às 21h29':c?.target==='armario-oeste'?'armário junto à parede oeste':null,clue:c&&soloRole()!==c.explorer?c.clue:null};};
      const snapshot=()=>({stage:local.stage,soloRole:soloRole(),online:['luz','conhecimento'],started:true,elapsed:Math.max(0,(Date.now()-local.started)/1000),bonus:0,
        beam:['iluminar','encontrado','registrado'].includes(local.stage)?{origin:[.47,.025,.25],target:[.47,.098,.10],age:0}:null,keyMotion:local.keyMotion,maquete:maquetteView()});
      const tick=setInterval(()=>onState(snapshot()),200);
      setTimeout(()=>{onStatus(true);onState(snapshot());},0);
      return {role:soloRole(),invite:null,demo:true,close(){clearInterval(tick);},async send(type,extra={}){
        let ok=false;
        if(type==='iniciar')ok=true;
        else if(type==='posicionar'&&local.stage==='posicionar'){local.stage='castical';ok=true;}
        else if(type==='encaixar'&&local.stage==='castical'){local.stage='iluminar';ok=true;}
        else if(type==='feixe'&&local.stage==='iluminar')ok=true;
        else if(type==='descobrir'&&local.stage==='iluminar'){local.stage='encontrado';ok=true;}
        else if(type==='registrar'&&local.stage==='encontrado'){local.stage='registrado';ok=true;}
        else if(type==='iniciar_maquete'&&local.stage==='registrado'&&!local.maquete){local.maquete={level:0,ready:false,key:false,mistakes:0,score:0,evidence:[],lastAttempt:0};ok=true;}
        else if(type==='maquete_orientar'&&local.maquete){const m=local.maquete,c=chapters[m.level];if(c&&!m.ready&&soloRole()!==c.explorer){m.ready=true;ok=true;}}
        else if(type==='maquete_examinar'&&local.maquete){const m=local.maquete,c=chapters[m.level];if(c&&m.ready&&!m.key&&soloRole()===c.explorer){if(extra.object===c.target)m.key=true;else m.mistakes++;ok=true;}}
        else if(type==='maquete_mover'&&local.maquete&&local.maquete.key){local.keyMotion={tip:extra.tip,age:0};ok=true;}
        else if(type==='maquete_encaixar'&&local.maquete&&local.maquete.key){const m=local.maquete;m.score+=Math.max(2,8-Math.min(6,m.mistakes));m.evidence.push(['chave-exterior','chave-terreo','passagem-sob-despensa'][m.level]);m.level++;m.ready=false;m.key=false;m.mistakes=0;m.lastAttempt=0;local.keyMotion=null;ok=true;}
        if(ok)persist();onState(snapshot());return ok;
      }};
    }

    const scenario=window.ACRoom?ACRoom.seed():params.get('cenario');
    if(!params.has('sala')){
      const res=await (globalThis.ACFetch||fetch)('/api/ac/rooms'+(options.maquette?'?atividade=maquete':''),{method:'POST'});if(!res.ok)throw Error('Abra pelo servidor de cooperação da AC.');
      const room=await res.json();tokens=room.tokens;
      const edition=params.has('edicao');
      params=new URLSearchParams({sala:room.id,papel:'luz',chave:tokens.luz});if(edition)params.set('edicao','1');if(scenario)params.set('cenario',scenario);
      history.replaceState(null,'','?'+params);
      sessionStorage.setItem('ac:convite:'+room.id,JSON.stringify(tokens));
    }
    if(scenario&&!params.has('cenario')){params.set('cenario',scenario);history.replaceState(null,'','?'+params);}
    const role=params.get('papel');if(!['luz','conhecimento','apoio'].includes(role))throw Error('Papel inválido.');
    tokens ??= JSON.parse(sessionStorage.getItem('ac:convite:'+params.get('sala'))||'null');
    const query=new URLSearchParams({sala:params.get('sala'),papel:role,chave:params.get('chave')});
    const stream=new (globalThis.ACEvents||EventSource)('/api/ac/events?'+query);
    stream.onopen=()=>onStatus(true);stream.onerror=()=>onStatus(false);
    stream.onmessage=e=>onState(JSON.parse(e.data));
    return {role,invite:tokens?location.origin+location.pathname+'?'+new URLSearchParams({sala:params.get('sala'),papel:'conhecimento',chave:tokens.conhecimento,...(scenario?{cenario:scenario}:{})}):null,
      async send(type,extra={}){const res=await (globalThis.ACFetch||fetch)('/api/ac/action?'+query,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,...extra})});if(!res.ok&&res.status!==409)throw Error('Conexão interrompida.');return res.ok;},close(){stream.close();}};
  };
})(window);
