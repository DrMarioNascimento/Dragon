(function(){
"use strict";
const ORDEM=["sete","cinco","apagao","nome","corpo","perceber"];
const CHAVE_ROT="mosaico_casa_ultima_partida_noite";
const CHAVE_ESTADO="mosaico_noite_costa_auto";
const EVIDENCIAS=[
 {id:"F1",t:"As xícaras",x:"Sete xícaras limpas secando na pia. Seis pessoas beberam chá naquela noite.",m:[37,70]},
 {id:"F2",t:"A ausência de poeira",x:"Cozinha e corredor estão sem poeira; outros cômodos guardam cinco meses de abandono.",m:[47,68]},
 {id:"F4",t:"O quarto degrau",x:"Range sob peso. Às 21h21 e às 23h40, ninguém do grupo estava na escada.",m:[55,66]},
 {id:"F5",t:"A colher",x:"Um talher aparece no corredor depois do apagão. Não estava ali às 21h19.",m:[57,60]},
 {id:"F6",t:"A respiração",x:"A Jornalista sente uma respiração próxima em ponto onde nenhum dos outros cinco estava.",m:[56,58]},
 {id:"F7",t:"A sombra",x:"O Policial vê um vulto atravessar o corredor entre ele e a janela.",m:[58,55]},
 {id:"F8",t:"O nome",x:"Às 21h31, a secretária eletrônica reinicia e reproduz um nome que não pertence aos seis.",m:[72,38]},
 {id:"F9",t:"O contrato",x:"Registro de pagamentos a uma acompanhante por catorze meses, encerrado há cinco meses.",m:[70,45]},
 {id:"F10",t:"As pegadas",x:"No jardim interno, um par de pegadas entra e não sai; a numeração não coincide com os presentes.",m:[48,52]},
 {id:"F11",t:"A porta do jardim",x:"O antigo quarto de serviço tem porta sem tranca e dobradiça lubrificada recentemente.",m:[45,48]},
 {id:"F12",t:"A cadeira morna",x:"Às 21h35, uma cadeira do corredor está acima da temperatura ambiente.",m:[57,64]},
 {id:"F13",t:"O consumo",x:"O hidrômetro registra consumo diário contínuo nos cinco meses em que a casa esteve considerada vazia.",m:[39,72]},
 {id:"F14",t:"O boiler",x:"Há acionamentos fora dos dois dias semanais de visita do Morador.",m:[42,69]},
 {id:"F15",t:"Queda em rede",x:"A concessionária registra interrupção às 21h29 em três unidades da encosta.",m:[50,44]},
 {id:"F16",t:"O disjuntor",x:"A chave geral permaneceu ligada; não há sinal de acionamento manual.",m:[52,46]},
 {id:"F17",t:"A caixa de passagem",x:"A caixa enterrada no jardim estava submersa e com oxidação recente.",m:[49,49]},
 {id:"F19",t:"O higrômetro",x:"Picos de umidade coincidem com os estalos regulares do sótão.",m:[66,33]},
 {id:"F20",t:"O cofre",x:"A porta estava encostada, não travada; o envelope do inventário permaneceu íntegro e lacrado.",m:[62,73]}
];
const RELACOES=[
 ["R1","Xícaras + poeira + despensa","Três sinais domésticos que, juntos, descrevem rotina de habitação."],
 ["R2","Consumo + visitas","Água e boiler aparecem em dias em que ninguém deveria ocupar a casa."],
 ["R3","Degrau + colher + cadeira morna","Peso, deslocamento e temperatura exigem presença física."],
 ["R4","Respiração + sombra + posições","Cruzando onde estavam os seis, sobra um ponto ocupado."],
 ["R5","Nome + contrato","A gravação deixa de ser fenômeno e passa a identificar uma pessoa real."],
 ["R6","Pegadas + porta do jardim","Entrada sem saída e acesso reservado fecham a localização."],
 ["R7","Apagão + rede + disjuntor","O escuro não foi provocado dentro da casa; foi aproveitado."]
];
const MODULOS={sete:["janela","escuro","sala"],cinco:["vidro","escuro"],apagao:["sala","escuro","janela"],nome:["vidro","escuro"],corpo:["vidro","sala","janela"],perceber:["escuro","vidro"]};
const MODINFO={
 janela:{titulo:"A Janela do Norte",file:"modulos/janela-do-norte.html",desc:"A sombra permanece, mas sua função muda: presença, não entrada."},
 sala:{titulo:"A Sala às Escuras",file:"modulos/sala-as-escuras.html",desc:"Reconstrua 21h29–21h31 pelas posições, respiração, sombra e objeto deslocado."},
 vidro:{titulo:"O Vidro Embaçado",file:"modulos/vidro-embacado.html",desc:"Procure sinais de uso continuado numa casa que deveria estar vazia."},
 escuro:{titulo:"O Mapa do Escuro",file:"modulos/mapa-do-escuro.html",desc:"Use o espaço para ligar cômodos, trajetos e pontos que não fecham com a contagem."}
};
let CASO=null,partida="",fase="inicio",analisadas=[],modsFeitos=[],respostas={},inicioTurno=0,limite=60,timer=null;
const $=s=>document.querySelector(s),app=()=>$("#app");
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function valida(id){return !!(CASO&&CASO.partidas&&CASO.partidas[id]);}
function proxima(){let u="";try{u=localStorage.getItem(CHAVE_ROT)||""}catch(e){}let i=ORDEM.indexOf(u);for(let n=1;n<=ORDEM.length;n++){let id=ORDEM[(i+n+ORDEM.length)%ORDEM.length];if(valida(id))return id}return CASO.perguntaPadrao||"sete";}
function marcarUsada(){try{localStorage.setItem(CHAVE_ROT,partida)}catch(e){}}
function salvar(){try{localStorage.setItem(CHAVE_ESTADO,JSON.stringify({partida,fase,analisadas,modsFeitos,respostas,limite}))}catch(e){}}
function carregar(){try{let s=JSON.parse(localStorage.getItem(CHAVE_ESTADO)||"null");if(s&&valida(s.partida)&&s.fase&&s.fase!=="inicio"){partida=s.partida;fase=s.fase;analisadas=s.analisadas||[];modsFeitos=s.modsFeitos||[];respostas=s.respostas||{};limite=s.limite||60;return}}catch(e){}partida=proxima();fase="inicio";}
function pergunta(){return CASO.partidas[partida]||null;}
function renderInicio(){if(!partida)partida=proxima();let p=pergunta();app().innerHTML=`<section class="hero shell"><span class="eyebrow">MOSAICO · A NOITE</span><h1>A Casa da Costa</h1><p class="lead">O levantamento terminou. Agora os fatos precisam sustentar uma conclusão.</p><div class="quote">A mesma noite. Os mesmos fatos. <b>O MOSAICO escolheu a pergunta desta reunião.</b></div><div class="question"><b>${esc(p.natureza)} · pergunta-mãe</b><p>${esc(p.pergunta)}</p></div><p class="lead">${esc(p.titulo)}</p><div class="toolbar"><button class="btn btn-ghost ${limite===60?'on':''}" data-ritmo="60">Calma · 60 s</button><button class="btn btn-ember ${limite===30?'on':''}" data-ritmo="30">Sob pressão · 30 s</button><button class="btn btn-gold" id="comecar">Abrir dossiê</button></div><p class="muted">A próxima investigação receberá automaticamente a pergunta seguinte.</p></section>`;
 document.querySelectorAll('[data-ritmo]').forEach(b=>b.onclick=()=>{limite=Number(b.dataset.ritmo);renderInicio()});$("#comecar").onclick=()=>{marcarUsada();fase="dossie";analisadas=[];modsFeitos=[];respostas={};salvar();render()};}
function selecionadas(){let ids=new Set(analisadas);return EVIDENCIAS.filter(e=>ids.has(e.id));}
function markers(){return selecionadas().map(e=>`<span class="marker x" style="left:${e.m[0]}%;top:${e.m[1]}%" title="${e.id} · ${esc(e.t)}"></span>`).join("");}
function fatosHtml(){let lista=selecionadas();return lista.length?lista.map(e=>`<div class="fact"><strong>${e.id} · ${esc(e.t)}</strong><p>${esc(e.x)}</p></div>`).join(""):`<p class="lead">Nenhum fragmento foi incorporado ainda. Abra evidências ou execute um módulo.</p>`;}
function modulosHtml(){return (MODULOS[partida]||[]).map(id=>{let m=MODINFO[id],done=modsFeitos.includes(id);return `<div class="tool ${done?'done':''}"><b>${esc(m.titulo)}</b><p>${esc(m.desc)}</p><button class="btn ${done?'btn-ghost':'btn-ember'}" data-mod="${id}">${done?'Reabrir':'Abrir atividade'}</button></div>`}).join("");}
function relacoesHtml(){let n=analisadas.length;return RELACOES.filter((r,i)=>i<Math.max(1,Math.floor(n/2))).map(r=>`<div class="rel"><b>${r[0]} · ${esc(r[1])}</b><br>${esc(r[2])}</div>`).join("");}
function renderDossie(){let p=pergunta();app().innerHTML=`<main class="stage shell"><div class="question"><b>Pergunta-mãe · ${esc(p.natureza)}</b><p>${esc(p.pergunta)}</p></div><div class="statusline"><span class="chip">Dossiê: ${analisadas.length}/${EVIDENCIAS.length}</span><span class="chip">Módulos: ${modsFeitos.length}/${(MODULOS[partida]||[]).length}</span><span class="chip">Ritmo: ${limite}s</span></div><section class="dossie"><div class="dossie-head"><h3>Memória do caso</h3><button class="btn btn-ghost" id="novaPista">Incorporar fragmento</button></div><div class="facts">${fatosHtml()}</div></section><h2>Ferramentas da reunião</h2><div class="grid modules">${modulosHtml()}</div><h2>Mapa coletivo</h2><div class="mapwrap"><img src="../v1/img/casa-da-costa-planta-1867.svg" alt="Planta esquemática da Casa da Costa, construída em 1867">${markers()}</div><h2>Relações sustentáveis</h2><div class="relacoes">${relacoesHtml()}</div><div class="toolbar"><button class="btn btn-gold" id="decidir" ${analisadas.length<5?'disabled':''}>Fechar decisão</button></div></main>`;
 $("#novaPista").onclick=incorporar;$("#decidir").onclick=()=>{fase="decisao";inicioTurno=Date.now();salvar();render()};document.querySelectorAll('[data-mod]').forEach(b=>b.onclick=()=>abrirModulo(b.dataset.mod));}
function incorporar(){let restante=EVIDENCIAS.filter(e=>!analisadas.includes(e.id));if(!restante.length)return;analisadas.push(restante[Math.floor(Math.random()*restante.length)].id);salvar();renderDossie();}
function abrirModulo(id){let m=MODINFO[id];$("#modal").classList.remove("hide");$("#modal-title").textContent=m.titulo;$("#modframe").src=m.file+"?embed=0&noite=1&partida="+encodeURIComponent(partida);$("#moddone").onclick=()=>{if(!modsFeitos.includes(id))modsFeitos.push(id);for(let i=0;i<2;i++)incorporarSilencioso();salvar();fecharModulo();renderDossie()};}
function incorporarSilencioso(){let r=EVIDENCIAS.filter(e=>!analisadas.includes(e.id));if(r.length)analisadas.push(r[Math.floor(Math.random()*r.length)].id);}
function fecharModulo(){$("#modal").classList.add("hide");$("#modframe").src="about:blank";}
function renderDecisao(){let p=pergunta();app().innerHTML=`<main class="stage shell"><div class="question"><b>Decisão final</b><p>${esc(p.pergunta)}</p></div><div id="tempo" class="quote">Tempo para sustentar sua conclusão: <b>${limite}s</b></div><div class="fields">${p.campos.map(c=>`<div class="campo"><label>${esc(c.rotulo)}</label><select data-c="${esc(c.id)}"><option value="">Selecione…</option>${c.opcoes.map(o=>`<option ${respostas[c.id]===o?'selected':''}>${esc(o)}</option>`).join("")}</select></div>`).join("")}</div><div class="toolbar"><button class="btn btn-gold" id="enviar">Registrar conclusão</button><button class="btn btn-ghost" id="voltar">Voltar ao dossiê</button></div></main>`;document.querySelectorAll('[data-c]').forEach(s=>s.onchange=()=>{respostas[s.dataset.c]=s.value;salvar()});$("#enviar").onclick=finalizar;$("#voltar").onclick=()=>{fase="dossie";clearInterval(timer);salvar();render()};clearInterval(timer);timer=setInterval(()=>{let rest=Math.max(0,limite-Math.floor((Date.now()-inicioTurno)/1000));let t=$("#tempo");if(t)t.innerHTML=`Tempo para sustentar sua conclusão: <b>${rest}s</b>`;if(!rest){clearInterval(timer);finalizar()}},250);}
function finalizar(){clearInterval(timer);let p=pergunta(),total=p.campos.length,acertos=0;p.campos.forEach(c=>{if(respostas[c.id]===c.resposta)acertos++});fase="resultado";salvar();app().innerHTML=`<main class="stage shell"><section class="result"><span class="eyebrow">Fechamento do dossiê</span><h2>${esc(p.titulo)}</h2><div class="big">${acertos}/${total}</div><p class="lead">${esc(p.revelacao)}</p><div class="quote">A verdade não mudou. Mudou a pergunta — e, com ela, o que precisava ser demonstrado.</div><div class="toolbar"><button class="btn btn-gold" id="outra">Nova investigação</button><button class="btn btn-ghost" id="rever">Rever dossiê</button></div></section></main>`;$("#outra").onclick=()=>{partida=proxima();fase="inicio";analisadas=[];modsFeitos=[];respostas={};salvar();render()};$("#rever").onclick=()=>{fase="dossie";salvar();render()};}
function render(){if(fase==="inicio")renderInicio();else if(fase==="dossie")renderDossie();else if(fase==="decisao")renderDecisao();else if(fase==="resultado")finalizar();}
fetch("../v1/casos/casa-da-costa.json?v=20260830-auto").then(r=>r.ok?r.json():Promise.reject()).then(c=>{CASO=c;carregar();render()}).catch(()=>{app().innerHTML='<main class="stage shell"><h2>Não foi possível abrir o caso.</h2><p class="lead">Recarregue quando a conexão estiver disponível.</p></main>'});
window.MosaicoNoite={fecharModulo};
})();