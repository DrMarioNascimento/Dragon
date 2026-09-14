// Servidor de ensaio local com checkpoint opcional; nao e o backend publicado.
import http from 'node:http';
import {distribuirFragmentos} from './ac-fragmentos.mjs';
import {loadRooms,saveRooms,roomRecord,ROOM_RETENTION} from './ac-room-store.mjs';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startMaquette, actMaquette, maquetteView } from './ac-maquete-state.mjs';

export const KEY_SOCKET=[.48,-.13,.888];
const validTip=tip=>Array.isArray(tip)&&tip.length===3&&tip.every(n=>Number.isFinite(n)&&Math.abs(n)<=3);
export const bonus = elapsed => Math.max(0, 30 - Math.floor(Math.max(0, elapsed) / 10));
export function earnedStages(room){
  const velaConcluida=room.stage==='registrado';
  return {velaConcluida,vela:velaConcluida?snapshot(room).bonus:0,chaves:room.maquete?.score||0,evidence:[...(room.maquete?.evidence||[])]};
}
export function createRoom(now = Date.now()) {
  return { id: randomBytes(6).toString('hex'), tokens: { luz: randomBytes(18).toString('hex'), conhecimento: randomBytes(18).toString('hex') }, stage: 'posicionar', startedAt: null, finishedAt: null, createdAt: now, updatedAt: now, beam: null, peers: new Map() };
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
      if(!state?.key||maquetteView(state,role).explorer!==role||!validTip(event.tip))return false;
      room.keyMotion={tip:[...event.tip],at:now,level:state.level};return true;
    }
    if(event.type==='maquete_encaixar'){
      const motion=room.keyMotion;
      if(!motion||motion.level!==state?.level||now-motion.at>1500||Math.hypot(...motion.tip.map((n,i)=>n-KEY_SOCKET[i]))>=.025)return false;
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
  return { percurso: room.percurso || null, stage: room.stage, elapsed, bonus: bonus(elapsed), started: room.startedAt !== null, finished: room.finishedAt !== null, beam: room.beam ? { ...room.beam, age: now - room.beam.at } : null, online: [...new Set([...room.peers.values()].map(p => p.role))], keyMotion:room.keyMotion&&now-room.keyMotion.at<=1500&&role!==maquetteView(room.maquete,role)?.explorer?{tip:room.keyMotion.tip,age:now-room.keyMotion.at}:null, maquete:maquetteView(room.maquete,role) };
}
export function createServer(root,{stateFile=null}={}) {
  const rooms = loadRooms(stateFile);
  function broadcast(room) { for (const peer of room.peers.values()) if(!peer.res.destroyed&&!peer.res.writableEnded)peer.res.write('data: '+JSON.stringify(snapshot(room,Date.now(),peer.role))+'\n\n'); }
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const json = (code, value) => { res.writeHead(code, {'Content-Type':'application/json', 'Cache-Control':'no-store'});res.end(JSON.stringify(value)); };
    // This service accepts same-origin browser writes only; no CORS wildcard.
    if (req.method === 'POST' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return json(403,{error:'Origem invalida'});
    if(url.pathname==='/api/ac/fragmentos/entrar'&&req.method==='POST'){
      let body='';try{
        for await(const chunk of req){body+=chunk;if(body.length>8192)return json(413,{error:'Lista muito grande'});}
        const {run,roster,jogador}=JSON.parse(body),groups=distribuirFragmentos(roster,run);
        const planned=groups.find(g=>g.membros.some(m=>m.id===jogador));if(!planned)return json(403,{error:'Jogador fora desta atividade'});
        const signature=JSON.stringify(roster.map(p=>p.id).sort());
        let existing=[...rooms.values()].filter(r=>r.percurso?.runId===run&&r.percurso.fragmento);
        if(existing.length&&existing[0].percurso.roster!==signature)return json(409,{error:'A lista desta atividade ja foi fixada. Reabra pela mesa.'});
        if(!existing.length){
          if(rooms.size+groups.length>100)return json(503,{error:'Limite de salas de ensaio'});
          const created=groups.map(fragmento=>{const room=createRoom();if(fragmento.membros.length===3)room.tokens.apoio=randomBytes(18).toString('hex');room.percurso={runId:run,ready:[],paused:[],roster:signature,fragmento,players:Object.fromEntries(fragmento.membros.map(m=>[m.papel,m.id]))};rooms.set(room.id,room);return room;});
          try{saveRooms(stateFile,rooms);}catch{for(const room of created)rooms.delete(room.id);return json(503,{error:'Nao foi possivel salvar os Fragmentos'});}existing=created;
        }
        const room=existing.find(r=>r.percurso.fragmento.membros.some(m=>m.id===jogador));const member=room.percurso.fragmento.membros.find(m=>m.id===jogador);
        return json(200,{sala:room.id,papel:member.papel,chave:room.tokens[member.papel],fragmento:room.percurso.fragmento});
      }catch{return json(400,{error:'Lista de participantes invalida. Sao necessarios de 2 a 12 jogadores.'});}
    }
    if (url.pathname === '/api/ac/rooms' && req.method === 'POST') {
      if (rooms.size >= 100) return json(503,{error:'Limite de salas de ensaio'});
      const room=createRoom();
      if(url.searchParams.has('run')){
        const runId=url.searchParams.get('run');if(!runId||runId.length>180)return json(400,{error:'Execucao invalida'});
        room.percurso={runId,ready:[],paused:[]};
      }else if(url.searchParams.get('atividade')==='maquete')room.maquete=startMaquette();
      rooms.set(room.id,room);
      try{saveRooms(stateFile,rooms);}catch{rooms.delete(room.id);return json(503,{error:'Nao foi possivel salvar a sala. Tente novamente.'});}
      return json(201,{id:room.id,tokens:room.tokens});
    }
    if(url.pathname==='/api/ac/individual'&&req.method==='GET'){
      const run=url.searchParams.get('run');
      return json(200,[...rooms.values()].filter(r=>r.percurso?.runId===run).map(r=>({version:1,kind:'individual',etapas:earnedStages(r),sala:r.id,runId:run,players:r.percurso.players||{},salaIndividual:r.percurso.salaIndividual||{}})));
    }
    if(url.pathname==='/api/ac/results'&&req.method==='GET'){
      const run=url.searchParams.get('run');
      return json(200,[...rooms.values()].filter(r=>r.percurso?.runId===run&&r.maquete?.level===3).map(r=>({version:1,sala:r.id,runId:run,players:r.percurso.players||{},salaIndividual:r.percurso.salaIndividual||{},vela:snapshot(r).bonus,chaves:r.maquete.score,evidence:[...r.maquete.evidence]})));
    }
    if(url.pathname.startsWith('/api/ac/results/')&&req.method==='GET'){
      const room=rooms.get(url.pathname.split('/').pop());
      if(!room?.percurso||!room.maquete||room.maquete.level!==3)return json(404,{error:'Resultado ainda indisponivel'});
      return json(200,{version:1,sala:room.id,runId:room.percurso.runId,vela:snapshot(room).bonus,chaves:room.maquete.score,evidence:[...room.maquete.evidence]});
    }
    if (url.pathname.startsWith('/api/ac/')) {
      const room=rooms.get(url.searchParams.get('sala')), role=url.searchParams.get('papel');
      if (!room || !Object.hasOwn(room.tokens,role) || room.tokens[role] !== url.searchParams.get('chave')) return json(403,{error:'Convite invalido ou sala expirada. Confira o convite da dupla.'});
      if(url.pathname==='/api/ac/state'&&req.method==='GET')return json(200,{...snapshot(room,Date.now(),role),percurso:room.percurso||null});
      if (url.pathname === '/api/ac/events' && req.method === 'GET') {
        res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive'});
        const id=randomBytes(8).toString('hex');room.peers.set(id,{role,res});broadcast(room);
        req.on('close',()=>{room.peers.delete(id);broadcast(room);});return;
      }
      if (url.pathname === '/api/ac/action' && req.method === 'POST') {
        let body='';try { for await (const data of req) {body+=data;if(body.length>4096){json(413,{error:'Limite excedido'});return;}}const event=JSON.parse(body);const before=roomRecord(room);const accepted=apply(room,role,event);
          if(accepted&&!['feixe','maquete_mover'].includes(event.type)){
            room.updatedAt=Date.now();try{saveRooms(stateFile,rooms);}catch{Object.assign(room,before);return json(503,{error:'Nao foi possivel salvar o progresso. A acao nao foi confirmada.'});}
          }
          if(accepted)broadcast(room);return json(accepted?200:409,{accepted}); } catch {return json(400,{error:'Acao invalida'});}
      }
      return json(404,{error:'Rota ausente'});
    }
    if (!['GET','HEAD'].includes(req.method)) return json(405,{error:'Metodo invalido'});
    if(url.pathname==='/'){res.writeHead(302,{Location:'/v1/AC-escrivaninha.html'+url.search,'Cache-Control':'no-store'});res.end();return;}
    let path;try{path=resolve(root,'.'+decodeURIComponent(url.pathname === '/' ? '/v1/AC-escrivaninha.html' : url.pathname));}catch{return json(400,{error:'Caminho invalido'});}
    if (!path.startsWith(root+sep) || path.split(sep).some(part=>part.startsWith('.'))) return json(403,{error:'Caminho restrito'});
    const publicCase=url.pathname==='/v1/casos/casa-da-costa.json';
    const mime=publicCase?'application/json; charset=utf-8':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'}[extname(path)];
    if(!mime)return json(403,{error:'Tipo restrito'});
    try{const content=await readFile(path);res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:content);}catch{json(404,{error:'Arquivo ausente'});}
  });
  const tick=setInterval(()=>{const now=Date.now();for(const [id,room] of rooms){if(!room.peers.size&&now-(room.updatedAt??room.createdAt)>ROOM_RETENTION)rooms.delete(id);else broadcast(room);}},1000);tick.unref();
  server.on('close',()=>{clearInterval(tick);for(const room of rooms.values())for(const peer of room.peers.values())peer.res.end();});
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
  createServer(root,{stateFile:resolve(root,'.ac-ensaio','salas.json')}).listen(Number(process.env.AC_PORT || 8781),'127.0.0.1',()=>process.stdout.write('AC cooperacao local: http://127.0.0.1:'+(process.env.AC_PORT||8781)+'/v1/AC-escrivaninha.html\n'));
}
