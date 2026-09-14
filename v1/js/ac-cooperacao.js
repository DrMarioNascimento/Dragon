/* Transporte do ensaio em dupla. Nao simula o outro jogador. */
(function(global){
  global.ACCooperation = async function(onState,onStatus,options={}){
    let params=new URLSearchParams(location.search),tokens;
    // Demonstracao isolada: nenhum convite, API, pontuacao ou sala real.
    if(params.get('demo')==='solo'&&!params.has('sala')&&!options.maquette){
      let stage='iluminar';
      const snapshot=()=>({stage,online:['luz','conhecimento'],started:true,elapsed:0,bonus:0,beam:{origin:[.47,.025,.25],target:[.47,.098,.10],age:0}});
      const tick=setInterval(()=>onState(snapshot()),200);
      setTimeout(()=>{onStatus(true);onState(snapshot());},0);
      return {role:'conhecimento',invite:null,demo:true,close(){clearInterval(tick);},async send(type){
        if(type==='descobrir'&&stage==='iluminar')stage='encontrado';
        else if(type==='registrar'&&stage==='encontrado')stage='registrado';
        else return false;
        onState(snapshot());return true;
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
