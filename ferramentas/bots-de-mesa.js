/* MOSAICO — BOTS DE MESA (bancada)
 * ==========================================================================
 * Sete bots de playtest: nomes, perfis e evidências simuladas, num painel
 * flutuante. Servem para SENTIR uma mesa cheia — densidade de tela, ritmo de
 * alguém mudando de ideia. Não acessam Firebase nem a verdade canônica, não
 * gastam moeda e não ocupam fase: são teatro, não simulação.
 *
 * COMO CARREGAR, desde 02/09/2026:
 * abra o jogo, abra o console do navegador e cole:
 *
 *   var s=document.createElement("script");
 *   s.src="/Dragon/ferramentas/bots-de-mesa.js";
 *   document.body.appendChild(s);
 *
 * e recarregue com ?soloLab=1 na URL.
 *
 * POR QUE NÃO ESTÁ MAIS NA CASCA DO JOGO
 *
 * Ele era carregado por noite-shell.html — publicado, no ar, atrás só de um
 * ?soloLab=1. A regra que ficou: NADA QUE EXISTE SÓ PARA TESTAR É CARREGADO
 * PELA CASCA DO JOGO. Não é o risco desta vez (o portão funcionava): é que
 * artefato de bancada embarcado é exatamente o padrão que já custou caro —
 * bot que vira jogador de mentira, teste que esconde o caminho publicado.
 *
 * E há um limite que este arquivo não vence, por desenho: como as evidências
 * são inventadas e não saem do banco, ele não prova economia nem tempo. Para
 * NÚMERO existe ferramentas/economia-mercado.mjs e
 * ferramentas/duracao-sensorial.mjs, que rodam o código real. Este aqui é só
 * para o feel.
 * ========================================================================*/
(function(){'use strict';const q=new URLSearchParams(location.search);if(q.get('soloLab')!=='1')return;
const NAMES=['Helena','Augusto','Lia','Rafael','Beatriz','Caio','Nina'];const PROFILES=['analítico','cauteloso','intuitivo','impulsivo','documental','explorador','revisionista'];const start=Date.now();
const bots=NAMES.map((nome,i)=>({id:'bot'+(i+1),nome,perfil:PROFILES[i],evidencias:[],hipotese:'em aberto',mudancas:0,tempo:0}));
window.MosaicoSoloLab={active:true,caseId:'casa-da-costa',bots,maxPlayers:8,start,events:[],log(type,data={}){this.events.push({t:Date.now()-start,type,...data})},snapshot(){return {duracaoMs:Date.now()-start,bots:this.bots,events:this.events}}};
function rand(a){return a[Math.floor(Math.random()*a.length)]}function delay(i){return 450+i*170+Math.floor(Math.random()*350)}
function simulateEvidence(){const pool=['presença física','ocupação continuada','apagão externo','acesso pelo jardim','identidade adicional','trajeto incompatível','objeto deslocado'];bots.forEach((b,i)=>setTimeout(()=>{const e=rand(pool.filter(x=>!b.evidencias.includes(x)));b.evidencias.push(e);b.tempo=Date.now()-start;if(b.evidencias.length>=2&&Math.random()>.35){const old=b.hipotese;b.hipotese=b.evidencias.includes('ocupação continuada')?'havia outra pessoa na casa':b.evidencias.includes('apagão externo')?'o apagão foi aproveitado, não causado':'a contagem dos presentes não fecha';if(old!=='em aberto'&&old!==b.hipotese)b.mudancas++}window.MosaicoSoloLab.log('bot-evidencia',{bot:b.nome,evidencia:e,hipotese:b.hipotese})},delay(i)))}
function panel(){if(document.getElementById('soloLabPanel'))return;const d=document.createElement('details');d.id='soloLabPanel';d.style.cssText='position:fixed;z-index:2147482500;top:max(8px,env(safe-area-inset-top));right:8px;width:min(310px,72vw);background:#07131beF;border:1px solid #35556a;border-radius:10px;color:#dcebf1;font:12px Inter,system-ui;box-shadow:0 5px 0 #010305,0 12px 25px #0008';d.innerHTML='<summary style="padding:10px;font-weight:800;cursor:pointer">🧪 SOLO · 8/8</summary><div id="soloLabBody" style="padding:0 10px 10px"></div>';document.body.appendChild(d);setInterval(render,700)}
function render(){const el=document.getElementById('soloLabBody');if(!el)return;el.innerHTML='<b>Você + 7 bots</b><div style="margin:6px 0;color:#91a8b3">Bots conhecem apenas evidências simuladas.</div>'+bots.map(b=>`<div style="padding:6px 0;border-top:1px solid #20333d"><b>${b.nome}</b> · ${b.perfil}<br><span style="color:#9fb5bf">${b.hipotese}</span> · ${b.evidencias.length} evid.</div>`).join('')}
function boot(){panel();simulateEvidence();window.MosaicoSoloLab.log('inicio',{jogadores:8,bots:7});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();