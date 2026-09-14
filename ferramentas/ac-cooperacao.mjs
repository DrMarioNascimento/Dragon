// Servidor de ensaio local com checkpoint opcional; nao e o backend publicado.
import http from 'node:http';
import {distribuirFragmentos} from './ac-fragmentos.mjs';
import {loadRooms,saveRooms,roomRecord,ROOM_RETENTION} from './ac-room-store.mjs';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startMaquette, actMaquette, maquetteView } from './ac-maquete-state.mjs';

import {apply,snapshot,earnedStages} from '../v1/js/ac-core.mjs';
export {apply,snapshot,earnedStages,KEY_SOCKET,bonus} from '../v1/js/ac-core.mjs';
export function createRoom(now = Date.now()) {
  return { id: randomBytes(6).toString('hex'), tokens: { luz: randomBytes(18).toString('hex'), conhecimento: randomBytes(18).toString('hex') }, stage: 'posicionar', startedAt: null, finishedAt: null, createdAt: now, updatedAt: now, beam: null, peers: new Map() };
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
    const mime=publicCase?'application/json; charset=utf-8':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'}[extname(path)];
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
