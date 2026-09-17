/* Transporte do ensaio em dupla. Nao simula o outro jogador. */
(function(global){
  /* O Solo precisa do MESMO motor da Mesa. Enquanto ele teve uma cópia dos
     capítulos aqui dentro, qualquer mudança de dica, esconderijo ou fechadura
     tinha de ser feita duas vezes — e a segunda vez nunca é feita. */
  var MEU_SRC=(document.currentScript&&document.currentScript.src)||location.href;
  var motorSolo=null;
  function motor(){return motorSolo||(motorSolo=import(new URL('ac-maquete-state.mjs',MEU_SRC).href));}

  global.ACCooperation = async function(onState,onStatus,options={}){
    let params=new URLSearchParams(location.search),tokens;
    // Percurso solo integral: os dois papeis continuam existindo, mas o mesmo
    // aparelho alterna entre eles. Estado local, sem API e sem cortar 3D/RA.
    if(params.get('demo')==='solo'&&!params.has('sala')){
      const M=await motor();
      const KEY='ac:solo-integral:v1';
      let saved=null;try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(_){ }
      let local=saved&&saved.version===1?saved:{version:1,stage:'posicionar',started:Date.now(),janelaConcluida:false,maquete:null,keyMotion:null};
      const persist=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(local))}catch(_){ }};
      /* Quem joga sozinho ocupa os dois lados, um de cada vez: antes da leitura
         ele é o da FECHADURA (quem lê a anotação); depois, o da CHAVE. */
      const soloRole=()=>{
        if(!local.maquete)return ['posicionar','castical'].includes(local.stage)?'luz':'conhecimento';
        const c=M.CAPITULOS[local.maquete.level];if(!c)return 'conhecimento';
        return local.maquete.ready?c.chaveiro:M.papelDaFechadura(c);
      };
      const vista=()=>{
        const v=M.maquetteView(local.maquete,soloRole());
        if(!v)return null;
        const c=M.CAPITULOS[local.maquete.level];
        /* No Solo a pessoa é os dois lados: o que a Mesa reparte, aqui some
           junto. Sem a fechadura visível, ninguém poderia mirar. */
        if(c){v.fechadura=c.fechadura;v.fechaduraNome=c.fechaduraNome;v.clue=c.dica;v.esconderijo=c.esconderijo;}
        return v;
      };
      const snapshot=()=>({stage:local.stage,soloRole:soloRole(),online:['luz','conhecimento'],started:true,elapsed:Math.max(0,(Date.now()-local.started)/1000),bonus:0,
        beam:['iluminar','encontrado','registrado'].includes(local.stage)?{origin:[.47,.025,.25],target:[.47,.098,.10],age:0}:null,keyMotion:local.keyMotion,maquete:vista()});
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
        else if(type==='iniciar_maquete'&&local.janelaConcluida&&!local.maquete){local.maquete=M.startMaquette();ok=true;}
        else if(type==='maquete_mover'&&local.maquete&&local.maquete.key){local.keyMotion={tip:extra.tip,age:0};ok=true;}
        else if(type==='maquete_encaixar'&&local.maquete){
          /* O encaixe também é conferido no Solo: sem isto o arrasto vira
             enfeite e a bancada deixaria de medir o que a Mesa mede. */
          const alvo=M.FECHADURAS[local.maquete.level],m=local.keyMotion;
          if(alvo&&m&&Array.isArray(m.tip)&&Math.hypot(...m.tip.map((n,i)=>n-alvo[i]))<M.TOLERANCIA){
            ok=M.actMaquette(local.maquete,soloRole(),{type},Date.now());
            if(ok)local.keyMotion=null;
          }
        }
        else if(type&&type.indexOf('maquete_')===0&&local.maquete){
          ok=M.actMaquette(local.maquete,soloRole(),{type,...extra},Date.now());
        }
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
