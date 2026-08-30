(function(){
"use strict";
const FALLBACK={
  titulo:"A Casa da Costa", subtitulo:"A Noite da Tempestade", perguntaPadrao:"sete",
  partidas:{
    sete:{titulo:"Sete dentro da casa",natureza:"QUANTO + ONDE",pergunta:"Seis pessoas atravessaram o portão. Quantas estavam dentro da casa?",principal:"contagemReal",campos:[
      {id:"contagemDeclarada",rotulo:"Contagem declarada",opcoes:["5","6","7","8"],resposta:"6"},
      {id:"contagemReal",rotulo:"Contagem real",opcoes:["6","7","8","Não é possível determinar"],resposta:"7"},
      {id:"sinaisCasa",rotulo:"Sinais atribuíveis à casa",opcoes:["Estalos do sótão e cortina","Respiração e sombra","Colher e cadeira morna","Pegadas e xícaras"],resposta:"Estalos do sótão e cortina"},
      {id:"sinaisCorpo",rotulo:"Sinais que exigem um corpo",opcoes:["Degrau, respiração, sombra e colher","Estalos, vento e umidade","Cortina, disjuntor e caixa de passagem","Névoa, chuva e rangidos gerais"],resposta:"Degrau, respiração, sombra e colher"},
      {id:"localizacao",rotulo:"Onde estava a pessoa a mais?",opcoes:["Quarto de serviço atrás do jardim interno","Farol","Anexo do caseiro","Porão sob o cofre"],resposta:"Quarto de serviço atrás do jardim interno"},
      {id:"duracao",rotulo:"Há quanto tempo?",opcoes:["Desde aquela tarde","Quarenta minutos","Cinco meses","Catorze meses"],resposta:"Cinco meses"},
      {id:"confirmacao",rotulo:"O que fecha a contagem?",opcoes:["Sete xícaras + ausência seletiva de poeira","A porta do cofre entreaberta","A queda de energia","A janela trancada"],resposta:"Sete xícaras + ausência seletiva de poeira"}],
      revelacao:"Entraram seis pelo portão. Estavam sete dentro da casa. A sétima pessoa não entrou naquela noite — nunca saiu."},
    cinco:{titulo:"Cinco meses",natureza:"HÁ QUANTO TEMPO",pergunta:"Desde quando alguém permanece na Casa da Costa?",principal:"duracao",campos:[
      {id:"duracao",rotulo:"Duração da permanência",opcoes:["Uma noite","Duas semanas","Cinco meses","Catorze meses"],resposta:"Cinco meses"},
      {id:"marco",rotulo:"Marco inicial",opcoes:["O falecimento do antigo dono","O anúncio do inventário","O início da tempestade","A primeira visita do Morador"],resposta:"O falecimento do antigo dono"},
      {id:"consumo",rotulo:"Registro que sustenta continuidade",opcoes:["Hidrômetro com consumo diário","Relógio da sala","Cofre entreaberto","Queda em três casas"],resposta:"Hidrômetro com consumo diário"},
      {id:"rotina",rotulo:"Outro sinal de rotina",opcoes:["Boiler acionado fora das visitas do Morador","Janela fechada","Envelope lacrado","Luz religada às 21h31"],resposta:"Boiler acionado fora das visitas do Morador"},
      {id:"domestico",rotulo:"Sinais domésticos",opcoes:["Xícaras, poeira e despensa","Cofre, chave e envelope","Raio, névoa e vento","Carros, portão e relógio"],resposta:"Xícaras, poeira e despensa"}],
      revelacao:"Os sinais de ocupação não nasceram naquela noite. Eles atravessam os cinco meses desde o falecimento do antigo dono."},
    apagao:{titulo:"Os 2 minutos e 2 segundos",natureza:"COMO",pergunta:"Como uma pessoa atravessou a casa durante o apagão sem ser identificada?",principal:"movimento",campos:[
      {id:"movimento",rotulo:"O que aconteceu no escuro?",opcoes:["Uma pessoa já dentro da casa atravessou corredor e sala","Alguém entrou pela janela","O Morador desligou a energia e abriu o cofre","Ninguém se moveu; tudo foi estrutural"],resposta:"Uma pessoa já dentro da casa atravessou corredor e sala"},
      {id:"inicio",rotulo:"Onde o deslocamento começa?",opcoes:["Vão do sótão","Portão principal","Cozinha","Farol"],resposta:"Vão do sótão"},
      {id:"fim",rotulo:"Para onde ela segue?",opcoes:["Porta do jardim / quarto de serviço","Cofre","Portão principal","Anexo do caseiro"],resposta:"Porta do jardim / quarto de serviço"},
      {id:"sinais",rotulo:"O que acompanha o trajeto?",opcoes:["Respiração, sombra e colher chutada","Somente estalos do sótão","Abertura da janela","Disjuntor desligado"],resposta:"Respiração, sombra e colher chutada"},
      {id:"apagao",rotulo:"Quem provocou o apagão?",opcoes:["Ninguém dentro da casa","A Sétima","O Morador","A Herdeira"],resposta:"Ninguém dentro da casa"}],
      revelacao:"A escuridão não foi produzida para esconder o trajeto. Foi um evento da tempestade que a Sétima reconheceu e aproveitou."},
    nome:{titulo:"O nome",natureza:"QUEM",pergunta:"De quem é o nome que a secretária eletrônica reproduziu às 21h31?",principal:"identidade",campos:[
      {id:"identidade",rotulo:"A quem o nome pertence?",opcoes:["À antiga acompanhante do proprietário","À Herdeira","Ao Morador","Ao antigo zelador"],resposta:"À antiga acompanhante do proprietário"},
      {id:"fonte",rotulo:"De onde vem o nome?",opcoes:["Última mensagem gravada pelo antigo dono","Ligação feita naquela noite","Relatório policial","Contrato lido em voz alta"],resposta:"Última mensagem gravada pelo antigo dono"},
      {id:"documento",rotulo:"O que liga o nome a uma pessoa real?",opcoes:["Registro de pagamentos de acompanhante","Registro do cofre","Conta de energia","Lista de convidados"],resposta:"Registro de pagamentos de acompanhante"},
      {id:"periodo",rotulo:"Quando os pagamentos cessaram?",opcoes:["Cinco meses atrás","Naquela manhã","Catorze meses atrás","Às 21h31"],resposta:"Cinco meses atrás"}],
      revelacao:"A gravação não era uma voz impossível. Era uma mensagem antiga reativada com o retorno da energia; o nome coincide com o registro da acompanhante."},
    corpo:{titulo:"Casa, corpo ou assombração?",natureza:"QUAL / QUE TIPO",pergunta:"Quais fenômenos eram da própria casa e quais exigiam uma presença humana?",principal:"leitura",campos:[
      {id:"leitura",rotulo:"Leitura final",opcoes:["Parte era a casa; parte exigia um corpo","Tudo era assombração","Tudo era estrutura e tempestade","Tudo foi encenado pelos seis"],resposta:"Parte era a casa; parte exigia um corpo"},
      {id:"estrutura",rotulo:"Fenômenos estruturais",opcoes:["Estalos do sótão, umidade e cortina","Respiração, sombra e cadeira morna","Pegadas, colher e degrau","Xícaras, contrato e hidrômetro"],resposta:"Estalos do sótão, umidade e cortina"},
      {id:"corpo",rotulo:"Fenômenos que exigem corpo",opcoes:["Degrau sob carga, respiração, sombra e cadeira morna","Higrômetro, vento e caixa de passagem","Cortina, chuva e disjuntor","Religamento, envelope e cofre"],resposta:"Degrau sob carga, respiração, sombra e cadeira morna"},
      {id:"cofre",rotulo:"O cofre prova o quê?",opcoes:["Nada foi furtado; a porta estava apenas encostada","Houve invasão","A Herdeira roubou o envelope","O apagão foi provocado"],resposta:"Nada foi furtado; a porta estava apenas encostada"}],
      revelacao:"A hipótese 'só a casa' estava correta para parte dos fenômenos — e justamente por isso era uma armadilha quando usada para explicar tudo."},
    perceber:{titulo:"Quem deveria ter percebido?",natureza:"QUEM COMPOSTO",pergunta:"Quem teve oportunidade de perceber a ocupação e por que ela permaneceu invisível?",principal:"cadeia",campos:[
      {id:"cadeia",rotulo:"O que melhor explica a falha coletiva?",opcoes:["Sinais verdadeiros foram atribuídos a causas isoladas","Todos sabiam e esconderam","A casa apagava provas","A Sétima possuía todas as chaves"],resposta:"Sinais verdadeiros foram atribuídos a causas isoladas"},
      {id:"morador",rotulo:"Por que o Morador não percebeu?",opcoes:["Atribuía a limpeza ao próprio cuidado","Nunca entrava na casa","Não conhecia o quarto de serviço","Estava fora da cidade por cinco meses"],resposta:"Atribuía a limpeza ao próprio cuidado"},
      {id:"familia",rotulo:"O que a família deixou de verificar?",opcoes:["A saída efetiva da acompanhante após o falecimento","A existência do cofre","O horário do apagão","O funcionamento da janela"],resposta:"A saída efetiva da acompanhante após o falecimento"},
      {id:"grupo",rotulo:"O que o grupo fez naquela noite?",opcoes:["Interpretou sinais antes de recontar pessoas e relações","Contou sete ao entrar","Encontrou o quarto de serviço imediatamente","Provou uma invasão"],resposta:"Interpretou sinais antes de recontar pessoas e relações"}],
      revelacao:"Ninguém precisava mentir para que a presença passasse despercebida. Cada sinal verdadeiro recebeu uma explicação local suficientemente confortável."}
  }
};
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
 {id:"F13",t:"O consumo",x:"O hidrômetro registra consumo diário contínuo nos cinco meses em que a casa esteve 'vazia'.",m:[39,72]},
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
const MODULOS={
 sete:["janela","escuro","sala"], cinco:["vidro","escuro"], apagao:["sala","escuro","janela"], nome:["vidro","escuro"], corpo:["vidro","sala","janela"], perceber:["escuro","vidro"]
};
const MODINFO={
 janela:{titulo:"A Janela do Norte",file:"modulos/janela-do-norte.html",desc:"A sombra permanece, mas sua função muda: presença, não entrada."},
 sala:{titulo:"A Sala às Escuras",file:"modulos/sala-as-escuras.html",desc:"Reconstrua 21h29–21h31 pelas posições, respiração, sombra e objeto deslocado."},
 vidro:{titulo:"O Vidro Embaçado",file:"modulos/vidro-embacado.html",desc:"Procure sinais de uso continuado numa casa que deveria estar vazia."},
 escuro:{titulo:"O Mapa do Escuro",file:"modulos/mapa-do-escuro.html",desc:"Use o espaço para ligar cômodos, trajetos e pontos que não fecham com a contagem."}
};
let CASO=FALLBACK, partida="", fase="inicio", analisadas=[], modsFeitos=[], respostas={}, inicioTurno=0, limite=60, timer=null;
const $=s=>document.querySelector(s), app=()=>$("#app");
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function salvar(){try{localStorage.setItem("mosaico_noite_costa",JSON.stringify({partida,fase,analisadas,modsFeitos,respostas,limite}));}catch(e){}}
function carregar(){try{let s=JSON.parse(localStorage.getItem("mosaico_noite_costa")||"null");if(s&&s.partida){partida=s.partida;fase=s.fase||"dossie";analisadas=s.analisadas||[];modsFeitos=s.modsFeitos||[];respostas=s.respostas||{};limite=s.limite||60;}}catch(e){}}
function pergunta(){return (CASO.partidas||{})[partida]||null;}
function renderInicio(){let ps=CASO.partidas||{};app().innerHTML=`<section class="hero shell"><span class="eyebrow">MOSAICO · A NOITE</span><h1>A Casa da Costa</h1><p class="lead">O levantamento terminou. Agora os fatos precisam sustentar uma conclusão.</p><div class="quote">A Mesa pergunta o que você consegue descobrir. <b>A Noite pergunta o que os fatos permitem sustentar.</b></div><h2>Qual problema será fechado nesta reunião?</h2><div class="grid partidas">${Object.entries(ps).map(([id,p])=>`<button class="partida ${partida===id?'on':''}" data-p="${id}"><b>${esc(p.titulo)}</b><small>${esc(p.natureza)}</small><span>${esc(p.pergunta)}</span></button>`).join("")}</div><div class="toolbar"><button class="btn btn-ghost" data-ritmo="60">Calma · 60 s</button><button class="btn btn-ember" data-ritmo="30">Sob pressão · 30 s</button><button class="btn btn-gold" id="comecar" ${partida?'':'disabled'}>Abrir dossiê</button></div></section>`;
 document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{partida=b.dataset.p;renderInicio()});document.querySelectorAll('[data-ritmo]').forEach(b=>b.onclick=()=>{limite=Number(b.dataset.ritmo);document.querySelectorAll('[data-ritmo]').forEach(x=>x.style.outline='');b.style.outline='2px solid var(--gold2)';});let c=$("#comecar");if(c)c.onclick=()=>{fase="dossie";analisadas=[];modsFeitos=[];respostas={};salvar();render();};}
function selecionadas(){let ids=new Set(analisadas);return EVIDENCIAS.filter(e=>ids.has(e.id));}
function markers(){return selecionadas().map(e=>`<span class="marker x" style="left:${e.m[0]}%;top:${e.m[1]}%" title="${e.id} · ${esc(e.t)}"></span>`).join("");}
function fatosHtml(){let lista=selecionadas();return lista.length?lista.map(e=>`<div class="fact"><strong>${e.id} · ${esc(e.t)}</strong><p>${esc(e.x)}</p></div>`).join(""):`<p class="lead">Nenhum fragmento foi incorporado ainda. Abra evidências ou execute um módulo.</p>`;}
function modulosHtml(){return (MODULOS[partida]||[]).map(id=>{let m=MODINFO[id],done=modsFeitos.includes(id);return `<div class="tool ${done?'done':''}"><b>${esc(m.titulo)}</b><p>${esc(m.desc)}</p><button class="btn ${done?'btn-ghost':'btn-ember'}" data-mod="${id}">${done?'Reabrir':'Abrir atividade'}</button></div>`}).join("");}
function relacoesHtml(){let n=analisadas.length;return RELACOES.filter((r,i)=>i<Math.max(1,Math.floor(n/2))).map(r=>`<div class="rel"><b>${r[0]} · ${esc(r[1])}</b><br>${esc(r[2])}</div>`).join("");}
function renderDossie(){let p=pergunta();app().innerHTML=`<main class="stage shell"><div class="question"><b>Pergunta-mãe · ${esc(p.natureza)}</b><p>${esc(p.pergunta)}</p></div><div class="statusline"><span class="chip">Dossiê: ${analisadas.length}/${EVIDENCIAS.length}</span><span class="chip">Módulos: ${modsFeitos.length}/${(MODULOS[partida]||[]).length}</span><span class="chip">Ritmo: ${limite}s</span></div><section class="dossie"><div class="dossie-head"><h3>Memória do caso</h3><button class="btn btn-ghost" id="novaPista">Incorporar fragmento</button></div><div class="facts">${fatosHtml()}</div></section><h2>Ferramentas da reunião</h2><div class="grid modules">${modulosHtml()}</div><h2>Mapa coletivo</h2><div class="mapwrap"><img src="../v1/img/casa-da-costa-planta-1867.svg" alt="Planta esquemática da Casa da Costa, construída em 1867">${markers()}</div><h2>Relações sustentáveis</h2><div class="relacoes">${relacoesHtml()}</div><div class="toolbar"><button class="btn btn-gold" id="decidir" ${analisadas.length<5?'disabled':''}>Fechar decisão</button><button class="btn btn-ghost" id="trocar">Trocar pergunta</button></div></main>`;
 $("#novaPista").onclick=incorporar;$("#decidir").onclick=()=>{fase="decisao";inicioTurno=Date.now();salvar();render();};$("#trocar").onclick=()=>{fase="inicio";partida="";salvar();render();};document.querySelectorAll('[data-mod]').forEach(b=>b.onclick=()=>abrirModulo(b.dataset.mod));}
function incorporar(){let restante=EVIDENCIAS.filter(e=>!analisadas.includes(e.id));if(!restante.length)return;let e=restante[Math.floor(Math.random()*restante.length)];analisadas.push(e.id);salvar();renderDossie();}
function abrirModulo(id){let m=MODINFO[id];$("#modal").classList.remove("hide");$("#modal-title").textContent=m.titulo;$("#modframe").src=m.file+"?embed=0&noite=1&partida="+encodeURIComponent(partida);$("#moddone").onclick=()=>{if(!modsFeitos.includes(id))modsFeitos.push(id);for(let i=0;i<2;i++)incorporarSilencioso();salvar();fecharModulo();renderDossie();};}
function incorporarSilencioso(){let restante=EVIDENCIAS.filter(e=>!analisadas.includes(e.id));if(restante.length)analisadas.push(restante[Math.floor(Math.random()*restante.length)].id);}
function fecharModulo(){$("#modal").classList.add("hide");$("#modframe").src="about:blank";}
function renderDecisao(){let p=pergunta();app().innerHTML=`<main class="stage shell"><div class="question"><b>Decisão final</b><p>${esc(p.pergunta)}</p></div><div id="tempo" class="quote">Tempo para sustentar sua conclusão: <b>${limite}s</b></div><div class="fields">${p.campos.map(c=>`<div class="campo"><label>${esc(c.rotulo)}</label><select data-c="${esc(c.id)}"><option value="">Selecione…</option>${c.opcoes.map(o=>`<option ${respostas[c.id]===o?'selected':''}>${esc(o)}</option>`).join("")}</select></div>`).join("")}</div><div class="toolbar"><button class="btn btn-gold" id="enviar">Registrar conclusão</button><button class="btn btn-ghost" id="voltar">Voltar ao dossiê</button></div></main>`;document.querySelectorAll('[data-c]').forEach(s=>s.onchange=()=>{respostas[s.dataset.c]=s.value;salvar();});$("#enviar").onclick=finalizar;$("#voltar").onclick=()=>{fase="dossie";clearInterval(timer);render();};clearInterval(timer);timer=setInterval(()=>{let rest=Math.max(0,limite-Math.floor((Date.now()-inicioTurno)/1000));let t=$("#tempo");if(t)t.innerHTML=`Tempo para sustentar sua conclusão: <b>${rest}s</b>`;if(!rest){clearInterval(timer);finalizar();}},250);}
function finalizar(){clearInterval(timer);let p=pergunta(),total=p.campos.length,acertos=0;p.campos.forEach(c=>{if(respostas[c.id]===c.resposta)acertos++;});fase="resultado";salvar();app().innerHTML=`<main class="stage shell"><section class="result"><span class="eyebrow">Fechamento do dossiê</span><h2>${esc(p.titulo)}</h2><div class="big">${acertos}/${total}</div><p class="lead">${esc(p.revelacao)}</p><div class="quote">A verdade não mudou. Mudou a pergunta — e, com ela, o que precisava ser demonstrado.</div><div class="toolbar"><button class="btn btn-gold" id="outra">Jogar outra pergunta</button><button class="btn btn-ghost" id="rever">Rever dossiê</button></div></section></main>`;$("#outra").onclick=()=>{partida="";fase="inicio";analisadas=[];modsFeitos=[];respostas={};salvar();render();};$("#rever").onclick=()=>{fase="dossie";render();};}
function render(){if(fase==="inicio")renderInicio();else if(fase==="dossie")renderDossie();else if(fase==="decisao")renderDecisao();else if(fase==="resultado")finalizar();}
fetch("../v1/casos/casa-da-costa.json?v=20260830-canonico").then(r=>r.ok?r.json():Promise.reject()).then(c=>{if(c&&c.partidas)CASO=c;carregar();render();}).catch(()=>{carregar();render();});
window.MosaicoNoite={fecharModulo};
})();