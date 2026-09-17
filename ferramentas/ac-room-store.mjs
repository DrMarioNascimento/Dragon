// Checkpoints locais do ensaio; nunca servidos pelo HTTP estatico.
import {readFileSync,mkdirSync,openSync,writeFileSync,fsyncSync,closeSync,renameSync} from 'node:fs';
import {dirname} from 'node:path';
export const ROOM_RETENTION=7*24*3600000;
export function roomRecord(room){
 return {percurso:room.percurso?structuredClone(room.percurso):null,id:room.id,tokens:{...room.tokens},stage:room.stage,startedAt:room.startedAt,finishedAt:room.finishedAt,createdAt:room.createdAt,updatedAt:room.updatedAt??room.createdAt,maquete:room.maquete?structuredClone(room.maquete):null};
}
function valid(r){
 const stamp=n=>n===null||(Number.isFinite(n)&&n>=0),hex=(v,n)=>typeof v==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(v);
 if(!r||!hex(r.id,12)||!hex(r.tokens?.luz,36)||!hex(r.tokens?.conhecimento,36)||(r.tokens?.apoio!==undefined&&!hex(r.tokens.apoio,36))||!['posicionar','castical','iluminar','encontrado','registrado'].includes(r.stage)||![r.createdAt,r.updatedAt].every(n=>Number.isFinite(n)&&n>=0)||!stamp(r.startedAt)||!stamp(r.finishedAt))return false;
 if(r.percurso){const p=r.percurso;if(typeof p.runId!=='string'||!p.runId||p.runId.length>180||![p.ready,p.paused].every(a=>Array.isArray(a)&&a.length<=(r.tokens.apoio?3:2)&&new Set(a).size===a.length&&a.every(v=>Object.hasOwn(r.tokens,v))))return false;}
 if(r.percurso?.players&&Object.entries(r.percurso.players).some(([role,id])=>!Object.hasOwn(r.tokens,role)||typeof id!=='string'||!id||id.length>128))return false;
 const m=r.maquete;if(m===null)return true;
 return m&&Number.isInteger(m.level)&&m.level>=0&&m.level<=3&&typeof m.ready==='boolean'&&typeof m.key==='boolean'&&Number.isInteger(m.mistakes)&&m.mistakes>=0&&Number.isInteger(m.score)&&m.score>=0&&m.score<=24&&Number.isFinite(m.lastAttempt)&&Array.isArray(m.evidence)&&m.evidence.length===m.level&&m.evidence.every((v,i)=>v===['chave-exterior','chave-dos-quartos','passagem-sob-despensa'][i]);
}
export function loadRooms(path){
 if(!path)return new Map();let raw;try{raw=readFileSync(path,'utf8');}catch(error){if(error.code==='ENOENT')return new Map();throw error;}
 let saved;try{saved=JSON.parse(raw);}catch{throw Error('Checkpoint AC ilegivel; arquivo preservado para recuperacao.');}
 if(saved.version!==1||!Array.isArray(saved.rooms)||saved.rooms.length>100||!saved.rooms.every(valid)||new Set(saved.rooms.map(r=>r.id)).size!==saved.rooms.length)throw Error('Checkpoint AC invalido; arquivo preservado para recuperacao.');
 return new Map(saved.rooms.filter(r=>Date.now()-r.updatedAt<ROOM_RETENTION).map(r=>[r.id,{...r,beam:null,peers:new Map()}]));
}
export function saveRooms(path,rooms){
 if(!path)return;
 mkdirSync(dirname(path),{recursive:true});const temp=path+'.tmp';const fd=openSync(temp,'w',0o600);
 try{writeFileSync(fd,JSON.stringify({version:1,rooms:[...rooms.values()].map(roomRecord)}));fsyncSync(fd);}finally{closeSync(fd);}
 renameSync(temp,path);
}
