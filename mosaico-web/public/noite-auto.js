/* MOSAICO — A Casa da Costa · A NOITE
   Edição Técnica Consolidada (02/09/2026), §13 a §20.

   A reunião de fechamento passou a gastar o banco modular que mora em
   v1/casos/casa-da-costa.json: F01–F36 com função declarada, hipóteses
   concorrentes H1–H10, relações R1–R10 e proteção de fechamento por terços.

   O que mudou de verdade, e por quê:

   1. O dossiê deixou de ser sorteio uniforme. "Incorporar fragmento" pegava
      qualquer um dos dezoito, então a mesa podia receber contrato, hidrômetro
      e xícaras nos três primeiros toques e fechar a contagem antes de existir
      discussão. Agora a seleção é por função e por pergunta (§20), e a ordem
      obedece aos terços: nenhuma pista de fechamento no primeiro, no máximo
      duas no segundo (§18).

   2. O dossiê cresce pelas ATIVIDADES, não por um botão. O segundo terço abre
      quando a mesa executa uma atividade sensorial; o terceiro, quando executa
      todas. Fragmento que ninguém foi buscar não entra por outra porta — é o
      que faz o gesto custar alguma coisa.

   3. Relação só aparece quando as peças dela estão em mesa, e hipótese que a
      evidência contraria aparece riscada. Antes as relações eram um texto
      solto exibido por contagem (n/2), o que descrevia a conclusão sem que a
      mesa tivesse as peças.

   O banco é fonte única. Se o JSON vier velho, sem `fragmentos`, a lista
   embutida abaixo mantém a página em pé — mas ela é rede de segurança, não
   segunda verdade.

   CUIDADO AO PUBLICAR: este arquivo é escrito à mão e mora em v2/, que o
   `npm run publicar` APAGA INTEIRO antes de copiar o build. Ele já foi perdido
   assim uma vez. Se sumir, está no git. */
(function(){
"use strict";
const ORDEM=["sete","cinco","apagao","nome","corpo","perceber"];
const CHAVE_ROT="mosaico_casa_ultima_partida_noite";
const CHAVE_ESTADO="mosaico_noite_costa_auto";

/* Rede de segurança: só entra se o caso publicado ainda não trouxer o banco. */
const EVIDENCIAS_ANTIGAS={
 F01:{h:"22:40",t:"As xícaras",d:"Sete xícaras limpas secando na pia. Seis pessoas do grupo beberam chá naquela noite.",f:"estrutural",m:[37,70]},
 F02:{h:"21:24",t:"Ausência de poeira",d:"Cozinha e corredor sem poeira; os demais cômodos guardam cinco meses de abandono.",f:"relacional",m:[47,68]},
 F04:{h:"21:21",t:"O quarto degrau",d:"Range sob peso. Às 21h21 e às 23h40, ninguém do grupo estava na escada.",f:"relacional",m:[55,66]},
 F06:{h:"21:29–21:31",t:"A respiração",d:"A Jornalista sente respiração próxima em ponto onde nenhum dos outros cinco estava.",f:"interpretativo",m:[56,58]},
 F09:{h:"—",t:"O contrato",d:"Registro de pagamentos a uma acompanhante por catorze meses, encerrado há cinco meses.",f:"estrutural",m:[70,45]},
 F10:{h:"23:05",t:"As pegadas",d:"No jardim interno, um par de pegadas entra e não sai.",f:"estrutural",m:[48,52]},
 F13:{h:"—",t:"O consumo",d:"O hidrômetro registra consumo diário contínuo nos cinco meses em que a casa esteve vazia.",f:"estrutural",m:[39,72]},
 F15:{h:"06:50",t:"Queda em rede",d:"A concessionária registra interrupção às 21h29 em três unidades da encosta.",f:"estrutural",m:[50,44]},
 F16:{h:"08:20",t:"O disjuntor",d:"A chave geral permaneceu ligada; não há sinal de acionamento manual.",f:"relacional",m:[52,46]},
 F20:{h:"21:36",t:"Cofre e relógio",d:"A porta estava encostada e nada foi subtraído; o relógio de corda travou às 21h29.",f:"interpretativo",m:[62,73]}
};

const MODULOS={sete:["janela","escuro","sala"],cinco:["vidro","escuro"],apagao:["sala","escuro","janela"],nome:["vidro","escuro"],corpo:["vidro","sala","janela"],perceber:["escuro","vidro"]};
const MODINFO={
 janela:{titulo:"A Janela do Norte",file:"modulos/janela-do-norte.html",desc:"A sombra permanece, mas sua função muda: presença, não entrada."},
 sala:{titulo:"A Sala às Escuras",file:"modulos/sala-as-escuras.html",desc:"Reconstrua 21h29–21h31 pelas posições, respiração, sombra e objeto deslocado."},
 vidro:{titulo:"O Vidro Embaçado",file:"modulos/vidro-embacado.html",desc:"Procure sinais de uso continuado numa casa que deveria estar vazia."},
 escuro:{titulo:"O Mapa do Escuro",file:"modulos/mapa-do-escuro.html",desc:"Use o espaço para ligar cômodos, trajetos e pontos que não fecham com a contagem."}
};
const TERCO_ROT=["Primeiro terço","Segundo terço","Terço final"];
const FUNCAO_ROT={estrutural:"estrutural",relacional:"relacional",interpretativo:"interpretativo",contextual:"contextual"};

let CASO=null,partida="",fase="inicio",duracao="padrao",dossie=[],tercos=[[],[],[]],aberto=1,
    modsFeitos=[],respostas={},inicioTurno=0,limite=60,timer=null;
const $=s=>document.querySelector(s),app=()=>$("#app");
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

function banco(){return (CASO&&CASO.fragmentos)||EVIDENCIAS_ANTIGAS;}
function relacoes(){return (CASO&&CASO.relacoes)||[];}
function hipoteses(){return (CASO&&CASO.hipoteses)||[];}
function selecao(){return (CASO&&CASO.selecao&&CASO.selecao[partida])||{centrais:[],incidentais:[]};}
function duracoes(){return (CASO&&CASO.duracoes)||{padrao:{n:18,rel:4,rot:"Padrão",nota:""}};}
function cfgDuracao(){const d=duracoes();return d[duracao]||d.padrao||Object.values(d)[0];}
function fecho(c){const b=banco();return !!(b[c]&&b[c].fecho);}

function valida(id){return !!(CASO&&CASO.partidas&&CASO.partidas[id]);}
function proxima(){let u="";try{u=localStorage.getItem(CHAVE_ROT)||""}catch(e){}let i=ORDEM.indexOf(u);for(let n=1;n<=ORDEM.length;n++){let id=ORDEM[(i+n+ORDEM.length)%ORDEM.length];if(valida(id))return id}return CASO.perguntaPadrao||"sete";}
function marcarUsada(){try{localStorage.setItem(CHAVE_ROT,partida)}catch(e){}}
function salvar(){try{localStorage.setItem(CHAVE_ESTADO,JSON.stringify({partida,fase,duracao,dossie,tercos,aberto,modsFeitos,respostas,limite}))}catch(e){}}
function carregar(){
 try{
  let s=JSON.parse(localStorage.getItem(CHAVE_ESTADO)||"null");
  if(s&&valida(s.partida)&&s.fase&&s.fase!=="inicio"&&Array.isArray(s.tercos)&&s.tercos.length===3){
   partida=s.partida;fase=s.fase;duracao=s.duracao||"padrao";dossie=s.dossie||[];tercos=s.tercos;
   aberto=s.aberto||1;modsFeitos=s.modsFeitos||[];respostas=s.respostas||{};limite=s.limite||60;return;
  }
 }catch(e){}
 partida=proxima();fase="inicio";
}
function pergunta(){return CASO.partidas[partida]||null;}

/* ── Montagem do dossiê (§20) ───────────────────────────────────────────
   Centrais da pergunta primeiro; depois o que falta para fechar o número de
   relações previsto pela duração; o resto por função, com os incidentais da
   pergunta empurrados para o fim. */
function faltantes(rel,tem){return rel.pecas.filter(g=>!g.some(c=>tem[c])).map(g=>g[0]);}
function relacaoCompleta(rel,tem){return faltantes(rel,tem).length===0;}

function montarDossie(){
 const b=banco(),sel=selecao(),cfg=cfgDuracao(),tem={},lista=[];
 const por=c=>{if(b[c]&&!tem[c]){tem[c]=1;lista.push(c)}};
 embaralhar(sel.centrais||[]).forEach(por);

 let garantidas=0;
 relacoes().slice().sort((x,y)=>faltantes(x,tem).length-faltantes(y,tem).length).forEach(rel=>{
  if(garantidas>=cfg.rel)return;
  if(relacaoCompleta(rel,tem)){garantidas++;return}
  faltantes(rel,tem).forEach(por);garantidas++;
 });

 const peso={estrutural:0,interpretativo:.3,relacional:.5,contextual:1.2};
 const incid=sel.incidentais||[];
 embaralhar(Object.keys(b).filter(c=>!tem[c]))
  .sort((x,y)=>(peso[b[x].f]??1)+(incid.includes(x)?2:0)-((peso[b[y].f]??1)+(incid.includes(y)?2:0)))
  .forEach(c=>{if(lista.length<cfg.n)por(c)});

 dossie=lista;tercos=distribuirTercos(lista);aberto=1;
}
function embaralhar(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

/* §18 — o primeiro terço não recebe pista de fechamento e o segundo recebe no
   máximo duas. Sem isso, identidade, duração e localização chegam juntas e a
   reunião acaba antes de a interpretação entrar em disputa. */
function distribuirTercos(lista){
 const lim=(CASO&&CASO.protecao&&CASO.protecao.maxFechoPorTerco)||{primeiro:0,segundo:2};
 const fechos=embaralhar(lista.filter(fecho)),livres=embaralhar(lista.filter(c=>!fecho(c)));
 const tam=Math.ceil(lista.length/3),t=[[],[],[]];
 while(t[0].length<tam&&livres.length)t[0].push(livres.shift());
 for(let i=0;i<(lim.segundo||0)&&fechos.length&&t[1].length<tam;i++)t[1].push(fechos.shift());
 while(t[1].length<tam&&livres.length)t[1].push(livres.shift());
 t[2]=livres.concat(fechos);
 return t.map(embaralhar);
}

/* O terço abre pela atividade executada, não pelo relógio nem por um botão:
   é o gesto da mesa que traz fragmento novo. */
function tercoDisponivel(){
 const total=(MODULOS[partida]||[]).length;
 if(!total)return 3;
 if(modsFeitos.length>=total)return 3;
 if(modsFeitos.length>=1)return 2;
 return 1;
}
function emMesa(){const s={};tercos.slice(0,aberto).forEach(l=>l.forEach(c=>s[c]=1));return s}
function listaEmMesa(){return tercos.slice(0,aberto).reduce((a,l)=>a.concat(l),[])}

function markers(){
 const b=banco();
 return listaEmMesa().filter(c=>b[c]&&b[c].m).map(c=>
  `<span class="marker x" style="left:${b[c].m[0]}%;top:${b[c].m[1]}%" title="${c} · ${esc(b[c].t)}"></span>`).join("");
}
function fatosHtml(){
 const b=banco();
 return tercos.slice(0,aberto).map((lote,i)=>
  `<div class="wave"><small>${TERCO_ROT[i]} · ${lote.length} fragmento${lote.length===1?"":"s"}</small>`+
  lote.map(c=>`<div class="fact f-${esc(b[c].f||"")}"><strong>${c} · ${esc(b[c].t)}</strong><time>${esc(b[c].h||"—")} · ${esc(FUNCAO_ROT[b[c].f]||"")}</time><p>${esc(b[c].d)}</p></div>`).join("")+
  `</div>`).join("");
}
function relacoesHtml(){
 const tem=emMesa(),completas=relacoes().filter(r=>relacaoCompleta(r,tem));
 if(!completas.length)return `<p class="lead">Nenhuma relação fecha ainda. Falta peça em mesa — e nenhuma pista isolada resolve.</p>`;
 return completas.map(r=>`<div class="rel"><b>${esc(r.id)} · ${esc(r.t)}</b><br>${esc(r.efeito)}</div>`).join("");
}
function hipotesesHtml(){
 const tem=emMesa();
 return hipoteses().map(h=>{
  const caiu=(h.enfraquece||[]).some(c=>tem[c]);
  const forca=(h.apoia||[]).filter(c=>tem[c]).length;
  return `<div class="rel hip${caiu?" caiu":""}"><b>${esc(h.id)} · ${esc(h.t)}</b><br>`+
   (caiu?"Contrariada por evidência já aberta.":forca?`Sustentada por ${forca} fragmento${forca===1?"":"s"} em mesa.`:"Ainda sem apoio material.")+
   `</div>`;
 }).join("");
}
/* A MESA FAZ AS ATIVIDADES JUNTA, E NA ORDEM QUE A PERGUNTA DEFINE.
   Antes esta grade dava um "Abrir atividade" a cada uma das três ao mesmo
   tempo, e quem estivesse com o telefone na mão escolhia por qual começar.
   Duas coisas quebravam com isso:

   · a ordem de MODULOS[partida] não é decorativa — ela é o percurso da
     pergunta (em "sete" a Janela vem antes do Escuro, em "apagao" é o
     contrário), e escolher fora de ordem entrega o espaço antes do tempo;
   · cada atividade concluída ABRE UM TERÇO do dossiê. Com três botões
     abertos, a mesa podia abrir dois terços sem nunca ter feito a primeira
     junto — o gesto coletivo virava clique de um só.

   Agora só a PRÓXIMA da fila tem botão. As anteriores ficam marcadas como
   feitas, as seguintes ficam em espera dizendo a sua vez. */
function modulosHtml(){
 const fila=MODULOS[partida]||[];
 const vez=fila.findIndex(id=>!modsFeitos.includes(id));
 return fila.map((id,i)=>{
  const m=MODINFO[id],feita=modsFeitos.includes(id),agora=(i===vez);
  const estado=feita?"done":agora?"agora":"espera";
  const rodape=feita
   ? `<p class="tool-estado">Concluída pela mesa.</p>`
   : agora
    ? `<button class="btn btn-ember" data-mod="${id}">Abrir atividade</button>`
    : `<p class="tool-estado">${i===fila.length-1?"Por último.":i-vez===1?"Depois desta.":`${i-vez}ª na fila.`}</p>`;
  return `<div class="tool ${estado}"><b>${esc(m.titulo)}</b><p>${esc(m.desc)}</p>${rodape}</div>`;
 }).join("");
}

function renderInicio(){
 if(!partida)partida=proxima();
 const p=pergunta(),ds=duracoes();
 app().innerHTML=`<section class="hero shell"><span class="eyebrow">MOSAICO · A NOITE</span><h1>A Casa da Costa</h1>`+
  `<p class="lead">O levantamento terminou. Agora os fatos precisam sustentar uma conclusão.</p>`+
  `<div class="quote">A mesma noite. Os mesmos fatos. <b>O MOSAICO escolheu a pergunta desta reunião.</b></div>`+
  `<div class="question"><b>${esc(p.natureza)} · pergunta-mãe</b><p>${esc(p.pergunta)}</p></div>`+
  `<p class="lead">${esc(p.titulo)}</p>`+
  `<h2>Extensão do dossiê</h2><div class="toolbar">`+
   Object.keys(ds).map(k=>`<button class="btn ${duracao===k?"btn-gold":"btn-ghost"}" data-dur="${k}">${esc(ds[k].rot||k)}</button>`).join("")+
  `</div><p class="muted">${esc(cfgDuracao().nota||"")}</p>`+
  `<h2>Ritmo da decisão</h2><div class="toolbar">`+
   `<button class="btn ${limite===60?"btn-gold":"btn-ghost"}" data-ritmo="60">Calma · 60 s</button>`+
   `<button class="btn ${limite===30?"btn-gold":"btn-ember"}" data-ritmo="30">Sob pressão · 30 s</button>`+
  `</div>`+
  `<div class="toolbar"><button class="btn btn-gold" id="comecar">Abrir dossiê</button></div>`+
  `<p class="muted">A próxima investigação receberá automaticamente a pergunta seguinte.</p></section>`;
 document.querySelectorAll("[data-ritmo]").forEach(b=>b.onclick=()=>{limite=Number(b.dataset.ritmo);renderInicio()});
 document.querySelectorAll("[data-dur]").forEach(b=>b.onclick=()=>{duracao=b.dataset.dur;renderInicio()});
 $("#comecar").onclick=()=>{marcarUsada();modsFeitos=[];respostas={};montarDossie();fase="dossie";salvar();render()};
}

function renderDossie(){
 const p=pergunta(),disp=tercoDisponivel(),total=(MODULOS[partida]||[]).length;
 const podeAbrir=aberto<disp;
 const proximoExige=aberto>=disp&&aberto<3
  ? (aberto===1?"Execute uma atividade para o segundo terço abrir.":"Execute as atividades restantes para o terço final abrir.")
  : "";
 app().innerHTML=`<main class="stage shell">`+
  `<div class="question"><b>Pergunta-mãe · ${esc(p.natureza)}</b><p>${esc(p.pergunta)}</p></div>`+
  `<div class="statusline"><span class="chip">Dossiê: ${listaEmMesa().length}/${dossie.length}</span>`+
   `<span class="chip">${esc(cfgDuracao().rot||"")}</span>`+
   `<span class="chip">Atividades: ${modsFeitos.length}/${total}</span>`+
   `<span class="chip">Ritmo: ${limite}s</span></div>`+
  `<section class="dossie"><div class="dossie-head"><h3>Memória do caso</h3>`+
   (podeAbrir?`<button class="btn btn-ghost" id="abrirTerco">Abrir ${TERCO_ROT[aberto].toLowerCase()}</button>`:"")+
   `</div><div class="facts">${fatosHtml()}</div>`+
   (proximoExige?`<p class="muted">${proximoExige}</p>`:"")+
  `</section>`+
  `<h2>Ferramentas da reunião</h2><p class="muted">A mesa faz uma de cada vez, junta, na ordem desta pergunta.</p><div class="grid modules">${modulosHtml()}</div>`+
  `<h2>Mapa coletivo</h2><div class="mapwrap"><img src="../v1/img/casa-da-costa-planta-1867.svg?v=20260902-selo" alt="Planta esquemática da Casa da Costa, construída em 1867">${markers()}</div>`+
  `<h2>Relações que já fecham</h2><div class="relacoes">${relacoesHtml()}</div>`+
  `<h2>Hipóteses concorrentes</h2><div class="relacoes">${hipotesesHtml()}</div>`+
  `<div class="toolbar"><button class="btn btn-gold" id="decidir" ${aberto<2?"disabled":""}>Fechar decisão</button></div>`+
  (aberto<2?`<p class="muted">A decisão abre depois da primeira atividade: fechar com um terço do dossiê é fechar no escuro.</p>`:"")+
  `</main>`;
 const bt=$("#abrirTerco");if(bt)bt.onclick=()=>{if(aberto<tercoDisponivel())aberto++;salvar();renderDossie()};
 $("#decidir").onclick=()=>{fase="decisao";inicioTurno=Date.now();salvar();render()};
 document.querySelectorAll("[data-mod]").forEach(b=>b.onclick=()=>abrirModulo(b.dataset.mod));
}

function abrirModulo(id){
 const m=MODINFO[id];
 $("#modal").classList.remove("hide");
 $("#modal-title").textContent=m.titulo;
 $("#modframe").src=m.file+"?embed=0&noite=1&partida="+encodeURIComponent(partida);
 /* Concluir a atividade não sorteia fragmento: ela LIBERA o próximo terço,
    que já estava montado com a proteção de fechamento aplicada. */
 $("#moddone").onclick=()=>{
  if(!modsFeitos.includes(id))modsFeitos.push(id);
  if(aberto<tercoDisponivel())aberto++;
  salvar();fecharModulo();renderDossie();
 };
}
function fecharModulo(){$("#modal").classList.add("hide");$("#modframe").src="about:blank"}

function renderDecisao(){
 const p=pergunta();
 app().innerHTML=`<main class="stage shell"><div class="question"><b>Decisão final</b><p>${esc(p.pergunta)}</p></div>`+
  `<div id="tempo" class="quote">Tempo para sustentar sua conclusão: <b>${limite}s</b></div>`+
  `<div class="fields">${p.campos.map(c=>`<div class="campo"><label>${esc(c.rotulo)}</label><select data-c="${esc(c.id)}"><option value="">Selecione…</option>${c.opcoes.map(o=>`<option ${respostas[c.id]===o?"selected":""}>${esc(o)}</option>`).join("")}</select></div>`).join("")}</div>`+
  `<div class="toolbar"><button class="btn btn-gold" id="enviar">Registrar conclusão</button><button class="btn btn-ghost" id="voltar">Voltar ao dossiê</button></div></main>`;
 document.querySelectorAll("[data-c]").forEach(s=>s.onchange=()=>{respostas[s.dataset.c]=s.value;salvar()});
 $("#enviar").onclick=finalizar;
 $("#voltar").onclick=()=>{fase="dossie";clearInterval(timer);salvar();render()};
 clearInterval(timer);
 timer=setInterval(()=>{
  const rest=Math.max(0,limite-Math.floor((Date.now()-inicioTurno)/1000)),t=$("#tempo");
  if(t)t.innerHTML=`Tempo para sustentar sua conclusão: <b>${rest}s</b>`;
  if(!rest){clearInterval(timer);finalizar()}
 },250);
}

function finalizar(){
 clearInterval(timer);
 const p=pergunta(),total=p.campos.length,tem=emMesa();
 let acertos=0;p.campos.forEach(c=>{if(respostas[c.id]===c.resposta)acertos++});
 const sel=selecao(),hSobrevive=hipoteses().find(h=>h.id===sel.hipotese);
 const caidas=hipoteses().filter(h=>!h.canonica&&(h.enfraquece||[]).some(c=>tem[c])).map(h=>h.id);
 const abertasRel=relacoes().filter(r=>relacaoCompleta(r,tem)).map(r=>r.id);
 fase="resultado";salvar();
 app().innerHTML=`<main class="stage shell"><section class="result"><span class="eyebrow">Fechamento do dossiê</span>`+
  `<h2>${esc(p.titulo)}</h2><div class="big">${acertos}/${total}</div>`+
  `<p class="lead">${esc(p.revelacao)}</p>`+
  (hSobrevive?`<div class="rel"><b>Hipótese que sobrevive · ${esc(hSobrevive.id)}</b><br>${esc(hSobrevive.t)} — ${esc(hSobrevive.d)}</div>`:"")+
  `<div class="rel"><b>Hipóteses derrubadas nesta mesa</b><br>${caidas.length?esc(caidas.join(" · ")):"Nenhuma. A mesa fechou sem contrariar nenhuma leitura concorrente."}</div>`+
  `<div class="rel"><b>Relações abertas</b><br>${abertasRel.length?esc(abertasRel.join(" · ")):"Nenhuma relação chegou a fechar."}</div>`+
  `<div class="quote">A verdade não mudou. Mudou a pergunta — e, com ela, o que precisava ser demonstrado.</div>`+
  `<div class="toolbar"><button class="btn btn-gold" id="outra">Nova investigação</button><button class="btn btn-ghost" id="rever">Rever dossiê</button></div></section></main>`;
 $("#outra").onclick=()=>{partida=proxima();fase="inicio";dossie=[];tercos=[[],[],[]];aberto=1;modsFeitos=[];respostas={};salvar();render()};
 $("#rever").onclick=()=>{fase="dossie";salvar();render()};
}

function render(){
 if(fase==="inicio")renderInicio();
 else if(fase==="dossie"){if(!dossie.length)montarDossie();renderDossie()}
 else if(fase==="decisao")renderDecisao();
 else if(fase==="resultado")finalizar();
}

/* A folha da Noite já respeita o padrão noturno — `.fact p` é #eef4f8 em 1rem.
   O acréscimo segue a mesma régua: nada de `opacity` em texto (ela derruba o
   contraste sem aparecer no CSS) e tracking curto em corpo pequeno. A hipótese
   derrubada recua pela cor assada e pelo risco, não por transparência. */
const estilo=document.createElement("style");
estilo.textContent=`
 .wave{display:grid;gap:9px;margin-bottom:14px}
 .wave>small{display:block;color:var(--gold);font:800 .7rem/1.2 var(--sans);letter-spacing:.14em;text-transform:uppercase}
 .fact.f-estrutural{border-left-color:var(--gold)}
 .fact.f-relacional{border-left-color:var(--blue)}
 .fact.f-interpretativo{border-left-color:#b79ad6}
 .fact.f-contextual{border-left-color:#8f9aa6}
 .fact time{display:block;color:var(--muted);font:700 .7rem/1.35 var(--sans);letter-spacing:.1em;text-transform:uppercase;margin:1px 0 5px}
 .rel.hip.caiu{border-color:rgba(198,182,159,.22);color:var(--muted)}
 .rel.hip.caiu b{color:var(--muted);text-decoration:line-through}
`;
document.head.appendChild(estilo);

fetch("../v1/casos/casa-da-costa.json?v=20260902-tecnica")
 .then(r=>r.ok?r.json():Promise.reject())
 .then(c=>{CASO=c;carregar();render()})
 .catch(()=>{app().innerHTML='<main class="stage shell"><h2>Não foi possível abrir o caso.</h2><p class="lead">Recarregue quando a conexão estiver disponível.</p></main>'});

window.MosaicoNoite={fecharModulo};
})();
