import {startMaquette,actMaquette,maquetteView,FECHADURAS,TOLERANCIA} from './ac-maquete-state.mjs';
export {FECHADURAS,TOLERANCIA} from './ac-maquete-state.mjs';
const validTip=tip=>Array.isArray(tip)&&tip.length===3&&tip.every(n=>Number.isFinite(n)&&Math.abs(n)<=3);
export const bonus = elapsed => Math.max(0, 30 - Math.floor(Math.max(0, elapsed) / 10));
export function earnedStages(room){
  const velaConcluida=room.stage==='registrado';
  return {velaConcluida,vela:velaConcluida?snapshot(room).bonus:0,chaves:room.maquete?.score||0,evidence:[...(room.maquete?.evidence||[])]};
}
export function apply(room, role, event, now = Date.now()) {
  if(room.percurso){
    const p=room.percurso;
    if(event.type==='percurso_identificar'){
      if(typeof event.jogador!=='string'||!event.jogador||event.jogador.length>128)return false;
      p.players??={};if(p.players[role]&&p.players[role]!==event.jogador)return false;
      if(Object.entries(p.players).some(([r,id])=>r!==role&&id===event.jogador))return false;
      p.players[role]=event.jogador;return true;
    }
    if(event.type==='sala_encerrar'){p.salaEncerrada??=[];if(!p.salaEncerrada.includes(role))p.salaEncerrada.push(role);return true;}
    if(event.type==='percurso_controle'){
      if(!['pausar','retomar'].includes(event.acao))return false;
      const wasPaused=p.paused.length>0;
      p.paused=p.paused.filter(r=>r!==role);if(event.acao==='pausar')p.paused.push(role);
      if(!wasPaused&&p.paused.length)p.pauseAt=now;
      if(wasPaused&&!p.paused.length){if(room.startedAt!==null&&room.finishedAt===null&&Number.isFinite(p.pauseAt))room.startedAt+=Math.max(0,now-p.pauseAt);p.pauseAt=null;}
      return true;
    }
    if(p.paused.length)return false;
    if(event.type==='sala_progresso'){
      if(p.ready.includes(role)||p.salaEncerrada?.includes(role)||event.total!==9||!Number.isInteger(event.objetos)||event.objetos<1||event.objetos>9)return false;
      p.salaIndividual??={};const old=p.salaIndividual[role]?.pontos||0;
      if(event.objetos<=old)return true;
      p.salaIndividual[role]={pontos:event.objetos};return true;
    }
    if(event.type==='sala_concluida'){
      if(p.salaEncerrada?.includes(role))return false;
      if(p.ready.includes(role))return false;
      if(event.objetos!==undefined||event.total!==undefined||event.tempoMs!==undefined){
        if(!Number.isInteger(event.objetos)||event.objetos!==9||event.total!==9||!Number.isFinite(event.tempoMs)||event.tempoMs<=0||event.tempoMs>3600000)return false;
        p.salaIndividual??={};p.salaIndividual[role]={pontos:event.objetos,tempoMs:Math.round(event.tempoMs)};
      }
      p.ready.push(role);return true;
    }
    if(p.ready.length!==(p.fragmento?.membros.length||2))return false;
  }
  if(event.type==='iniciar_maquete'){
    if(role!=='conhecimento'||room.stage!=='registrado'||room.maquete)return false;
    room.maquete=startMaquette();return true;
  }
  if(event.type.startsWith('maquete_')){
    if(!(room.percurso?.fragmento?.membros.map(m=>m.papel)||['luz','conhecimento']).every(r=>[...room.peers.values()].some(p=>p.role===r)))return false;
    const state=room.maquete;
    if(event.type==='maquete_mover'){
      if(!state?.key||maquetteView(state,role).chaveiro!==role||!validTip(event.tip))return false;
      room.keyMotion={tip:[...event.tip],at:now,level:state.level};return true;
    }
    if(event.type==='maquete_encaixar'){
      const motion=room.keyMotion;
      // A fechadura muda de lugar a cada capitulo: encaixar e conferido contra
      // a fechadura DAQUELE nivel, nunca contra um ponto fixo do modelo.
      const alvo=FECHADURAS[state?.level];
      if(!motion||!alvo||motion.level!==state?.level||now-motion.at>1500||Math.hypot(...motion.tip.map((n,i)=>n-alvo[i]))>=TOLERANCIA)return false;
    }
    const accepted=actMaquette(state,role,event,now);if(accepted)room.keyMotion=null;return accepted;
  }
  const rule = { iniciar: ['luz','posicionar','posicionar'], posicionar: ['luz','posicionar','castical'], encaixar: ['luz','castical','iluminar'], descobrir: ['conhecimento','iluminar','encontrado'], registrar: ['conhecimento','encontrado','registrado'] }[event.type];
  if (event.type === 'feixe') {
    if (role !== 'luz' || room.stage !== 'iluminar') return false;
    if (![event.origin,event.target].every(v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(n) && Math.abs(n) <= 30))) return false;
    room.beam = { origin: event.origin, target: event.target, at: now }; return true;
  }
  if (!rule || role !== rule[0] || room.stage !== rule[1]) return false;
  if (event.type === 'descobrir' && (!room.beam || now - room.beam.at > 1500 || ![...room.peers.values()].some(p => p.role === 'luz'))) return false;
  if (event.type === 'iniciar' && room.startedAt !== null) return false;
  room.startedAt ??= now;
  room.stage = rule[2];
  if (event.type === 'descobrir') room.finishedAt = now;
  return true;
}
export function snapshot(room, now = Date.now(), role = null) {
  const elapsed = room.startedAt === null ? 0 : Math.max(0, ((room.finishedAt ?? (room.percurso?.paused.length?room.percurso.pauseAt:now) ?? now) - room.startedAt) / 1000);
  return { percurso: room.percurso || null, stage: room.stage, elapsed, bonus: bonus(elapsed), started: room.startedAt !== null, finished: room.finishedAt !== null, beam: room.beam ? { ...room.beam, age: now - room.beam.at } : null, online: [...new Set([...room.peers.values()].map(p => p.role))], keyMotion:room.keyMotion&&now-room.keyMotion.at<=1500&&role!==maquetteView(room.maquete,role)?.chaveiro?{tip:room.keyMotion.tip,age:now-room.keyMotion.at}:null, maquete:maquetteView(room.maquete,role) };
}
