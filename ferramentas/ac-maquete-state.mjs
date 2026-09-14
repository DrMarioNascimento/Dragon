// Ensaio narrativo: nao altera o caso canonico nem a pontuacao publicada.
const chapters = [
  {name:'Exterior', explorer:'luz', target:'rosa', clue:'Na entrada, procure o desenho que conhece todas as direções, mas nunca sai do lugar. A primeira chave repousa no centro dele.'},
  {name:'Piso 1 · Térreo', explorer:'conhecimento', target:'relogio', clue:'Na sala do apagão há um guardião parado às 21h29. Procure abaixo de seu mostrador.'},
  {name:'Piso 2 · Primeiro andar', explorer:'luz', target:'armario-oeste', clue:'No quarto onde o sol termina o dia, a madeira guarda mais do que roupas. Examine o armário junto à parede oeste.'}
];
export function startMaquette(){return {level:0,ready:false,key:false,mistakes:0,score:0,evidence:[],lastAttempt:0};}
export function actMaquette(state,role,event,now=Date.now()){
  if(!state||state.level>=chapters.length)return false;
  const chapter=chapters[state.level];
  if(event.type==='maquete_orientar'){
    if(role===chapter.explorer||state.ready)return false;state.ready=true;return true;
  }
  if(role!==chapter.explorer||!state.ready)return false;
  if(event.type==='maquete_examinar'){
    if(state.key||typeof event.object!=='string'||event.object.length>40||now-state.lastAttempt<700)return false;
    state.lastAttempt=now;
    if(event.object===chapter.target)state.key=true;else state.mistakes++;
    return true;
  }
  if(event.type==='maquete_encaixar'&&state.key){
    state.score+=Math.max(2,8-Math.min(6,state.mistakes));
    state.evidence.push(['chave-exterior','chave-terreo','passagem-sob-despensa'][state.level]);
    state.level++;state.ready=false;state.key=false;state.mistakes=0;state.lastAttempt=0;return true;
  }
  return false;
}
export function maquetteView(state,role){
  if(!state)return null;
  const chapter=chapters[state.level];
  return {...state,complete:!chapter,name:chapter?.name||'A passagem revelada',explorer:chapter?.explorer||null,
    clue:chapter&&role!==chapter.explorer?chapter.clue:null};
}
