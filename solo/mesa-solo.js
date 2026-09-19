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

const RITMO=window.ACRitmo;
const state={phase:'home',caso:null,key:null,answers:{},marco:null,papeisPronto:false,pontosSolo:{},relogios:{},etapaDesde:0,
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
async function load(){try{const r=await fetch('../v1/casos/casa-da-costa.json?v=20260902-banco');if(!r.ok)throw Error();state.caso=await r.json();state.key=proxima();}catch(e){app.innerHTML=header()+'<div class="hero pf-card"><span class="k">Falha de carregamento</span><h2>O caso não pôde ser aberto.</h2><p class="muted">Recarregue a página quando a conexão estiver disponível.</p></div></div>';return;}
  /* Pós-abertura vem a sequência da Mesa: as telas-marco da Encenação e da
     Votação (só existem em grupo) e então a Janela — não o hub, o seletor
     Guiada (“Coloque os fatos na ordem certa”), a Sala nem a escrivaninha.
     _partidaNova impede o restore/Firebase de clobberar essa chegada. */
  if(state.phase==='home'){
    try{sessionStorage.removeItem('ac:solo-integral:v1')}catch(_){}
    state._partidaNova=true;
    state.percursoPronto=false;
    state.percursoResultado=null;
    state.percursoEtapa='janela';
    state.atividades=[];
    state.atividadeI=0;
    state.sensorPronto=false;
    state.sensorTempos=[];
    state.papeisPronto=false;
    state.pontosSolo={};state.relogios={};
    state.phase='marco';
    state.marco='encenacao';
  }
  render();}
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
function render(){if(!state.caso)return;let h=header();if(state.phase==='home')h+=home();if(state.phase==='briefing')h+=briefing();if(state.phase==='percurso3d')h+=percurso3d();if(state.phase==='sensor')h+=sensor();if(state.phase==='marco')h+=marco();if(state.phase==='papeis')h+=papeisTela();if(state.phase==='mosaico')h+=mosaico();if(state.phase==='mercado')h+=mercado();if(state.phase==='map')h+=map();if(state.phase==='decision')h+=decision();if(state.phase==='result')h+=result();
  try{
    /* O andaime de hipóteses pertence à análise/dedução. Na Mesa ele só
       aparece depois da coleta; no Solo deve obedecer à mesma sequência. */
    var fasesComHipoteses=['map','decision'];
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
 salaEscura:{titulo:'A Sala às Escuras',arquivo:'../v1/MOSAICO-26-a-sala-as-escuras.html?embed=1&v=20260919-ra'}
};
function briefing(){let p=state.caso.partidas[state.key];return '<span class="k">ENCENAÇÃO · PREPARAÇÃO</span><h2>A casa distribui os papéis.</h2><p class="lead">Você fará todas as tarefas da experiência. O sistema alternará a perspectiva cognitiva e assumirá somente as ações que dependeriam de outras pessoas.</p><div class="role-grid"><div class="relation pf-inset"><b>Você investiga</b><p class="muted">Observa, executa as atividades, organiza fatos e decide.</p></div><div class="relation pf-inset"><b>O sistema contrapõe</b><p class="muted">Distribui arquivos, oferece alternativas no Mercado e testa sua interpretação.</p></div></div><div class="question pf-inset"><b>'+esc(p.natureza)+'</b><p>'+esc(p.pergunta)+'</p></div><div class="relation pf-inset solo-legenda"><b>Tempo, dicas e sinais</b><p class="muted">⏳ Cada etapa tem tempo total; quanto antes terminar, mais pontos. Esgotado, a etapa não pontua e o jogo segue.</p><p class="muted">💡 Duas dicas chegam no caminho: a primeira sutil, a segunda ajuda mais — nenhuma entrega a resposta.</p><p class="muted">🤝 Nas tarefas em dupla, um parceiro automático faz a parte do outro papel e fala com você.</p><p class="muted">📖 Como jogar: dentro de cada tarefa, o botão abre as instruções e o significado dos ícones das janelas. ⌄ traz de volta as janelas recolhidas; ✕ sai da realidade aumentada.</p></div><button class="btn" onclick="abrirPercurso3D()">Entrar na casa</button>';}
function abrirPercurso3D(){try{sessionStorage.removeItem('ac:solo-integral:v1')}catch(_){ }state._partidaNova=true;state.percursoPronto=false;state.percursoResultado=null;state.percursoEtapa='janela';state.phase='percurso3d';render();}
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
function percurso3d(){const e=state.percursoEtapa,scene=e==='janela'?imersivo('1 / 4 · Chegada pela estrada','<iframe id="solo-percurso" title="A Janela do Norte" src="../v1/MOSAICO-26-a-janela-do-norte.html?embed=1" allow="camera; accelerometer; gyroscope; magnetometer"></iframe>'):imersivo('3 / 4 · Sob outra luz','<iframe id="solo-percurso" title="Escrivaninha da Casa da Costa" src="../v1/AC-escrivaninha.html?demo=solo&v=20260919-ra" allow="camera; xr-spatial-tracking; accelerometer; gyroscope; magnetometer; fullscreen" allowfullscreen></iframe>'),texto=e==='janela'?'Chegue pela estrada e aponte a Janela do Norte para entrar na casa.':'Na escrivaninha, siga até o registro: a maquete abre na sequência para fechar a etapa final do percurso.',quadro=state.percursoPronto?'<div class="result pf-inset"><div class="score">'+esc((state.pontosSolo.vela||0)+(state.pontosSolo.chaves||0))+'</div><p class="lead">A vela valeu '+esc(state.pontosSolo.vela||0)+' e as três chaves, '+esc(state.pontosSolo.chaves||0)+'. A passagem sob a despensa foi revelada.</p></div>':scene;return '<span class="k">PERCURSO 3D · '+(e==='janela'?'CHEGADA':'ESCRIVANINHA')+'</span><h2>Da estrada à maquete.</h2><p class="lead">'+texto+'</p>'+quadro+'<button class="btn ghost" onclick="abrirPapeis()" '+(state.percursoPronto?'':'disabled')+'>'+(state.percursoPronto?'Passagem revelada · continuar':'Conclua a etapa atual')+'</button>';}
function abrirAtividades(){state.atividades=parAtividades();state.atividadeI=0;state.sensorPronto=false;state.phase='sensor';render();}
function sensor(){let id=state.atividades[state.atividadeI],a=ATIVIDADE[id];return '<span class="k">ATIVIDADE SENSORIAL 2 DE 4</span><h2>'+esc(a.titulo)+'</h2><p class="lead">Conclua esta etapa para seguir para a escrivaninha.</p>'+(state.sensorPronto?'<div class="result pf-inset"><p class="lead">Atividade concluída. A próxima etapa foi liberada.</p></div>':imersivo('2 / 4 · '+a.titulo,'<iframe id="solo-sensor" title="'+esc(a.titulo)+'" src="'+esc(a.arquivo)+'" allow="camera; xr-spatial-tracking; accelerometer; gyroscope; magnetometer"></iframe>'))+'<button class="btn ghost" onclick="confirmarSensor()" '+(state.sensorPronto?'':'disabled')+'>'+(state.sensorPronto?'Atividade concluída · continuar':'Conclua a tarefa no quadro')+'</button>';
}
function confirmarSensor(){if(!state.sensorPronto)return;if(state.atividadeI<state.atividades.length-1){state.atividadeI++;state.sensorPronto=false;render();return;}if(state.percursoEtapa==='janela'){state.percursoEtapa='escrivaninha';state.sensorPronto=false;state.phase='percurso3d';render();return;}abrirAnalise();}
window.addEventListener('message',function(ev){if(ev.origin!==location.origin||!ev.data||ev.data.mosaico!=='tarefa-ok'||state.phase!=='sensor')return;state.sensorPronto=true;state.sensorTempos[state.atividadeI]=Math.max(0,Number(ev.data.tempoMs)||0);
 /* A sala vale um ponto por objeto achado (a Mesa conta igual). */
 const obj=Number(ev.data.objetosEncontrados);state.pontosSolo.sala=Number.isFinite(obj)?Math.max(0,Math.min(9,Math.round(obj))):9;
 render();});
window.addEventListener('message',function(ev){
 if(ev.origin!==location.origin||!ev.data||state.phase!=='percurso3d')return;
 if(ev.data.mosaico==='tarefa-ok'&&state.percursoEtapa==='janela'){
  try{sessionStorage.setItem('ac:solo-integral:v1',JSON.stringify({version:1,janelaConcluida:true}));}catch(_){}
  state.pontosSolo.janela=pontosJanela(Number(ev.data.tempoMs)||0);
  abrirAtividades();return;
 }
 if((ev.data.mosaico==='ac-solo-maquete-completa'||ev.data.mosaico==='ac-solo-completo')&&state.percursoEtapa==='escrivaninha'){if(state.percursoPronto)return;state.percursoPronto=true;state.percursoResultado={score:Number(ev.data.score)||0,evidence:Array.isArray(ev.data.evidence)?ev.data.evidence:[]};
  state.pontosSolo.chaves=Math.max(0,Math.min(24,Math.round(Number(ev.data.score)||0)));
  if(ev.data.vela!=null)state.pontosSolo.vela=Math.max(0,Math.min(30,Math.round(Number(ev.data.vela)||0)));
  render();}
});
function start(){
  if(state.apuracaoTimer){clearTimeout(state.apuracaoTimer);state.apuracaoTimer=null;}
  marcarUsada();state.answers={};state.papeisPronto=false;state.pontosSolo={};state.relogios={};
  state._partidaNova=true;state.percursoPronto=false;state.percursoResultado=null;state.percursoEtapa='janela';state.atividades=[];state.atividadeI=0;state.sensorPronto=false;state.sensorTempos=[];state.mosaico=[];state.mosaicoPick=null;state.mercadoEtapa=0;state.mercadoEscolhas=[];state.pontuacao=null;state.resultadoVista='apuracao';state.apuracaoEtapa=0;
  abrirMarco('encenacao');
}
/* O seletor Guiada/Cronista (“Coloque os fatos na ordem certa”) só depois
   do percurso 3D. Se nascer no Começar, vira a primeira tela após a abertura. */
function abrirAnalise(){
  function go(){prepararMosaico();state.phase='mosaico';render();}
  if(window.MosaicoPapelCamada && !state._papelOk){
    window.MosaicoPapelCamada.mostrarSeletor({caso:'casa-da-costa'}).then(function(){state._papelOk=true;go();});
    return;
  }
  go();
}
/* As etapas que só existem em grupo — a Encenação, a Votação de performance
   e o Voto de cooperação — não somem do Solo sem aviso: cada uma vira uma
   tela-marco NA MESMA POSIÇÃO da sequência da Mesa (Mario, 18/09/2026). O
   Solo é bancada da Mesa: quem testa por ele precisa saber onde a Mesa faz
   algo que ele não está exercitando. */
const MARCOS={
  encenacao:{nome:'A Encenação',texto:'cada jogador, na sua vez, lê no celular uma instrução secreta e a encena para o grupo; os outros assistem de tela virada.',depois:()=>abrirMarco('votacao')},
  votacao:{nome:'A Votação de performance',texto:'cada um vota em quem encenou melhor, menos em si mesmo.',depois:()=>abrirPercurso3D()},
  cooperacao:{nome:'O Voto de cooperação',texto:'cada um escolhe, em segredo, quem mais ajudou o seu grupo a pôr a noite em ordem.',depois:()=>{state.phase='mercado';render();}}
};
function abrirMarco(id){state.marco=id;state.phase='marco';render();window.scrollTo({top:0});}
function marco(){
  const m=MARCOS[state.marco]||MARCOS.encenacao;
  return '<section class="hero pf-card marco-mesa"><span class="k">A MESA · EM GRUPO</span><h2>'+esc(m.nome)+'</h2>'+
    '<p class="lead">Neste momento seria '+esc(m.nome.replace(/^A /,'a ').replace(/^O /,'o '))+' na versão A Mesa, em grupo: '+esc(m.texto)+'</p>'+
    '<p class="muted">No Solo esta etapa não acontece — ela precisa de outras pessoas.</p>'+
    '<button class="btn" onclick="seguirMarco()">Continuar</button></section>';
}
function seguirMarco(){(MARCOS[state.marco]||MARCOS.encenacao).depois();}
/* 4 / 4 · Os papéis da passagem: a mesma página da Mesa (AC-papeis.html),
   que é individual nos dois modos. */
function abrirPapeis(){if(!state.percursoPronto)return;state.papeisPronto=false;state.phase='papeis';render();window.scrollTo({top:0});}
function papeisTela(){
  return '<span class="k">PERCURSO 3D · A PASSAGEM</span><h2>Os papéis da passagem.</h2><p class="lead">Debaixo da despensa, três papéis rasgados.</p>'+
    (state.papeisPronto?'<div class="result pf-inset"><p class="lead">A planta, o bilhete e o relógio foram montados. A pista foi para o dossiê.</p></div>':
      imersivo('4 / 4 · Os papéis da passagem','<iframe id="solo-papeis" title="Os papéis da passagem" src="../v1/AC-papeis.html?demo=solo&v=20260919-ra"></iframe>'))+
    '<button class="btn ghost" onclick="abrirAnalise()" '+(state.papeisPronto?'':'disabled')+'>'+(state.papeisPronto?'Papéis guardados · continuar':'Monte os três papéis')+'</button>';
}
window.addEventListener('message',function(ev){
  if(ev.origin!==location.origin||!ev.data||ev.data.mosaico!=='ac-papeis-completo'||state.phase!=='papeis')return;
  state.papeisPronto=true;state.pontosSolo.papeis=Math.max(0,Math.min(15,Math.round(Number(ev.data.pontos)||0)));render();
});
function itensMosaico(){
 const ids=(state.caso.mosaico&&state.caso.mosaico.ordemCorreta)||[];
 return ids.map(id=>({id:id,rot:(state.caso.mosaico.rotulos||{})[id]||id,dica:(state.caso.mosaico.dicas||{})[id]||''}));
}
function prepararMosaico(){state.mosaico=shuffle(itensMosaico());if(state.mosaico.every((x,i)=>x.id===itensMosaico()[i].id))state.mosaico.reverse();state.mosaicoPick=null;state.relogios.mosaico={inicio:Date.now(),fim:null,esgotado:false};}
/* A noite em ordem (Mario, 18/09/2026: "a tarefa de colocar os fatos em ordem
   está difícil"): agora ela tem tempo total e duas dicas. A primeira conta
   quantos acontecimentos já estão no lugar; a segunda marca e prende os que
   estão certos — o resto ainda é com quem joga. Terminar a tempo vale até
   20 pontos (perde 1 a cada 12 s depois do primeiro minuto); esgotado o
   tempo, a ordem certa aparece e a tarefa não pontua. */
function segundosDe(r){return r?Math.max(0,((r.fim||Date.now())-r.inicio)/1000):0;}
function nivelMosaico(){const r=state.relogios.mosaico;return r&&!r.fim?RITMO.nivelDaDica(segundosDe(r),RITMO.mosaico.dicas):(r&&r.nivel)||0;}
function mosaicoCerto(){const certo=itensMosaico();return state.mosaico.length&&state.mosaico.every((x,i)=>x.id===certo[i].id);}
function mosaico(){
 let certo=itensMosaico(),r=state.relogios.mosaico||{},ok=mosaicoCerto(),nivel=nivelMosaico(),noLugar=state.mosaico.filter((x,i)=>x.id===certo[i].id).length;
 let linhas=state.mosaico.map((x,i)=>{const preso=nivel>=2&&x.id===certo[i].id&&!r.esgotado;return '<button class="mosaico-item '+(state.mosaicoPick===i?'sel ':'')+(preso?'preso':'')+'" onclick="tocarMosaico('+i+')" '+(preso||r.esgotado||ok?'aria-disabled="true"':'')+'><span>'+(preso?'✓':(i+1))+'</span><b>'+esc(x.rot)+'</b><small>'+esc(x.dica)+'</small></button>';}).join('');
 let dica='';
 if(!ok&&!r.esgotado&&nivel>=1)dica='<div class="solo-dica pf-inset">💡 '+(nivel===1?'Dica: '+noLugar+' de '+certo.length+' acontecimentos já estão no lugar certo. O apagão é o que divide a noite.':'Dica 2: os que estão no lugar ganharam ✓ e ficaram presos. Falta ordenar só os outros.')+'</div>';
 let fim=r.esgotado?'<div class="factbox pf-inset"><b>O tempo acabou</b><span>A ordem certa apareceu. A noite em ordem não pontua nesta partida.</span></div><button class="btn" onclick="abrirMarco(\'cooperacao\')">Continuar</button>'
   :ok?'<div class="factbox pf-inset"><b>Linha factual validada</b><span>A sequência está coerente ('+(state.pontosSolo.mosaico||0)+' pontos). Agora você pode acessar o Mercado de pistas.</span></div><button class="btn" onclick="abrirMarco(\'cooperacao\')">Continuar</button>'
   :'<p class="muted">A etapa avança quando todos os acontecimentos estiverem na ordem factual.</p>';
 return '<span class="k">MOSAICO · RECONSTRUÇÃO INDIVIDUAL</span><h2>Coloque a noite em ordem.</h2><p class="lead">Organize os acontecimentos revelados. Toque em dois para trocar suas posições.</p>'+relogioSolo('mosaico')+dica+'<div class="mosaico-lista">'+linhas+'</div>'+fim;
}
function tocarMosaico(i){
 const r=state.relogios.mosaico||{},certo=itensMosaico();
 if(r.esgotado||mosaicoCerto())return;
 const preso=k=>nivelMosaico()>=2&&state.mosaico[k].id===certo[k].id;
 if(preso(i))return;
 if(state.mosaicoPick===null){state.mosaicoPick=i;render();return;}if(state.mosaicoPick===i){state.mosaicoPick=null;render();return;}let a=state.mosaicoPick;[state.mosaico[a],state.mosaico[i]]=[state.mosaico[i],state.mosaico[a]];state.mosaicoPick=null;
 if(mosaicoCerto()){r.fim=Date.now();r.nivel=nivelMosaico();state.pontosSolo.mosaico=RITMO.pontos('mosaico',segundosDe(r));}
 render();
 /* A validação nasce ABAIXO da lista: a 390×844 o botão do Mercado ficava em y=937 (volta 2, 17/09/2026). */
 if(mosaicoCerto()){const v=document.querySelector('#app .mosaico-lista ~ .factbox');if(v)v.scrollIntoView({behavior:'smooth',block:'center'});}}
/* O relógio de uma etapa sem iframe (mosaico, mercado, decisão). */
function relogioSolo(qual){
 const r=state.relogios[qual];if(!r)return '';
 const total=RITMO[qual==='decision'?'decisao':qual].total;
 const txt=r.esgotado?'Tempo esgotado':r.fim?'Concluído em '+RITMO.relogio(segundosDe(r)):RITMO.relogio(total-segundosDe(r))+' restantes';
 return '<p class="solo-relogio" data-relogio="'+qual+'">⏳ <b>'+txt+'</b></p>';
}
function ofertaMercado(){return conjunto(state.key).slice(0,3).map(evid).filter(Boolean);}
function mercado(){
 let etapa=state.mercadoEtapa,ofertas=ofertaMercado();
 if(!state.relogios.mercado)state.relogios.mercado={inicio:Date.now(),fim:null,esgotado:false};
 const rel=relogioSolo('mercado');
 if(state.relogios.mercado.esgotado&&etapa<3)etapa=3;
 if(etapa===0)return '<span class="k">MERCADO DE PISTAS · AÇÃO 1 DE 3</span><h2>Adquirir uma pista lacrada.</h2>'+rel+'<p class="lead">Três arquivos lacrados estão disponíveis. Escolha um para aprofundar sua investigação.</p><div class="mercado-grid">'+ofertas.map((e,i)=>'<button class="mkt-card" onclick="acaoMercado(\'adquirir\','+i+')"><b>Arquivo lacrado '+(i+1)+'</b><span>'+esc(e.hora)+'</span></button>').join('')+'</div>';
 if(etapa===1)return '<span class="k">MERCADO DE PISTAS · AÇÃO 2 DE 3</span><h2>Avaliar a confiança.</h2>'+rel+'<p class="lead">Avalie individualmente se a pista é central ou secundária para sua linha de investigação.</p><div class="opts pf-inset"><button class="opt" onclick="acaoMercado(\'manter\')">Manter: ela parece central</button><button class="opt" onclick="acaoMercado(\'consignar\')">Consignar: ela parece secundária</button></div>';
 if(etapa===2)return '<span class="k">MERCADO DE PISTAS · AÇÃO 3 DE 3</span><h2>Comprar informação ou preservar recursos?</h2>'+rel+'<p class="lead">Faça uma revisão crítica antes de decidir, sem acesso à resposta canônica.</p><div class="relation pf-inset"><b>Revisão crítica</b><p class="muted">“Os fatos explicam presença, mas ainda não necessariamente entrada ou culpa.”</p></div><div class="opts pf-inset"><button class="opt" onclick="acaoMercado(\'comprar contraponto\')">Comprar o contraponto</button><button class="opt" onclick="acaoMercado(\'preservar recursos\')">Preservar os recursos</button></div>';
 return '<span class="k">MERCADO ENCERRADO</span><h2>'+(state.relogios.mercado.esgotado?'O tempo do Mercado acabou.':'Suas decisões foram registradas.')+'</h2><div class="relation pf-inset">'+state.mercadoEscolhas.map(x=>'<p>• '+esc(x)+'</p>').join('')+'</div><button class="btn" onclick="abrirMapa()">Abrir a planta da casa</button>';
}
function acaoMercado(tipo,i){const r=state.relogios.mercado;if(r&&(r.esgotado||r.fim))return;let txt=tipo;if(tipo==='adquirir'){let e=ofertaMercado()[i];txt='Adquiriu: '+(e?e.title:'arquivo')}state.mercadoEscolhas.push(txt);state.mercadoEtapa++;if(state.mercadoEtapa>=3&&r)r.fim=Date.now();render();}
function abrirMapa(){state.phase='map';render();window.scrollTo({top:0});}
function map(){let p=state.caso.partidas[state.key];return '<span class="k">MAPA DA CASA</span><h2>Onde os fatos se encontram?</h2><p class="lead">Use a planta como síntese espacial. Não procure um culpado: procure onde a pergunta começa a fechar.</p><div class="map pf-inset"><img src="../v1/img/casa-da-costa-planta-1867.svg" alt="Planta esquemática da Casa da Costa, construção de 1867"><div class="mapnote"><b>'+esc(p.titulo)+'</b><br>'+esc(p.pergunta)+'</div></div><button class="btn" onclick="state.phase=\'decision\';render()">Responder à pergunta</button>';}
function decision(){if(!state.relogios.decision)state.relogios.decision={inicio:Date.now(),fim:null,esgotado:false};let p=state.caso.partidas[state.key];state.rascunho=state.rascunho||{};let fields=p.campos.map(f=>'<div class="field pf-inset"><label>'+esc(f.rotulo)+'</label><select id="f-'+esc(f.id)+'" onchange="state.rascunho[\''+esc(f.id)+'\']=this.value"><option value="">Escolha…</option>'+f.opcoes.map(o=>'<option'+(state.rascunho[f.id]===o?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select></div>').join('');return '<span class="k">INFERÊNCIA → DECISÃO</span><h2>'+esc(p.pergunta)+'</h2><p class="lead">Preencha os campos derivados desta pergunta. Depois do envio, a resposta será comparada à realidade canônica.</p>'+relogioSolo('decision')+'<div class="fields">'+fields+'</div><button class="btn red" onclick="finish()">Fechar minha conclusão</button><button class="btn ghost" onclick="state.phase=\'map\';render()">Rever a planta</button>';}
function finish(forcado){
  forcado=forcado===true;
  if(!forcado)try{
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
  let p=state.caso.partidas[state.key],all=true,correct=0;state.answers={};p.campos.forEach(f=>{let el=document.getElementById('f-'+f.id),v=el?el.value:'';if(!v)all=false;state.answers[f.id]=v;if(v===f.resposta)correct++});if(!all&&!forcado){alert('Preencha todos os campos antes de fechar a conclusão.');return;}state.correct=forcado?0:correct;if(state.relogios.decision)state.relogios.decision.fim=Date.now();prepararPontuacao();state.resultadoVista='apuracao';state.apuracaoEtapa=0;state.phase='result';render();
}
/* O placar do Solo, na ordem da partida. Cada tarefa pontua se terminar no
   tempo; esgotado o tempo, aquela tarefa vale zero (Mario, 18/09/2026). */
const CATEGORIAS_SOLO=[['janela','A Janela do Norte'],['sala','A Sala às Escuras'],['vela','A escrivaninha e a vela'],['chaves','As três chaves'],['papeis','Os papéis da passagem'],['mosaico','A noite em ordem'],['economia','Mercado de pistas'],['qualidade','Decisão contra o caso']];
function pontosJanela(ms){const s=ms/1000;return !(s>0)||s>=50?0:s<=25?5:s<=35?4:s<=45?3:2;}
function prepararPontuacao(){
 let p=state.caso.partidas[state.key],P=state.pontosSolo||{};
 const merc=state.relogios.mercado,economia=merc&&merc.esgotado?Math.min(20,(state.mercadoEscolhas||[]).length*6):Math.min(20,(state.mercadoEscolhas||[]).length*7);
 const dec=state.relogios.decision,qualidade=dec&&dec.esgotado?0:Math.round(20*(state.correct||0)/Math.max(1,p.campos.length));
 state.pontuacao={janela:P.janela||0,sala:P.sala||0,vela:P.vela||0,chaves:P.chaves||0,papeis:P.papeis||0,mosaico:P.mosaico||0,economia:economia,qualidade:qualidade};
}
function totalSolo(){return CATEGORIAS_SOLO.reduce((s,c)=>s+Number((state.pontuacao||{})[c[0]]||0),0);}
function agendarApuracao(){if(state.apuracaoTimer)return;state.apuracaoTimer=setTimeout(function(){state.apuracaoTimer=null;if(state.phase!=='result'||state.resultadoVista!=='apuracao')return;if(state.apuracaoEtapa<CATEGORIAS_SOLO.length){state.apuracaoEtapa++;render();}else{state.resultadoVista='podio';render();}},1500);}
function apuracao(){let vis=state.apuracaoEtapa;let cols=CATEGORIAS_SOLO.map((c,i)=>'<div class="apuracao-cat '+(i<vis?'visivel':'')+'"><span>'+esc(c[1])+'</span><b>'+(i<vis?esc(state.pontuacao[c[0]])+' pts':'—')+'</b></div>').join('');return '<span class="k">APURAÇÃO FINAL</span><h2>A investigação será recomposta.</h2><p class="lead">As categorias aparecem automaticamente, na mesma ordem do placar da Mesa.</p><div class="apuracao-grid">'+cols+'</div><div class="apuracao-total"><span>Total parcial</span><b>'+CATEGORIAS_SOLO.slice(0,vis).reduce((s,c)=>s+Number(state.pontuacao[c[0]]||0),0)+'</b></div>';}
/* A figura do pódio sai do elenco do caso, como na Mesa: quem joga o Solo é
   o Investigador. Antes o degrau só tinha o número (Mario, 18/09/2026). */
function avatarSolo(){const e=((state.caso&&state.caso.elenco)||[]).find(x=>x.id==='investigador');return (e&&e.av)||'🔎';}
function podio(){let p=state.caso.partidas[state.key],rows=p.campos.map(f=>'<div class="relation pf-inset"><span class="k">'+esc(f.rotulo)+'</span><p style="margin:.35rem 0"><b>Sua resposta:</b> '+esc(state.answers[f.id])+'</p><p class="muted" style="margin:0"><b>Canônica:</b> '+esc(f.resposta)+'</p></div>').join('');
  let processo='';
  try{
    if(window.MosaicoHipotesesCamada){
      const sc=window.MosaicoHipotesesCamada.carregarScaffold('casa-da-costa',{partidaId:state.key,playerId:'local'});
      processo=window.MosaicoHipotesesCamada.htmlRelatorioProcesso(sc,{caso:'casa-da-costa'})||'';
    }
  }catch(err){}
  return '<span class="k">PÓDIO · RESULTADO FINAL</span><div class="podio-solo"><div class="podio-degrau"><span>1º</span><i class="podio-av" aria-hidden="true">'+esc(avatarSolo())+'</i><b>Investigador solo</b><strong>'+totalSolo()+' pts</strong></div></div><h2>'+esc(p.titulo)+'</h2><div class="result pf-inset"><div class="score">'+totalSolo()+'</div><p class="muted">Pontuação total da experiência completa</p><p class="lead">'+esc(p.revelacao)+'</p></div>'+processo+rows+'<div class="factbox pf-inset"><b>Realidade canônica</b><span>'+esc(state.caso.realidadeCanonica.sintese)+'</span></div><button class="btn" onclick="nextRun()">Nova partida</button>';
}
function result(){if(!state.pontuacao)prepararPontuacao();return state.resultadoVista==='podio'?podio():apuracao();}
function nextRun(){if(state.apuracaoTimer){clearTimeout(state.apuracaoTimer);state.apuracaoTimer=null;}state.pontosSolo={};state.rascunho={};state.relogios={};state.mercadoEtapa=0;state.mercadoEscolhas=[];state.mosaico=[];state.key=proxima();state.phase='home';state.answers={};state.papeisPronto=false;state.marco=null;state.percursoPronto=false;state.percursoResultado=null;state.percursoEtapa='janela';state.atividades=[];state.atividadeI=0;state.sensorPronto=false;state.sensorTempos=[];state.pontuacao=null;state.resultadoVista='apuracao';state.apuracaoEtapa=0;render();}
/* O relógio das etapas. Nas etapas com iframe ele NÃO redesenha a página
   (recriar o HTML recarregaria a atividade): só mostra a saída de socorro se
   a etapa passar muito do tempo dela sem responder. */
const SOCORRO={janela:150,sensor:150,escrivaninha:RITMO.escrivaninha.total+RITMO.maquete.total+240,papeis:RITMO.papeis.total+90};
function etapaComIframe(){return state.phase==='percurso3d'?(state.percursoEtapa==='janela'?'janela':'escrivaninha'):state.phase==='sensor'?'sensor':state.phase==='papeis'?'papeis':null;}
let etapaVista=null;
setInterval(function(){
 if(!state.caso)return;
 const et=etapaComIframe();
 if(et){
  const marca=et+'|'+state.phase+'|'+state.percursoEtapa;
  if(marca!==etapaVista){etapaVista=marca;state.etapaDesde=Date.now();}
  const pronto=(et==='janela'&&false)||(et==='sensor'&&state.sensorPronto)||(et==='escrivaninha'&&state.percursoPronto)||(et==='papeis'&&state.papeisPronto);
  const bar=document.querySelector('.solo-imersivo-barra');
  if(bar&&!pronto&&(Date.now()-state.etapaDesde)/1000>SOCORRO[et]&&!bar.querySelector('.solo-socorro')){
   const b=document.createElement('button');b.type='button';b.className='solo-socorro';b.textContent='A etapa travou? Seguir sem os pontos dela';b.onclick=function(){socorro(et);};bar.appendChild(b);
  }
  return;
 }
 etapaVista=null;
 ['mosaico','mercado','decision'].forEach(function(q){
  const r=state.relogios[q];if(!r||r.fim||r.esgotado||state.phase!==q)return;
  const total=RITMO[q==='decision'?'decisao':q].total,decorrido=segundosDe(r);
  const el=document.querySelector('[data-relogio="'+q+'"] b');if(el)el.textContent=RITMO.relogio(total-decorrido)+' restantes';
  if(decorrido>=total){r.esgotado=true;r.fim=Date.now();
   if(q==='mosaico'){state.mosaico=itensMosaico();state.mosaicoPick=null;state.pontosSolo.mosaico=0;render();}
   else if(q==='mercado'){render();}
   else if(q==='decision'){finish(true);}
   return;}
  if(q==='mosaico'){const n=RITMO.nivelDaDica(decorrido,RITMO.mosaico.dicas);if(n!==r.nivelVisto){r.nivelVisto=n;if(n)render();}}
 });
},1000);
/* Saída de socorro: a etapa que não respondeu segue sem pontos. */
function socorro(et){
 if(et==='janela'){try{sessionStorage.setItem('ac:solo-integral:v1',JSON.stringify({version:1,janelaConcluida:true}));}catch(_){}state.pontosSolo.janela=0;abrirAtividades();return;}
 if(et==='sensor'){state.sensorPronto=true;state.pontosSolo.sala=state.pontosSolo.sala||0;render();return;}
 if(et==='escrivaninha'){state.percursoPronto=true;state.percursoResultado={score:0,evidence:[]};render();return;}
 if(et==='papeis'){state.papeisPronto=true;state.pontosSolo.papeis=0;render();}
}
load();
