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

const state={phase:'home',caso:null,key:null,i:0,order:[0,1,2,3],pick:null,seen:[],facts:{},answers:{},scoreFacts:0,
  percursoPronto:false,percursoResultado:null,percursoEtapa:'janela',atividades:[],atividadeI:0,sensorPronto:false,sensorTempos:[],mosaico:[],mosaicoPick:null,mercadoEtapa:0,mercadoEscolhas:[],pontuacao:null,resultadoVista:'apuracao',apuracaoEtapa:0,apuracaoTimer:null};
const app=document.getElementById('app');
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function valida(k){return !!(state.caso&&state.caso.partidas&&state.caso.partidas[k]&&conjunto(k).length);}
function proxima(){let u='';try{u=localStorage.getItem(CHAVE_ROT)||''}catch(e){}let i=ORDEM.indexOf(u);for(let n=1;n<=ORDEM.length;n++){let k=ORDEM[(i+n+ORDEM.length)%ORDEM.length];if(valida(k))return k}return state.caso.perguntaPadrao||'sete';}
function marcarUsada(){try{localStorage.setItem(CHAVE_ROT,state.key)}catch(e){}}
function header(){
  var chip='';
  try{
    if(window.MosaicoPapelCamada){
      window.MosaicoPapelCamada.injetarCss();
      chip=window.MosaicoPapelCamada.chipHtml('casa-da-costa');
    }
  }catch(e){}
  return '<div class="shell"><div class="top"><div class="brand">MOSAICO · MODO SOLO</div><div class="badge">A Casa da Costa · 1867</div>'+chip+'</div>';
}
async function load(){try{const r=await fetch('../v1/casos/casa-da-costa.json?v=20260902-banco');if(!r.ok)throw Error();state.caso=await r.json();state.key=proxima();}catch(e){app.innerHTML=header()+'<div class="hero pf-card"><span class="k">Falha de carregamento</span><h2>O caso não pôde ser aberto.</h2><p class="muted">Recarregue a página quando a conexão estiver disponível.</p></div></div>';return;}render();}
/* A pilula de conta (#mosaico-account, de firebase-user.js) e position:fixed
   no canto superior direito, com z-index 99990. O cabecalho do Solo poe a
   badge do caso e os chips de papel/camada exatamente ali: medido a 375px,
   ela cobria a badge de x=154 a 177 e a metade de cima dos chips.
   O cabecalho passa a comecar ABAIXO dela. A altura e medida, nao chutada:
   ela cresce quando o e-mail da conta e longo. */
function medirPilulaDaConta(){
  var aplicar=function(){
    /* offsetParent e SEMPRE null num elemento position:fixed — nao serve para
       saber se ele esta na tela. Vale o retangulo e o display. */
    var c=document.getElementById('mosaico-account');
    var r=c&&getComputedStyle(c).display!=='none'?c.getBoundingClientRect():null;
    var alto=r&&r.height?Math.ceil(r.bottom+8):0;
    document.documentElement.style.setProperty('--solo-conta',alto+'px');
  };
  aplicar();
  if(window.ResizeObserver)try{new ResizeObserver(aplicar).observe(document.body)}catch(_){ }
  new MutationObserver(aplicar).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden']});
  window.addEventListener('resize',aplicar);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',medirPilulaDaConta,{once:true});else medirPilulaDaConta();
function render(){if(!state.caso)return;let h=header();if(state.phase==='home')h+=home();if(state.phase==='briefing')h+=briefing();if(state.phase==='percurso3d')h+=percurso3d();if(state.phase==='sensor')h+=sensor();if(state.phase==='puzzle')h+=puzzle();if(state.phase==='fact')h+=fact();if(state.phase==='mosaico')h+=mosaico();if(state.phase==='mercado')h+=mercado();if(state.phase==='relations')h+=relations();if(state.phase==='map')h+=map();if(state.phase==='decision')h+=decision();if(state.phase==='result')h+=result();
  try{
    /* O andaime de hipóteses pertence à análise/dedução. Na Mesa ele só
       aparece depois da coleta; no Solo deve obedecer à mesma sequência. */
    var fasesComHipoteses=['relations','map','decision'];
    if(window.MosaicoPapelCamada && fasesComHipoteses.indexOf(state.phase)>=0){
      var e=window.MosaicoPapelCamada.carregar('casa-da-costa');
      if(e.camada!=='livre') h+=window.MosaicoPapelCamada.htmlAndaime('casa-da-costa',e,{partidaId:state.key,state:{selecionados:state.answers||{}}});
    }
  }catch(err){}
  app.innerHTML=h+'</div>';
  try{ if(window.MosaicoPapelCamada) window.MosaicoPapelCamada.ligarAndaime(app,'casa-da-costa',null,{partidaId:state.key,state:{selecionados:state.answers||{}}}); }catch(err){}
  if(state.phase==='result'&&state.resultadoVista==='apuracao')agendarApuracao();
}
function home(){let p=state.caso.partidas[state.key];return '<section class="hero pf-card"><span class="k">Uma verdade · uma nova pergunta</span><h1>A verdade é um fragmento.</h1><p class="lead">Reconstrua sozinho as evidências da Casa da Costa. O MOSAICO escolheu automaticamente o problema desta execução.</p><div class="question pf-inset"><b>'+esc(p.natureza)+' · pergunta-mãe</b><p>'+esc(p.pergunta)+'</p></div><button class="btn pf-btn-gold" onclick="start()">Começar reconstrução</button><p class="muted small" style="margin-top:16px">Ao concluir, a próxima execução avançará automaticamente para outra pergunta da mesma realidade.</p></section>';}
function parAtividades(){
 return ['salaEscura'];
}
const ATIVIDADE={
 janela:{titulo:'A Janela do Norte',arquivo:'../v1/MOSAICO-26-a-janela-do-norte.html?embed=1'},
 vidro:{titulo:'O Vidro Embaçado',arquivo:'../v1/MOSAICO-26-vidro-embacado.html?embed=1'},
 salaEscura:{titulo:'A Sala às Escuras',arquivo:'../v1/MOSAICO-26-a-sala-as-escuras.html?embed=1'}
};
function briefing(){let p=state.caso.partidas[state.key];return '<span class="k">ENCENAÇÃO · PREPARAÇÃO</span><h2>A casa distribui os papéis.</h2><p class="lead">Você fará todas as tarefas da experiência. O sistema alternará a perspectiva cognitiva e assumirá somente as ações que dependeriam de outras pessoas.</p><div class="role-grid"><div class="relation pf-inset"><b>Você investiga</b><p class="muted">Observa, executa as atividades, organiza fatos e decide.</p></div><div class="relation pf-inset"><b>O sistema contrapõe</b><p class="muted">Distribui arquivos, oferece alternativas no Mercado e testa sua interpretação.</p></div></div><div class="question pf-inset"><b>'+esc(p.natureza)+'</b><p>'+esc(p.pergunta)+'</p></div><button class="btn" onclick="abrirPercurso3D()">Entrar na casa</button>';}
function abrirPercurso3D(){try{sessionStorage.removeItem('ac:solo-integral:v1')}catch(_){ }state.percursoPronto=false;state.percursoResultado=null;state.percursoEtapa='janela';state.phase='percurso3d';render();}
/* As etapas 3D e sensoriais são páginas de tela inteira (topbar, painéis e
   botões em position:fixed). Dentro de uma caixa de ~343×585 no meio da página
   elas se sobrepunham no iPhone. Agora ocupam o aparelho inteiro, como na Mesa,
   com uma barra mínima dizendo em que etapa do Solo o jogador está.

   A barra CARREGA a saída, em vez de escondê-la. É o mesmo desenho da Mesa:
   lá a `barra-jogo` fica POR CIMA da tarefa justamente para o jogador nunca
   ficar preso dentro do módulo. Uma janela que cobre a tela inteira e não
   fecha só sai recarregando a página — e recarregar perde a partida. */
function imersivo(rotulo,iframe){
  var cheia=state.telaCheia!==false;
  return '<div class="solo-imersivo'+(cheia?'':' encolhido')+'" role="region" aria-label="'+esc(rotulo)+'">'+
    '<div class="solo-imersivo-barra"><span>MOSAICO · Solo</span><b>'+esc(rotulo)+'</b>'+
    '<button type="button" class="solo-imersivo-sair" onclick="alternarTelaCheia(this)" '+
      'aria-pressed="'+(cheia?'true':'false')+'">'+(cheia?'⤡ Sair da tela cheia':'⤢ Tela cheia')+'</button>'+
    '</div><div class="solo-imersivo-quadro">'+iframe+'</div></div>';
}
/* Alterna SEM passar por render(): recriar o HTML recarregaria o iframe e o
   jogador perderia o que ja fez dentro da etapa. */
function alternarTelaCheia(btn){
  var caixa=btn.closest('.solo-imersivo');if(!caixa)return;
  var cheia=caixa.classList.toggle('encolhido')===false;
  state.telaCheia=cheia;
  btn.textContent=cheia?'⤡ Sair da tela cheia':'⤢ Tela cheia';
  btn.setAttribute('aria-pressed',cheia?'true':'false');
  /* Ao sair, mostrar a PAGINA — cabecalho, texto da etapa e o botao de
     continuar —, nao o mesmo quadro de novo no topo da tela. */
  if(!cheia)window.scrollTo({top:0});
}
function percurso3d(){const e=state.percursoEtapa,scene=e==='janela'?imersivo('1 / 4 · Chegada pela estrada','<iframe id="solo-percurso" title="A Janela do Norte" src="../v1/MOSAICO-26-a-janela-do-norte.html?embed=1" allow="camera; accelerometer; gyroscope; magnetometer"></iframe>'):imersivo('3 / 4 · Sob outra luz','<iframe id="solo-percurso" title="Escrivaninha da Casa da Costa" src="../v1/AC-escrivaninha.html?demo=solo" allow="camera; xr-spatial-tracking; accelerometer; gyroscope; magnetometer; fullscreen" allowfullscreen></iframe>'),texto=e==='janela'?'Chegue pela estrada e aponte a Janela do Norte para entrar na casa.':'Na escrivaninha, siga até o registro: a maquete abre na sequência para fechar a etapa final do percurso.',quadro=state.percursoPronto?'<div class="result pf-inset"><div class="score">'+esc((state.percursoResultado&&state.percursoResultado.score)||0)+'</div><p class="lead">Janela do Norte, Sala às Escuras, escrivaninha e maquete foram concluídas.</p></div>':scene;return '<span class="k">PERCURSO 3D E RA · '+(e==='janela'?'CHEGADA':'ESCRIVANINHA')+'</span><h2>Da estrada à maquete.</h2><p class="lead">'+texto+'</p>'+quadro+'<button class="btn ghost" onclick="state.i=0;state.phase=\'puzzle\';newPuzzle();render()" '+(state.percursoPronto?'':'disabled')+'>'+(state.percursoPronto?'Passagem revelada · continuar':'Conclua a etapa atual')+'</button>';}
function abrirAtividades(){state.atividades=parAtividades();state.atividadeI=0;state.sensorPronto=false;state.phase='sensor';render();}
function sensor(){let id=state.atividades[state.atividadeI],a=ATIVIDADE[id];return '<span class="k">ATIVIDADE SENSORIAL 2 DE 4</span><h2>'+esc(a.titulo)+'</h2><p class="lead">Conclua esta etapa para seguir para a escrivaninha.</p>'+(state.sensorPronto?'<div class="result pf-inset"><p class="lead">Atividade concluída. A próxima etapa foi liberada.</p></div>':imersivo('2 / 4 · '+a.titulo,'<iframe id="solo-sensor" title="'+esc(a.titulo)+'" src="'+esc(a.arquivo)+'" allow="camera; xr-spatial-tracking; accelerometer; gyroscope; magnetometer"></iframe>'))+'<button class="btn ghost" onclick="confirmarSensor()" '+(state.sensorPronto?'':'disabled')+'>'+(state.sensorPronto?'Atividade concluída · continuar':'Conclua a tarefa no quadro')+'</button>';
}
function confirmarSensor(){if(!state.sensorPronto)return;if(state.atividadeI<state.atividades.length-1){state.atividadeI++;state.sensorPronto=false;render();return;}if(state.percursoEtapa==='janela'){state.percursoEtapa='escrivaninha';state.sensorPronto=false;state.phase='percurso3d';render();return;}state.i=0;state.phase='puzzle';newPuzzle();render();}
window.addEventListener('message',function(ev){if(ev.origin!==location.origin||!ev.data||ev.data.mosaico!=='tarefa-ok'||state.phase!=='sensor')return;state.sensorPronto=true;state.sensorTempos[state.atividadeI]=Math.max(0,Number(ev.data.tempoMs)||0);render();});
window.addEventListener('message',function(ev){
 if(ev.origin!==location.origin||!ev.data||state.phase!=='percurso3d')return;
 if(ev.data.mosaico==='tarefa-ok'&&state.percursoEtapa==='janela'){
  try{const key='ac:solo-integral:v1',saved=JSON.parse(sessionStorage.getItem(key)||'{}');sessionStorage.setItem(key,JSON.stringify({...saved,version:1,stage:'posicionar',started:saved.started||Date.now(),janelaConcluida:true,maquete:null,keyMotion:null}));}catch(_){}
  abrirAtividades();return;
 }
 if((ev.data.mosaico==='ac-solo-maquete-completa'||ev.data.mosaico==='ac-solo-completo')&&state.percursoEtapa==='escrivaninha'){state.percursoPronto=true;state.percursoResultado={score:Number(ev.data.score)||0,evidence:Array.isArray(ev.data.evidence)?ev.data.evidence:[]};render();}
});
function start(){
  function go(){
    if(state.apuracaoTimer){clearTimeout(state.apuracaoTimer);state.apuracaoTimer=null;}
    marcarUsada();state.i=0;state.seen=[];state.facts={};state.answers={};state.scoreFacts=0;
    state.percursoPronto=false;state.percursoResultado=null;state.percursoEtapa='janela';state.atividades=[];state.atividadeI=0;state.sensorPronto=false;state.sensorTempos=[];state.mosaico=[];state.mosaicoPick=null;state.mercadoEtapa=0;state.mercadoEscolhas=[];state.pontuacao=null;state.resultadoVista='apuracao';state.apuracaoEtapa=0;
    state.phase='briefing';render();
    try{
      if(window.MosaicoPapelCamada){
        var e=window.MosaicoPapelCamada.carregar('casa-da-costa');
        if(e.camada!=='livre' && !document.querySelector('[data-mpc-andaime]')){
          var shell=document.querySelector('.shell');
          if(shell){
            shell.insertAdjacentHTML('beforeend', window.MosaicoPapelCamada.htmlAndaime('casa-da-costa',e,{partidaId:state.key,state:{selecionados:state.answers||{}}}));
            window.MosaicoPapelCamada.ligarAndaime(shell,'casa-da-costa',e,{partidaId:state.key,state:{selecionados:state.answers||{}}});
          }
        }
      }
    }catch(err){}
  }
  if(window.MosaicoPapelCamada && !state._papelOk){
    window.MosaicoPapelCamada.mostrarSeletor({caso:'casa-da-costa'}).then(function(){state._papelOk=true;go();});
    return;
  }
  go();
}
function currentId(){return conjunto(state.key)[state.i];}
function newPuzzle(){state.order=shuffle([0,1,2,3]);if(state.order.every((v,i)=>v===i))[state.order[0],state.order[1]]=[state.order[1],state.order[0]];state.pick=null;}
function puzzle(){let id=currentId(),e=evid(id),p=state.caso.partidas[state.key],pct=Math.round(state.i/conjunto(state.key).length*100);let pieces=state.order.map((n,i)=>'<button class="piece '+(state.pick===i?'sel ':'')+(n===i?'ok':'')+'" data-mark="'+esc(e.icon)+'" onclick="tap('+i+')"><span style="position:absolute;left:7px;top:5px;font-size:10px;opacity:.6">'+(n+1)+'</span></button>').join('');return '<div class="stage"><div><span class="k">'+esc(p.titulo)+'</span><h2>Evidência '+(state.i+1)+' de '+conjunto(state.key).length+'</h2></div><div class="badge">'+pct+'%</div></div><div class="progress"><i style="width:'+pct+'%"></i></div><div class="evidence"><div class="meta"><span>Arquivo fragmentado</span><span>'+esc(e.hora||'—')+'</span></div><h3>'+esc(e.title)+'</h3><div class="puzzle">'+pieces+'</div><p class="muted" style="color:#59452e">Toque em duas peças para trocar suas posições.</p></div>';}
function tap(i){if(state.pick===null){state.pick=i;render();return;}if(state.pick===i){state.pick=null;render();return;}let a=state.pick;[state.order[a],state.order[i]]=[state.order[i],state.order[a]];state.pick=null;if(state.order.every((v,n)=>v===n))state.phase='fact';render();}
function factOptions(e){return shuffle([e.fact,'Esse fato sozinho identifica quem estava na casa.','Esse fato prova que houve crime.','Esse fato já explica toda a noite.']);}
function fact(){let id=currentId(),e=evid(id);if(!state.facts[id])state.facts[id]={opts:factOptions(e),chosen:null};let f=state.facts[id];let opts=f.opts.map((o,i)=>'<button class="opt pf-cell '+(f.chosen===i?(o===e.fact?'good':'bad'):'')+'" onclick="chooseFact('+i+')">'+esc(o)+'</button>').join('');return '<span class="k">FATO</span><h2>O que esta evidência permite afirmar diretamente?</h2><div class="factbox pf-inset"><b>'+esc(e.title)+'</b><span>Evite transformar pista em conclusão.</span></div><div class="opts pf-inset">'+opts+'</div>'+(f.chosen!==null?'<button class="btn" onclick="nextEvidence()">'+(state.i<conjunto(state.key).length-1?'Próxima evidência':'Abrir o Mosaico')+'</button>':'');}
function chooseFact(i){let id=currentId(),e=evid(id),f=state.facts[id];if(f.chosen!==null)return;f.chosen=i;if(f.opts[i]===e.fact)state.scoreFacts++;render();}
function nextEvidence(){let id=currentId();if(!state.seen.includes(id))state.seen.push(id);if(state.i<conjunto(state.key).length-1){state.i++;newPuzzle();state.phase='puzzle';}else{prepararMosaico();state.phase='mosaico';}render();}

function itensMosaico(){
 const ids=(state.caso.mosaico&&state.caso.mosaico.ordemCorreta)||[];
 return ids.map(id=>({id:id,rot:(state.caso.mosaico.rotulos||{})[id]||id,dica:(state.caso.mosaico.dicas||{})[id]||''}));
}
function prepararMosaico(){state.mosaico=shuffle(itensMosaico());if(state.mosaico.every((x,i)=>x.id===itensMosaico()[i].id))state.mosaico.reverse();state.mosaicoPick=null;}
function mosaico(){
 let certo=itensMosaico(),ok=state.mosaico.length&&state.mosaico.every((x,i)=>x.id===certo[i].id);
 let linhas=state.mosaico.map((x,i)=>'<button class="mosaico-item '+(state.mosaicoPick===i?'sel':'')+'" onclick="tocarMosaico('+i+')"><span>'+(i+1)+'</span><b>'+esc(x.rot)+'</b><small>'+esc(x.dica)+'</small></button>').join('');
 return '<span class="k">MOSAICO · RECONSTRUÇÃO INDIVIDUAL</span><h2>Coloque a noite em ordem.</h2><p class="lead">Organize individualmente os acontecimentos revelados. Toque em dois para trocar suas posições.</p><div class="mosaico-lista">'+linhas+'</div>'+(ok?'<div class="factbox pf-inset"><b>Linha factual validada</b><span>A sequência está coerente. Agora você pode acessar o Mercado de pistas.</span></div><button class="btn" onclick="state.phase=\'mercado\';render()">Entrar no Mercado</button>':'<p class="muted">A etapa só avança quando todos os acontecimentos estiverem na ordem factual.</p>');
}
function tocarMosaico(i){if(state.mosaicoPick===null){state.mosaicoPick=i;render();return;}if(state.mosaicoPick===i){state.mosaicoPick=null;render();return;}let a=state.mosaicoPick;[state.mosaico[a],state.mosaico[i]]=[state.mosaico[i],state.mosaico[a]];state.mosaicoPick=null;render();}
function ofertaMercado(){return conjunto(state.key).slice(0,3).map(evid).filter(Boolean);}
function mercado(){
 let etapa=state.mercadoEtapa,ofertas=ofertaMercado();
 if(etapa===0)return '<span class="k">MERCADO DE PISTAS · AÇÃO 1 DE 3</span><h2>Adquirir uma pista lacrada.</h2><p class="lead">Três arquivos lacrados estão disponíveis. Escolha um para aprofundar sua investigação.</p><div class="mercado-grid">'+ofertas.map((e,i)=>'<button class="mkt-card" onclick="acaoMercado(\'adquirir\','+i+')"><b>Arquivo lacrado '+(i+1)+'</b><span>'+esc(e.hora)+'</span></button>').join('')+'</div>';
 if(etapa===1)return '<span class="k">MERCADO DE PISTAS · AÇÃO 2 DE 3</span><h2>Avaliar a confiança.</h2><p class="lead">Avalie individualmente se a pista é central ou secundária para sua linha de investigação.</p><div class="opts pf-inset"><button class="opt" onclick="acaoMercado(\'manter\')">Manter: ela parece central</button><button class="opt" onclick="acaoMercado(\'consignar\')">Consignar: ela parece secundária</button></div>';
 if(etapa===2)return '<span class="k">MERCADO DE PISTAS · AÇÃO 3 DE 3</span><h2>Comprar informação ou preservar recursos?</h2><p class="lead">Faça uma revisão crítica antes de decidir, sem acesso à resposta canônica.</p><div class="relation pf-inset"><b>Revisão crítica</b><p class="muted">“Os fatos explicam presença, mas ainda não necessariamente entrada ou culpa.”</p></div><div class="opts pf-inset"><button class="opt" onclick="acaoMercado(\'comprar contraponto\')">Comprar o contraponto</button><button class="opt" onclick="acaoMercado(\'preservar recursos\')">Preservar os recursos</button></div>';
 return '<span class="k">MERCADO ENCERRADO</span><h2>Suas decisões foram registradas.</h2><div class="relation pf-inset">'+state.mercadoEscolhas.map(x=>'<p>• '+esc(x)+'</p>').join('')+'</div><button class="btn" onclick="state.phase=\'relations\';render()">Relacionar os fatos</button>';
}
function acaoMercado(tipo,i){let txt=tipo;if(tipo==='adquirir'){let e=ofertaMercado()[i];txt='Adquiriu: '+(e?e.title:'arquivo')}state.mercadoEscolhas.push(txt);state.mercadoEtapa++;render();}
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
function relations(){let groups=relationGroups();let html=groups.map(([r,ids],idx)=>'<div class="relation pf-inset"><span class="k">RELAÇÃO '+(idx+1)+'</span><h3>'+ids.map(id=>esc(evid(id).title)).join(' + ')+'</h3><div class="tags">'+ids.map(id=>'<span class="tag">'+esc(evid(id).fact.split('.')[0])+'</span>').join('')+'</div><p class="muted">Juntos, esses fatos sustentam: <b style="color:var(--gold2)">'+esc(String(r.efeito||'').replace(/.s*$/,''))+'</b>.</p></div>').join('');return '<span class="k">FATO → RELAÇÃO → INFERÊNCIA</span><h2>Agora os fragmentos começam a conversar.</h2><p class="lead">Uma pista isolada é fraca. A relação entre fatos é o que torna a inferência auditável.</p>'+html+'<button class="btn" onclick="state.phase=\'map\';render()">Abrir a planta de 1867</button>';}
function map(){let p=state.caso.partidas[state.key];return '<span class="k">MAPA DA CASA</span><h2>Onde os fatos se encontram?</h2><p class="lead">Use a planta como síntese espacial. Não procure um culpado: procure onde a pergunta começa a fechar.</p><div class="map pf-inset"><img src="../v1/img/casa-da-costa-planta-1867.svg" alt="Planta esquemática da Casa da Costa, construção de 1867"><div class="mapnote"><b>'+esc(p.titulo)+'</b><br>'+esc(p.pergunta)+'</div></div><button class="btn" onclick="state.phase=\'decision\';render()">Responder à pergunta</button>';}
function decision(){let p=state.caso.partidas[state.key];let fields=p.campos.map(f=>'<div class="field pf-inset"><label>'+esc(f.rotulo)+'</label><select id="f-'+esc(f.id)+'"><option value="">Escolha…</option>'+f.opcoes.map(o=>'<option>'+esc(o)+'</option>').join('')+'</select></div>').join('');return '<span class="k">INFERÊNCIA → DECISÃO</span><h2>'+esc(p.pergunta)+'</h2><p class="lead">Preencha os campos derivados desta pergunta. Depois do envio, a resposta será comparada à realidade canônica.</p><div class="fields">'+fields+'</div><button class="btn red" onclick="finish()">Fechar minha conclusão</button><button class="btn ghost" onclick="state.phase=\'relations\';render()">Rever relações</button>';}
function finish(){
  try{
    if(window.MosaicoPapelCamada&&window.MosaicoHipotesesCamada){
      const e=window.MosaicoPapelCamada.carregar('casa-da-costa');
      const sc=window.MosaicoHipotesesCamada.carregarScaffold('casa-da-costa',{partidaId:state.key,playerId:'local'});
      /* Sync selects into scaffold selecionados before gate */
      const painel=document.querySelector('[data-hpc-painel]');
      if(painel&&window.MosaicoHipotesesCamada.lerEstadoDoPainel){
        const live=window.MosaicoHipotesesCamada.lerEstadoDoPainel(document);
        window.MosaicoHipotesesCamada.salvarScaffold('casa-da-costa',live,{partidaId:state.key,playerId:'local'});
      }
      const gate=window.MosaicoHipotesesCamada.canConfirmGuiada(
        window.MosaicoHipotesesCamada.carregarScaffold('casa-da-costa',{partidaId:state.key,playerId:'local'}),
        {papel:e.papel,camada:e.camada}
      );
      if(!gate.ok){alert(gate.reason);return;}
    }
  }catch(err){}
  let p=state.caso.partidas[state.key],all=true,correct=0;state.answers={};p.campos.forEach(f=>{let el=document.getElementById('f-'+f.id),v=el?el.value:'';if(!v)all=false;state.answers[f.id]=v;if(v===f.resposta)correct++});if(!all){alert('Preencha todos os campos antes de fechar a conclusão.');return;}state.correct=correct;prepararPontuacao();state.resultadoVista='apuracao';state.apuracaoEtapa=0;state.phase='result';render();
}
const CATEGORIAS_SOLO=[['performance','Percurso individual'],['tempo','Investigações cronometradas'],['revisao','Mosaico e revisão crítica'],['economia','Mercado de pistas'],['qualidade','Decisão contra o caso']];
function prepararPontuacao(){
 let p=state.caso.partidas[state.key],rota=Math.min(20,Math.round((((state.percursoResultado&&state.percursoResultado.score)||0)/24)*20));
 let tempo=(state.sensorTempos||[]).slice(0,2).reduce((s,ms)=>s+(ms<=60000?10:ms<=120000?8:ms<=180000?6:4),0);
 let revisao=state.mosaico.length?20:0,economia=Math.min(20,(state.mercadoEscolhas||[]).length*7),qualidade=Math.round(20*state.correct/Math.max(1,p.campos.length));
 state.pontuacao={performance:rota,tempo:tempo,revisao:revisao,economia:economia,qualidade:qualidade};
}
function totalSolo(){return CATEGORIAS_SOLO.reduce((s,c)=>s+Number((state.pontuacao||{})[c[0]]||0),0);}
function agendarApuracao(){if(state.apuracaoTimer)return;state.apuracaoTimer=setTimeout(function(){state.apuracaoTimer=null;if(state.phase!=='result'||state.resultadoVista!=='apuracao')return;if(state.apuracaoEtapa<CATEGORIAS_SOLO.length){state.apuracaoEtapa++;render();}else{state.resultadoVista='podio';render();}},1500);}
function apuracao(){let vis=state.apuracaoEtapa;let cols=CATEGORIAS_SOLO.map((c,i)=>'<div class="apuracao-cat '+(i<vis?'visivel':'')+'"><span>'+esc(c[1])+'</span><b>'+(i<vis?esc(state.pontuacao[c[0]])+' pts':'—')+'</b></div>').join('');return '<span class="k">APURAÇÃO FINAL</span><h2>A investigação será recomposta.</h2><p class="lead">As categorias aparecem automaticamente, na mesma ordem do placar da Mesa.</p><div class="apuracao-grid">'+cols+'</div><div class="apuracao-total"><span>Total parcial</span><b>'+CATEGORIAS_SOLO.slice(0,vis).reduce((s,c)=>s+Number(state.pontuacao[c[0]]||0),0)+'</b></div>';}
function podio(){let p=state.caso.partidas[state.key],rows=p.campos.map(f=>'<div class="relation pf-inset"><span class="k">'+esc(f.rotulo)+'</span><p style="margin:.35rem 0"><b>Sua resposta:</b> '+esc(state.answers[f.id])+'</p><p class="muted" style="margin:0"><b>Canônica:</b> '+esc(f.resposta)+'</p></div>').join('');
  let processo='';
  try{
    if(window.MosaicoHipotesesCamada){
      const sc=window.MosaicoHipotesesCamada.carregarScaffold('casa-da-costa',{partidaId:state.key,playerId:'local'});
      processo=window.MosaicoHipotesesCamada.htmlRelatorioProcesso(sc,{caso:'casa-da-costa'})||'';
    }
  }catch(err){}
  return '<span class="k">PÓDIO · RESULTADO FINAL</span><div class="podio-solo"><div class="podio-degrau"><span>1º</span><b>Investigador solo</b><strong>'+totalSolo()+' pts</strong></div></div><h2>'+esc(p.titulo)+'</h2><div class="result pf-inset"><div class="score">'+totalSolo()+'</div><p class="muted">Pontuação total da experiência completa</p><p class="lead">'+esc(p.revelacao)+'</p></div>'+processo+rows+'<div class="factbox pf-inset"><b>Realidade canônica</b><span>'+esc(state.caso.realidadeCanonica.sintese)+'</span></div><button class="btn" onclick="nextRun()">Nova partida</button>';
}
function result(){if(!state.pontuacao)prepararPontuacao();return state.resultadoVista==='podio'?podio():apuracao();}
function nextRun(){if(state.apuracaoTimer){clearTimeout(state.apuracaoTimer);state.apuracaoTimer=null;}state.key=proxima();state.phase='home';state.i=0;state.seen=[];state.facts={};state.answers={};state.scoreFacts=0;state.percursoPronto=false;state.percursoResultado=null;state.percursoEtapa='janela';state.atividades=[];state.atividadeI=0;state.sensorPronto=false;state.sensorTempos=[];state.pontuacao=null;state.resultadoVista='apuracao';state.apuracaoEtapa=0;render();}
load();
