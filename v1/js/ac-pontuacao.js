(function(global){
 'use strict';
 const evidence=['chave-exterior','chave-terreo','passagem-sob-despensa'];
 function validar(r){return r&&r.version===1&&typeof r.sala==='string'&&typeof r.runId==='string'&&Number.isInteger(r.vela)&&r.vela>=0&&r.vela<=30&&Number.isInteger(r.chaves)&&r.chaves>=6&&r.chaves<=24&&JSON.stringify(r.evidence)===JSON.stringify(evidence);}
 function etapasConfirmadas(e){
   if(!e)return {vela:0,chaves:0};
   const n=e.evidence?.length;
   if(typeof e.velaConcluida!=='boolean'||!Number.isInteger(e.vela)||e.vela<0||e.vela>30||(!e.velaConcluida&&e.vela!==0)||!Array.isArray(e.evidence)||n>3||JSON.stringify(e.evidence)!==JSON.stringify(evidence.slice(0,n))||!Number.isInteger(e.chaves)||e.chaves<2*n||e.chaves>8*n||(n>0&&!e.velaConcluida))throw Error('Etapas cooperativas inconsistentes.');
   return {vela:e.vela,chaves:e.chaves};
 }
 function apurar(tarefas,resultados){
   const out={},seen=new Set();
   for(const t of [...tarefas].sort((a,b)=>Number(Boolean(b.concluidoEm||b.status==='concluida'))-Number(Boolean(a.concluidoEm||a.status==='concluida')))){
     if(!t.concluidoEm&&t.status!=='concluida'){
       const k=t.jogadorId+'|'+t.runId;if(seen.has(k))continue;seen.add(k);
       const rows=resultados.filter(r=>r.kind==='individual'&&r.runId===t.runId&&Object.values(r.players||{}).includes(t.jogadorId));
       if(rows.length>1)throw Error('Registro individual ambíguo.');
       if(rows.length){const r=rows[0],role=Object.keys(r.players).find(k=>r.players[k]===t.jogadorId),p=r.salaIndividual?.[role]?.pontos??0;
         if(!Number.isInteger(p)||p<0||p>9)throw Error('Registro individual inválido.');
         out[t.jogadorId]??={vela:0,chaves:0,salaEscura:0};out[t.jogadorId].salaEscura=(out[t.jogadorId].salaEscura||0)+p;const earned=etapasConfirmadas(r.etapas);out[t.jogadorId].vela+=earned.vela;out[t.jogadorId].chaves+=earned.chaves;}
       continue;
     }
     const id=t.jogadorId,run=t.runId,k=id+'|'+run;if(seen.has(k))continue;seen.add(k);
     const matches=resultados.filter(r=>validar(r)&&r.runId===run&&Object.values(r.players||{}).includes(id));
     if(matches.length!==1)throw Error('Resultado da dupla ausente ou ambíguo. A apuração não foi encerrada.');
     const r=matches[0];out[id]??={vela:0,chaves:0};out[id].vela+=r.vela;out[id].chaves+=r.chaves;
     if(r.salaIndividual&&Object.keys(r.salaIndividual).length){
       const role=Object.keys(r.players).find(role=>r.players[role]===id),own=r.salaIndividual[role];
       if(!own||!Number.isInteger(own.pontos)||own.pontos!==9)throw Error('Pontuação individual da sala ausente ou inválida.');
       out[id].salaEscura=(out[id].salaEscura||0)+own.pontos;
     }
   }
   return out;
 }
 async function carregar(tarefas,ativo){
   if(!ativo)return {};
   const ts=tarefas.filter(t=>String(t.runId||'').includes('-salaEscura-'));
   const rows=[];
   for(const run of new Set(ts.map(t=>t.runId))){const r=await (globalThis.ACFetch||fetch)('/api/ac/results?'+new URLSearchParams({run}));if(!r.ok)throw Error('Reconecte o servidor da AC antes de encerrar a apuração.');const data=await r.json();if(!Array.isArray(data))throw Error('Resposta inválida do servidor da AC.');rows.push(...data);const individual=await (globalThis.ACFetch||fetch)('/api/ac/individual?'+new URLSearchParams({run}));if(!individual.ok)throw Error('Reconecte para recuperar os pontos individuais.');const partial=await individual.json();if(!Array.isArray(partial))throw Error('Registro individual inválido.');rows.push(...partial);}
   return apurar(ts,rows);
 }
 function aplicar(placar,pontos){return placar.map(l=>{const p=pontos[l.id];if(!p)return l;const componentes={...l.componentes,vela:p.vela,chaves:p.chaves,...(p.salaEscura!==undefined?{salaEscura:p.salaEscura}:{})};return {...l,componentes,total:Object.values(componentes).reduce((s,n)=>s+n,0)};}).sort((a,b)=>b.total-a.total||String(a.nome).localeCompare(String(b.nome)));}
 global.ACPontuacao={validar,apurar,carregar,aplicar};
})(typeof window==='undefined'?globalThis:window);
