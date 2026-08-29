const story=[
 'A garoa apagava as cores, menos os números no verso de um recibo.',
 'O relógio da farmácia insistia num horário que a rua já havia deixado para trás.',
 'No pulso do Técnico, duas palavras apareceram e desapareceram.',
 'Uma pasta azul abriu; metal girou sob o balcão.',
 'A voz no rádio parecia conhecida, mas o chiado guardou parte dela.',
 'A fechadura nova cedeu para uma mão que conhecia o encaixe.',
 'Quando a imagem voltou, havia uma etiqueta nova e um malote baixo demais.',
 'A frase “falta dinheiro” chegou antes da conferência.'
];
const terminalText='Um malote está no chão. A câmera 3 perdeu 87 segundos. O sistema insiste que nada foi registrado.';
function typeTerminal(){const el=document.getElementById('terminalLine');let i=0;el.textContent='';const write=()=>{if(i<terminalText.length){const step=Math.random()>.9?2:1;el.textContent=terminalText.slice(0,i+=step);setTimeout(write,22+Math.random()*34)}};setTimeout(write,420)}
typeTerminal();
const typedScreens=new Set();
document.querySelectorAll('.section-head>p').forEach(el=>{const text=el.getAttribute('aria-label')||el.textContent.trim();el.dataset.terminalText=text;el.classList.add('terminal-copy');el.textContent=''});
function typeScreenTerminal(name){if(typedScreens.has(name))return;const el=document.querySelector(`[data-screen="${name}"] .section-head>p`);if(!el)return;typedScreens.add(name);const text=el.dataset.terminalText||el.getAttribute('aria-label')||'';let i=0;el.textContent='';const write=()=>{if(i<text.length){el.textContent=text.slice(0,++i);setTimeout(write,24+Math.random()*28)}};setTimeout(write,220)}
const pieces=[
 {id:'F2-01',title:'O recibo',text:'7h47 está legível sob uma mancha de café. A borda procura o reflexo de um relógio.',pos:'0% 0%'},
 {id:'F2-02',title:'A rota',text:'A prancheta registra R-4. A entrada parece ter sido antecipada.',pos:'50% 0%'},
 {id:'F2-03',title:'Erro 17',text:'No pulso do Técnico, a captura termina antes do nome do remetente.',pos:'100% 0%'},
 {id:'F2-08',title:'A fechadura',text:'O reparo é recente. Alguém conhecia o estalo do novo encaixe.',pos:'0% 100%'},
 {id:'F2-09',title:'A voz',text:'“Fundos. Dois minutos.” O áudio carrega uma voz conhecida.',pos:'50% 100%'},
 {id:'F2-10',title:'A etiqueta',text:'Duas fibras, dois brilhos, dois destinos na mesma superfície.',pos:'100% 100%'}
];
const suspects=['Selecione…','Subgerente','Funcionário da Limpeza','Técnico de Manutenção','Caixa Veterano','Estagiária','Segurança Interno','Motorista do carro-forte','Cliente Desconhecido','Gerente'];
const motives=['Selecione…','Encobrir/desviar diferença da auditoria','Roubo oportunista','Erro humano','Golpe externo','Vingança pessoal'];
const actions=['Selecione…','Induzir reset + afastar Segurança + trocar/reetiquetar','Deslocar o malote por engano','Desligar a câmera para manutenção','Trocar a pasta azul','Alterar a rota do veículo'];
const evidence=['P01 + P02 · antecipação e 7h47','P03 + P07 · Erro 17 e fio preparado','P05 + P08 · chaveiro e porta','P09 + P06 · rádio e 87 segundos','P10 + P11 · etiqueta e percurso','P12 · pasta azul'];
const routes=[
 {id:'Relógio',items:['P02 fixa 7h47','P01 prova pedido interno','P06 fecha 87 segundos','P11 mostra deslocamento','P10 revela reetiqueta']},
 {id:'Acesso',items:['P12 localiza a queda','P05 identifica a chave','P08 liga Limpeza à porta','P11 traça o malote','P04 liga 17—B ao Subgerente']},
 {id:'Código 17—B',items:['P03 mostra convocação','P04 põe o código com o Subgerente','P09 prova o afastamento','P05 converte código em acesso','P06 encaixa a janela']}
];
const investigations=[
 {verb:'OBSERVAR',name:'Janela do Norte',brief:'Compare a rua com registros internos. Selecione duas peças que corrigem o relógio da farmácia.',clues:['Recibo 7h47','Farmácia 7h44','Chegada do veículo','Garoa na calçada'],correct:[0,1],reward:['P01','P02']},
 {verb:'DISCERNIR',name:'Sala Clara',brief:'A luz revela tudo e destaca nada. Entre reflexos e objetos semelhantes, selecione as três observações que formam uma rota física verificável até os arquivos.',clues:['Reflexo do chaveiro 17—B','Pasta azul sob o balcão','Fechadura com riscos recentes','Envelope com tinta azul','Sola úmida no corredor','Mancha vermelha do lacre'],correct:[0,2,4],reward:['P05','P08','P11']},
 {verb:'AUTENTICAR',name:'Rádio em Três Camadas',brief:'Separe voz, aparelho e horário. Selecione as camadas que ligam a ordem ao início dos 87 segundos.',clues:['Voz atribuída ao Subgerente','Mancha vermelha','Log do rádio reserva','Recibo da padaria'],correct:[0,2],reward:['P09','P06']}
];
const lots=[
 {type:'PILAR',name:'Lacre sob luz',cost:4,text:'Revela a borda de uma etiqueta sobreposta.',result:'P10 validado: havia duas etiquetas e dois destinos.'},
 {type:'CONECTOR',name:'Rastro de água',cost:3,text:'Liga posições antes e depois da câmera.',result:'P11 conectado: mesa → arquivos → chão.'},
 {type:'CONTEXTO',name:'Auditoria 17—B',cost:3,text:'Explica por que o código importava.',result:'Motivo validado: diferença ligada à auditoria.'},
 {type:'AMBIGUIDADE',name:'A pasta azul',cost:2,text:'Pode acusar ou inocentar a Estagiária.',result:'P12 corrige a rota: a troca da pasta foi acidental.'}
];
const perspectives=['Técnico','Caixa Veterano','Estagiária','Segurança Interno','Motorista','Cliente Desconhecido','Subgerente','Funcionário da Limpeza'];
const perspectiveImages=['assets/fragmento-tecnico.png','assets/fragmento-veterano.png','assets/fragmento-estagiaria.png','assets/fragmento-seguranca.png','assets/carro-forte-hero.png','assets/fragmento-cliente.png','assets/carro-forte-hero.png','assets/fragmento-seguranca.png'];
const pairCases=[
 {id:'D01',name:'Recibo + rua',symbol:'◷',color:'ÂMBAR',reward:'A dupla aproxima 7h47 da rua e prepara P01/P02; o relógio da farmácia ainda precisa ser corrigido por outra rota.'},
 {id:'D02',name:'Erro 17 + câmera 3',symbol:'⌁',color:'CIANO',reward:'A mensagem e a perda de imagem passam a pertencer ao mesmo minuto, sem revelar sozinhas quem coordenou.'},
 {id:'D03',name:'Chaveiro 17-B + porta reparada',symbol:'⚿',color:'VERDE-PETRÓLEO',reward:'A dupla valida capacidade específica de acesso; presença no corredor continua necessária.'},
 {id:'D04',name:'Rádio + corredor vazio',symbol:'⌁',color:'VERMELHO-LACRE',reward:'A ordem e o afastamento do Segurança passam a formar uma relação temporal verificável.'},
 {id:'D05',name:'Etiqueta + posição do malote',symbol:'◇',color:'OURO-VELHO',reward:'A dupla mostra manipulação material e posição divergente; o motivo 17-B ainda precisa de outra evidência.'},
 {id:'D06',name:'Pasta azul + padaria',symbol:'▱',color:'AZUL-PAPEL',reward:'A dupla corrige a leitura da pasta: ela liga padaria e banco, mas não prova culpa da Estagiária.'}
];
const state={screen:'intro',players:6,current:0,joined:new Set(),paired:new Set(),round:0,roundDone:new Set(),archive:[],credits:12,bought:new Set(),hypothesis:{},route:null,axis:null,final:{},reveal:0,start:Date.now()};
const screens=[...document.querySelectorAll('.screen')];
function goto(name){screens.forEach(s=>s.classList.toggle('active',s.dataset.screen===name));state.screen=name;document.getElementById('phaseLabel').textContent=({intro:'PRÓLOGO',briefing:'FASE 0',pieces:'FASE 1',investigation:'INVESTIGAÇÃO',hypothesis:'HIPÓTESE I',market:'MERCADO',mosaic:'MOSAICO',final:'DEDUÇÃO',reveal:'REVELAÇÃO',score:'PLACAR'})[name];typeScreenTerminal(name);scrollTo(0,0)}
document.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>{if(b.dataset.next==='briefing')state.players=+document.getElementById('playerCount').value;goto(b.dataset.next);if(b.dataset.next==='pieces')renderPlayers()});
document.getElementById('storyFragments').innerHTML=story.map((x,i)=>`<article class="story-fragment"><b>FRAGMENTO 0${i+1}</b><p>${x}</p></article>`).join('');
function partnerFor(i){if(state.players===2)return 1-i;return i%2===0?(i+1<state.players?i+1:i-1):i-1}
function pairCaseFor(i){return pairCases[Math.floor(i/2)%pairCases.length]}
function renderPlayers(){const tabs=document.getElementById('playerTabs');tabs.innerHTML=Array.from({length:state.players},(_,i)=>`<button class="player-tab ${i===state.current?'active':''}" data-i="${i}"><small>ARQUIVO ${String(i+1).padStart(2,'0')}</small><span>${perspectives[i%perspectives.length]}</span>${state.paired.has(i)?'<b>✓</b>':''}</button>`).join('');tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.current=+b.dataset.i;renderPlayers()});renderPiece();renderMini()}
let puzzle=null,puzzleTick=null;
function renderPiece(){document.getElementById('perspectiveName').textContent=`PERSPECTIVA DISTRIBUÍDA · ${perspectives[state.current%perspectives.length]}`;document.getElementById('pairStage')?.classList.add('hidden');const wall=document.getElementById('remittanceWall');wall.className='remittance-wall hidden';if(state.joined.has(state.current)){showRemittance();return}startPuzzle()}
function showRemittance(){const pc=pairCaseFor(state.current),wall=document.getElementById('remittanceWall');wall.className='remittance-wall';wall.innerHTML=`<div><span>REMESSA ${pc.color}</span><strong>${pc.symbol}</strong><small>${pc.name} · encontre a outra custódia desta remessa.</small></div>`;document.getElementById('puzzleStatus').textContent=state.paired.has(state.current)?'Fragmento e pareamento concluídos.':'Fragmento concluído · encontre a segunda metade.';setTimeout(()=>renderPairStage(),250)}
function renderPairStage(){const stage=document.getElementById('pairStage');if(!stage)return;stage.classList.remove('hidden');const pc=pairCaseFor(state.current),partner=partnerFor(state.current);document.getElementById('pairTitle').textContent=pc.name;document.getElementById('pairBrief').textContent=`Seu aparelho guarda apenas metade. Localize o Arquivo que completa a remessa ${pc.color}.`;const opts=document.getElementById('pairOptions');opts.innerHTML=Array.from({length:state.players},(_,i)=>i===state.current?'':`<button type="button" data-pair="${i}">Arquivo ${String(i+1).padStart(2,'0')} · ${perspectives[i%perspectives.length]}</button>`).join('');const status=document.getElementById('pairStatus'),reward=document.getElementById('pairReward');reward.classList.toggle('hidden',!state.paired.has(state.current));if(state.paired.has(state.current)){status.textContent='Segunda metade confirmada.';document.getElementById('pairRewardText').textContent=pc.reward}opts.querySelectorAll('[data-pair]').forEach(b=>b.onclick=()=>{const chosen=+b.dataset.pair;if(chosen!==partner){status.textContent='Essas bordas não pertencem à mesma remessa. Compare símbolo e cor.';return}state.paired.add(state.current);state.paired.add(partner);b.classList.add('correct');status.textContent='Encaixe confirmado entre os dois celulares.';reward.classList.remove('hidden');document.getElementById('pairRewardText').textContent=pc.reward;renderMini();setTimeout(()=>renderPlayers(),450)})}
function startPuzzle(){clearInterval(puzzleTick);const canvas=document.getElementById('puzzleCanvas'),ctx=canvas.getContext('2d'),img=new Image();const board={x:28,y:28,w:480,h:300},pw=120,ph=100;let selected=null,drag={x:0,y:0},lastTap=0,time=90,zoom=1;const pointers=new Map();let pinchStart=null;
 const ps=Array.from({length:12},(_,i)=>{const row=Math.floor(i/4),col=i%4;return{i,row,col,tx:board.x+col*pw+pw/2,ty:board.y+row*ph+ph/2,x:560+Math.random()*220,y:45+Math.random()*420,rot:[0,90,180,270][Math.floor(Math.random()*4)],snapped:false}});
 function path(){const x=-pw/2,y=-ph/2,s=14;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+pw*.38,y);ctx.bezierCurveTo(x+pw*.38,y+s,x+pw*.62,y+s,x+pw*.62,y);ctx.lineTo(x+pw,y);ctx.lineTo(x+pw,y+ph*.38);ctx.bezierCurveTo(x+pw-s,y+ph*.38,x+pw-s,y+ph*.62,x+pw,y+ph*.62);ctx.lineTo(x+pw,y+ph);ctx.lineTo(x+pw*.62,y+ph);ctx.bezierCurveTo(x+pw*.62,y+ph-s,x+pw*.38,y+ph-s,x+pw*.38,y+ph);ctx.lineTo(x,y+ph);ctx.lineTo(x,y+ph*.62);ctx.bezierCurveTo(x+s,y+ph*.62,x+s,y+ph*.38,x,y+ph*.38);ctx.closePath()}
 function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(zoom,zoom);ctx.globalAlpha=.22;ctx.drawImage(img,board.x,board.y,board.w,board.h);ctx.globalAlpha=1;ctx.strokeStyle='#d4ad68';ctx.strokeRect(board.x,board.y,board.w,board.h);for(const p of ps){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);path();ctx.save();ctx.clip();ctx.drawImage(img,-p.col*pw-pw/2,-p.row*ph-ph/2,board.w,board.h);ctx.restore();ctx.strokeStyle=p.snapped?'#9be0cf':'#d4ad68';ctx.lineWidth=(p.snapped?2.5:1.2)/zoom;ctx.stroke();ctx.restore()}ctx.restore();const zr=document.getElementById('zoomReset');if(zr)zr.textContent=`${Math.round(zoom*100)}%`}
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width/zoom,y:(e.clientY-r.top)*canvas.height/r.height/zoom}}
 function pick(q){return [...ps].reverse().find(p=>!p.snapped&&Math.abs(q.x-p.x)<pw*.58&&Math.abs(q.y-p.y)<ph*.62)}
 function setZoom(v){zoom=Math.max(1,Math.min(2.5,v