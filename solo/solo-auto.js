'use strict';
const ORDEM=['sete','cinco','apagao','nome','corpo','perceber'];
const CHAVE_ROT='mosaico_casa_ultima_partida_solo';
/* O SOLO LÊ O BANCO. NÃO REESCREVE O CASO.
   Até 02/09/2026 este arquivo tinha a própria tabela EVID com dezenove fatos e
   um SETS com a seleção por pergunta — uma SEGUNDA CÓPIA do que já está em
   ../v1/casos/casa-da-costa.json. O README desta pasta sempre disse que a
   realidade factual é única e não deve ser duplicada aqui; a tabela dizia o
   contrário. Era exatamente o arranjo que deixou o cânone antigo sobreviver
   meses dentro dos módulos sensoriais: duas listas da mesma verdade, e nada
   que obrigasse as duas a mudarem juntas.

   Agora tudo sai do banco:
     título e fato   fragmentos[F##].t e .d
     que fatos entram  selecao[pergunta].centrais
     agrupamento     relacoes[], pelas peças que cada relação exige
     inferência      o efeito daquela relação

   O ÍCONE fica aqui porque é decoração, não fato: o banco descreve a noite,
   não a tipografia. Código sem ícone cai num neutro em vez de sumir. */
const ICONE={F01:'☕',F02:'✦',F03:'▤',F04:'⌁',F05:'⌇',F06:'≈',F07:'◐',F08:'✉',F09:'§',
 F10:'⋰',F11:'▯',F12:'♨',F13:'◒',F14:'♨',F15:'⚡',F16:'⏻',F17:'▣',F18:'◇',F19:'⌁',
 F20:'▦',F21:'⋮',F22:'△',F23:'⌁',F24:'⌇',F25:'⏱',F26:'⏲',F27:'✉',F28:'§',F29:'⌂',
 F30:'▯',F31:'✉',F32:'▦',F33:'⌂',F34:'▯',F35:'§',F36:'⋰'};

function banco(){return (state.caso&&state.caso.fragmentos)||{};}
function relacoesDoCaso(){return (state.caso&&state.caso.relacoes)||[];}

/* A relação a que um fragmento pertence — a primeira que o exige entre as
   suas peças. Fragmento fora de qualquer relação fica sozinho no seu grupo,
   e a tela de relações já descarta grupo de um só. */
function relacaoDe(cod){
 return relacoesDoCaso().find(r=>(r.pecas||[]).some(g=>(Array.isArray(g)?g:[g]).includes(cod)))||null;
}
function evid(cod){
 const f=banco()[cod]; if(!f)return null;
 const r=relacaoDe(cod);
 return {title:f.t,fact:f.d,hora:f.h||'—',icon:ICONE[cod]||'◈',
   relation:r?r.id:('so-'+cod), inference:r?r.efeito:'um fato isolado não sustenta leitura'};
}
/* Os fatos de uma pergunta partem das CENTRAIS da seleção — as que o banco
   declara indispensáveis para aquela pergunta fechar.

   Mas centrais sozinhas não bastam AQUI, e isso é próprio do solo: o fluxo é
   fato → RELAÇÃO → inferência, e uma relação só aparece quando duas ou mais
   das suas peças estão em mão (relationGroups descarta grupo de um). Medido:
   as oito centrais de "sete" pertencem a oito relações diferentes, então a
   tela de relações abria VAZIA — o miolo do modo desaparecia sem erro nenhum.

   Então o conjunto fecha o que abre: para cada relação que uma central toca,
   entram as peças que faltam dela. `pecas` é uma lista de GRUPOS de
   alternativas — basta um código de cada grupo. */
function conjunto(k){
 const sel=(state.caso&&state.caso.selecao&&state.caso.selecao[k])||null;
 const B=banco(); const centrais=(sel&&sel.centrais||[]).filter(c=>B[c]);
 const tem={}, dentro=[];
 const por=c=>{if(c&&B[c]&&!tem[c]){tem[c]=1;dentro.push(c)}};

 /* AS RELAÇÕES VÊM PRIMEIRO, e não as centrais. O fluxo do solo é
    fato → RELAÇÃO → inferência, e relação só aparece com duas peças em mão
    (relationGroups descarta grupo de um). Medido: as oito centrais de "sete"
    pertencem a oito relações diferentes — servindo as centrais primeiro, ou a
    tela de relações abria vazia, ou o conjunto ia a vinte fragmentos, que são
    vinte quebra-cabeças numa sessão de uma pessoa.
    Então: escolhe as relações que a pergunta mais apoia, completa cada uma, e
    só depois enche o que sobrar com as centrais que ficaram de fora. */
 const TETO=10;
 const cand=relacoesDoCaso().map(r=>{
  const grupos=(r.pecas||[]).map(g=>(Array.isArray(g)?g:[g]).filter(x=>B[x])).filter(g=>g.length);
  const apoio=grupos.filter(g=>g.some(x=>centrais.indexOf(x)>=0)).length;
  return {grupos:grupos,apoio:apoio,custo:grupos.length};
 }).filter(r=>r.grupos.length>=2&&r.apoio>0);
 cand.sort((a,b)=>b.apoio-a.apoio||a.custo-b.custo);
 cand.forEach(r=>{
  if(dentro.length+r.custo>TETO)return;
  r.grupos.forEach(g=>{
   const central=g.find(x=>centrais.indexOf(x)>=0);
   por(central||g[0]);
  });
 });
 /* o que sobrou de central entra se couber: a pergunta pediu esses fatos */
 centrais.forEach(c=>{ if(dentro.length<TETO) por(c); });
 return dentro;
}

const state={phase:'home',caso:null,key:null,i:0,order:[0,1,2,3],pick:null,seen:[],facts:{},answers:{},scoreFacts:0};
const app=document.getElementById('app');
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function valida(k){return !!(state.caso&&state.caso.partidas&&state.caso.partidas[k]&&conjunto(k).length);}
function proxima(){let u='';try{u=localStorage.getItem(CHAVE_ROT)||''}catch(e){}let i=ORDEM.indexOf(u);for(let n=1;n<=ORDEM.length;n++){let k=ORDEM[(i+n+ORDEM.length)%ORDEM.length];if(valida(k))return k}return state.caso.perguntaPadrao||'sete';}
function marcarUsada(){try{localStorage.setItem(CHAVE_ROT,state.key)}catch(e){}}
function header(){return '<div class="shell"><div class="top"><div class="brand">MOSAICO · MODO SOLO</div><div class="badge">A Casa da Costa · 1867</div></div>';}
async function load(){try{const r=await fetch('../v1/casos/casa-da-costa.json?v=20260902-banco');if(!r.ok)throw Error();state.caso=await r.json();state.key=proxima();}catch(e){app.innerHTML=header()+'<div class="hero"><span class="k">Falha de carregamento</span><h2>O caso não pôde ser aberto.</h2><p class="muted">Recarregue a página quando a conexão estiver disponível.</p></div></div>';return;}render();}
function render(){if(!state.caso)return;let h=header();if(state.phase==='home')h+=home();if(state.phase==='puzzle')h+=puzzle();if(state.phase==='fact')h+=fact();if(state.phase==='relations')h+=relations();if(state.phase==='map')h+=map();if(state.phase==='decision')h+=decision();if(state.phase==='result')h+=result();app.innerHTML=h+'</div>';}
function home(){let p=state.caso.partidas[state.key];return '<section class="hero"><span class="k">Uma verdade · uma nova pergunta</span><h1>A verdade é um fragmento.</h1><p class="lead">Reconstrua sozinho as evidências da Casa da Costa. O MOSAICO escolheu automaticamente o problema desta execução.</p><div class="question"><b>'+esc(p.natureza)+' · pergunta-mãe</b><p>'+esc(p.pergunta)+'</p></div><button class="btn" onclick="start()">Começar reconstrução</button><p class="muted small" style="margin-top:16px">Ao concluir, a próxima execução avançará automaticamente para outra pergunta da mesma realidade.</p></section>';}
function start(){marcarUsada();state.i=0;state.seen=[];state.facts={};state.answers={};state.scoreFacts=0;state.phase='puzzle';newPuzzle();render();}
function currentId(){return conjunto(state.key)[state.i];}
function newPuzzle(){state.order=shuffle([0,1,2,3]);if(state.order.every((v,i)=>v===i))[state.order[0],state.order[1]]=[state.order[1],state.order[0]];state.pick=null;}
function puzzle(){let id=currentId(),e=evid(id),p=state.caso.partidas[state.key],pct=Math.round(state.i/conjunto(state.key).length*100);let pieces=state.order.map((n,i)=>'<button class="piece '+(state.pick===i?'sel ':'')+(n===i?'ok':'')+'" data-mark="'+esc(e.icon)+'" onclick="tap('+i+')"><span style="position:absolute;left:7px;top:5px;font-size:10px;opacity:.6">'+(n+1)+'</span></button>').join('');return '<div class="stage"><div><span class="k">'+esc(p.titulo)+'</span><h2>Evidência '+(state.i+1)+' de '+conjunto(state.key).length+'</h2></div><div class="badge">'+pct+'%</div></div><div class="progress"><i style="width:'+pct+'%"></i></div><div class="evidence"><div class="meta"><span>Arquivo fragmentado</span><span>'+esc(e.hora||'—')+'</span></div><h3>'+esc(e.title)+'</h3><div class="puzzle">'+pieces+'</div><p class="muted" style="color:#59452e">Toque em duas peças para trocar suas posições.</p></div>';}
function tap(i){if(state.pick===null){state.pick=i;render();return;}if(state.pick===i){state.pick=null;render();return;}let a=state.pick;[state.order[a],state.order[i]]=[state.order[i],state.order[a]];state.pick=null;if(state.order.every((v,n)=>v===n))state.phase='fact';render();}
function factOptions(e){return shuffle([e.fact,'Esse fato sozinho identifica quem estava na casa.','Esse fato prova que houve crime.','Esse fato já explica toda a noite.']);}
function fact(){let id=currentId(),e=evid(id);if(!state.facts[id])state.facts[id]={opts:factOptions(e),chosen:null};let f=state.facts[id];let opts=f.opts.map((o,i)=>'<button class="opt '+(f.chosen===i?(o===e.fact?'good':'bad'):'')+'" onclick="chooseFact('+i+')">'+esc(o)+'</button>').join('');return '<span class="k">FATO</span><h2>O que esta evidência permite afirmar diretamente?</h2><div class="factbox"><b>'+esc(e.title)+'</b><span>Evite transformar pista em conclusão.</span></div><div class="opts">'+opts+'</div>'+(f.chosen!==null?'<button class="btn" onclick="nextEvidence()">'+(state.i<conjunto(state.key).length-1?'Próxima evidência':'Relacionar fatos')+'</button>':'');}
function chooseFact(i){let id=currentId(),e=evid(id),f=state.facts[id];if(f.chosen!==null)return;f.chosen=i;if(f.opts[i]===e.fact)state.scoreFacts++;render();}
function nextEvidence(){let id=currentId();if(!state.seen.includes(id))state.seen.push(id);if(state.i<conjunto(state.key).length-1){state.i++;newPuzzle();state.phase='puzzle';}else state.phase='relations';render();}
/* Um fragmento pode servir a MAIS DE UMA relação. O agrupamento antigo
   perguntava a cada fragmento "de que relação você é?" e ficava com a primeira,
   então a peça compartilhada nunca contava para a segunda — em "nome", R10 tinha
   duas peças em mão e mesmo assim não aparecia. Agora a pergunta é feita ao
   contrário: para cada relação do banco, quais peças dela estão em mão. */
function relationGroups(){
 const dentro={}; conjunto(state.key).forEach(c=>dentro[c]=1);
 return relacoesDoCaso().map(r=>{
  const pecas=(r.pecas||[]).map(g=>(Array.isArray(g)?g:[g]).find(x=>dentro[x])).filter(Boolean);
  return [r,pecas];
 }).filter(x=>x[1].length>1);
}
function relations(){let groups=relationGroups();let html=groups.map(([r,ids],idx)=>'<div class="relation"><span class="k">RELAÇÃO '+(idx+1)+'</span><h3>'+ids.map(id=>esc(evid(id).title)).join(' + ')+'</h3><div class="tags">'+ids.map(id=>'<span class="tag">'+esc(evid(id).fact.split('.')[0])+'</span>').join('')+'</div><p class="muted">Juntos, esses fatos sustentam: <b style="color:var(--gold2)">'+esc(String(r.efeito||'').replace(/.s*$/,''))+'</b>.</p></div>').join('');return '<span class="k">FATO → RELAÇÃO → INFERÊNCIA</span><h2>Agora os fragmentos começam a conversar.</h2><p class="lead">Uma pista isolada é fraca. A relação entre fatos é o que torna a inferência auditável.</p>'+html+'<button class="btn" onclick="state.phase=\'map\';render()">Abrir a planta de 1867</button>';}
function map(){let p=state.caso.partidas[state.key];return '<span class="k">MAPA DA CASA</span><h2>Onde os fatos se encontram?</h2><p class="lead">Use a planta como síntese espacial. Não procure um culpado: procure onde a pergunta começa a fechar.</p><div class="map"><img src="../v1/img/casa-da-costa-planta-1867.svg" alt="Planta esquemática da Casa da Costa, construção de 1867"><div class="mapnote"><b>'+esc(p.titulo)+'</b><br>'+esc(p.pergunta)+'</div></div><button class="btn" onclick="state.phase=\'decision\';render()">Responder à pergunta</button>';}
function decision(){let p=state.caso.partidas[state.key];let fields=p.campos.map(f=>'<div class="field"><label>'+esc(f.rotulo)+'</label><select id="f-'+esc(f.id)+'"><option value="">Escolha…</option>'+f.opcoes.map(o=>'<option>'+esc(o)+'</option>').join('')+'</select></div>').join('');return '<span class="k">INFERÊNCIA → DECISÃO</span><h2>'+esc(p.pergunta)+'</h2><p class="lead">Preencha os campos derivados desta pergunta. Depois do envio, a resposta será comparada à realidade canônica.</p><div class="fields">'+fields+'</div><button class="btn red" onclick="finish()">Fechar minha conclusão</button><button class="btn ghost" onclick="state.phase=\'relations\';render()">Rever relações</button>';}
function finish(){let p=state.caso.partidas[state.key],all=true,correct=0;state.answers={};p.campos.forEach(f=>{let el=document.getElementById('f-'+f.id),v=el?el.value:'';if(!v)all=false;state.answers[f.id]=v;if(v===f.resposta)correct++});if(!all){alert('Preencha todos os campos antes de fechar a conclusão.');return;}state.correct=correct;state.phase='result';render();}
function result(){let p=state.caso.partidas[state.key],total=p.campos.length,fieldPct=Math.round(100*state.correct/total),factPct=Math.round(100*state.scoreFacts/conjunto(state.key).length),score=Math.round(fieldPct*.7+factPct*.3);let rows=p.campos.map(f=>'<div class="relation"><span class="k">'+esc(f.rotulo)+'</span><p style="margin:.35rem 0"><b>Sua resposta:</b> '+esc(state.answers[f.id])+'</p><p class="muted" style="margin:0"><b>Canônica:</b> '+esc(f.resposta)+'</p></div>').join('');return '<span class="k">REVELAÇÃO</span><h2>'+esc(p.titulo)+'</h2><div class="result"><div class="score">'+score+'</div><p class="muted">Índice desta execução · 30% leitura factual + 70% decisão</p><p class="lead">'+esc(p.revelacao)+'</p></div>'+rows+'<div class="factbox"><b>Realidade canônica</b><span>'+esc(state.caso.realidadeCanonica.sintese)+'</span></div><button class="btn" onclick="nextRun()">Nova partida</button>';}
function nextRun(){state.key=proxima();state.phase='home';state.i=0;state.seen=[];state.facts={};state.answers={};state.scoreFacts=0;render();}
load();