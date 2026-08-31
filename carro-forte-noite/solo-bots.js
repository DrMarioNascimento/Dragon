/* MOSAICO — Solo Lab bots. Camada isolada do núcleo multiplayer. */
(function(){
 if(new URLSearchParams(location.search).get('soloLab')!=='1')return;
 const BOTS=[
 {slot:2,name:'Bot Analítico',profile:'analítico',coins:12,fragments:3,actions:0,hypothesis:'em aberto',decision:[.72,.90]},
 {slot:3,name:'Bot Cauteloso',profile:'cauteloso',coins:12,fragments:3,actions:0,hypothesis:'em aberto',decision:[.78,.94]},
 {slot:4,name:'Bot Intuitivo',profile:'intuitivo',coins:12,fragments:3,actions:0,hypothesis:'em aberto',decision:[.48,.72]},
 {slot:5,name:'Bot Impulsivo',profile:'impulsivo',coins:12,fragments:3,actions:0,hypothesis:'em aberto',decision:[.20,.45]},
 {slot:6,name:'Bot Documental',profile:'documental',coins:12,fragments:3,actions:0,hypothesis:'em aberto',decision:[.70,.90]},
 {slot:7,name:'Bot Explorador',profile:'explorador',coins:12,fragments:3,actions:0,hypothesis:'em aberto',decision:[.42,.70]},
 {slot:8,name:'Bot Revisionista',profile:'revisionista',coins:12,fragments:3,actions:0,hypothesis:'em aberto',decision:[.75,.95]}
 ];
 const LAB=window.MosaicoSoloBots={active:true,bots:BOTS,events:[],log(type,data={}){this.events.push({at:Date.now(),type,...data})}};
 let activeSlot=0,armed=false,acted=false,startSeconds=0,targetElapsed=0,lastLeft=null,turnSerial=0;
 function slotFrom(s){const m=/^Arquivo\s+(\d+)$/i.exec(s||'');return m?+m[1]:0}
 function seconds(){const s=document.getElementById('turnTimer')?.textContent||'';const m=/(\d+):(\d+)/.exec(s);return m?(+m[1]*60)+(+m[2]):0}
 function botFor(slot){return BOTS.find(b=>b.slot===slot)}
 function updateOpponent(bot){const card=[...document.querySelectorAll('#opponents .opponent')][bot.slot-2];if(!card)return;const title=card.querySelector('b'),status=card.querySelector('span');if(title)title.textContent=bot.name;if(status)status.textContent=`${bot.fragments} fragmentos · ${bot.hypothesis}`}
 function choose(bot){const r=Math.random();if(bot.profile==='analítico'||bot.profile==='documental'){if(bot.coins>=4&&r<.55)return'buy';if(bot.coins>=3)return'risk'}if(bot.profile==='cauteloso'){if(bot.coins>=4&&r<.65)return'buy';return'observe'}if(bot.profile==='impulsivo'){if(bot.coins>=3&&r<.7)return'risk';if(bot.coins>=2)return'capture'}if(bot.profile==='explorador'){if(bot.coins>=2&&r<.55)return'capture';if(bot.coins>=4)return'buy'}if(bot.profile==='revisionista'){if(bot.actions>1&&bot.coins>=3)return'risk';if(bot.coins>=4)return'buy'}if(bot.profile==='intuitivo'){if(bot.coins>=3&&r<.55)return'risk';if(bot.coins>=4)return'buy'}return'observe'}
 function act(bot,elapsed){const kind=choose(bot);let label='observou';if(kind==='buy'){bot.coins-=4;bot.fragments++;label='comprou um fragmento'}else if(kind==='risk'){bot.coins-=3;bot.hypothesis=bot.actions>1?'revisando hipótese':'testando um campo';label='arriscou uma conclusão'}else if(kind==='capture'){bot.coins-=2;label='tentou uma captura'}bot.actions++;updateOpponent(bot);LAB.log('bot-action',{serial:turnSerial,slot:bot.slot,bot:bot.name,action:label,elapsed,hand:startSeconds})}
 function arm(bot,left){activeSlot=bot.slot;armed=true;acted=false;startSeconds=left;lastLeft=left;turnSerial++;const [a,b]=bot.decision;targetElapsed=Math.max(1,Math.round(startSeconds*(a+Math.random()*(b-a))));LAB.log('bot-thinking',{serial:turnSerial,bot:bot.name,hand:startSeconds,targetElapsed})}
 function tick(){BOTS.forEach(updateOpponent);const turn=document.getElementById('turnPlayer')?.textContent.trim()||'',slot=slotFrom(turn),left=seconds(),hud=document.getElementById('hudTurn');if(slot===1){activeSlot=1;armed=false;acted=false;lastLeft=left;if(hud)hud.textContent='Você';return}const bot=botFor(slot);if(!bot)return;if(hud)hud.textContent=bot.name;
  /* Só arma a decisão quando o cronômetro da NOVA mão estiver realmente carregado em 30 ou 60. */
  const validStart=left===30||left===60;
  const timerReset=lastLeft!==null&&left>lastLeft;
  if(slot!==activeSlot){activeSlot=slot;armed=false;acted=false;lastLeft=left}
  if(!armed&&(validStart||timerReset)){const duration=left>=46?60:30;arm(bot,duration)}
  if(!armed){lastLeft=left;return}
  const elapsed=Math.max(0,startSeconds-left);
  if(!acted&&left>0&&elapsed>=targetElapsed){acted=true;act(bot,elapsed)}
  if(!acted&&left===0){acted=true;LAB.log('bot-timeout',{serial:turnSerial,slot:bot.slot,bot:bot.name,hand:startSeconds});}
  lastLeft=left;
 }
 setInterval(tick,120);window.addEventListener('pagehide',()=>{LAB.active=false});
})();
