import {createHash} from 'node:crypto';
export const COLORS=[
 {nome:'Fragmento da Névoa',cor:'Vermelho',hex:'#db514d',simbolo:'🟥'},
 {nome:'Fragmento da Tempestade',cor:'Azul',hex:'#478bdd',simbolo:'🟦'},
 {nome:'Fragmento do Farol',cor:'Dourado',hex:'#d5ad43',simbolo:'🟨'},
 {nome:'Fragmento da Noite',cor:'Roxo',hex:'#a179d6',simbolo:'🟪'},
 {nome:'Fragmento do Jardim',cor:'Verde',hex:'#4eab79',simbolo:'🟩'},
 {nome:'Fragmento da Aurora',cor:'Laranja',hex:'#e28c44',simbolo:'🟧'}
];
export function distribuirFragmentos(roster,run){
 if(!Array.isArray(roster)||roster.length<2||roster.length>12||typeof run!=='string'||!run||run.length>180)throw Error('A atividade cooperativa precisa de 2 a 12 participantes.');
 const members=roster.map(p=>({id:String(p.id||''),nome:String(p.nome||'Jogador').slice(0,60)}));
 if(members.some(p=>!p.id||p.id.length>128)||new Set(members.map(p=>p.id)).size!==members.length)throw Error('Lista de participantes inválida.');
 const hash=id=>createHash('sha256').update(run+'|'+id).digest('hex');
 members.sort((a,b)=>hash(a.id).localeCompare(hash(b.id))||a.id.localeCompare(b.id));
 const groups=[];
 while(members.length){const size=members.length===3?3:2;const ids=members.splice(0,size);groups.push({...COLORS[groups.length],numero:groups.length+1,membros:ids.map((p,i)=>({...p,papel:['luz','conhecimento','apoio'][i]}))});}
 return groups;
}
