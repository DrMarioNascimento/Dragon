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
 window.MosaicoSoloBots={active:true,bots:BOTS,events:[],log(type,data={}){this.events.push({at:Date.now(),type,...data})}};
 let turnKey='',acted=false,targetElapsed=0,startSeconds=0;
 function slotFrom(s){const m=/^Arquivo\s+(\d+)$/i.exec(s||'');return m?+m[1]:0}
 function seconds(){const s=document.getElementById('turnTimer')?.textContent||'';const m=/(\d+):(\d+)/.exec(s);return m?(+m[1]*60)+(+m[2]):0}
 function botFor(slot){return BOTS.find(b=>b.slot===slot)}
 function updateOpponent(bot){const card=[...document.querySelectorAll('#opponents .opponent')][bot.slot-2];if(!card)return false;const title=card.querySelector('b'),status=card.querySelector('span');if(title)title.textContent=bot.name;if(status)status.textContent=`${bot.fragments} fragmentos · ${bot.hypothesis}`;return true}
 function refreshNames(){BOTS.forEach(updateOpponent)}
 function choose(bot){const r=Math.random();if(bot.profile==='analítico'||bot.profile==='documental'){if(bot.coins>=4&&r<.55)return'buy';if(bot.coins>=3)return'risk'}if(bot.profile==='cauteloso'){if(bot.coins>=4&&r<.65)return'buy';return'observe'}if(bot.profile==='impulsivo'){if(bot.coins>=3&&r<.7)return'risk';if(bot.coins>=2)return'capture'}if(bot.profile==='explorador'){if(bot.coins>=2&&r<.55)return'capture';if(bot.coins>=4)return'buy'}if(bot.profile==='revisionista'){if(bot.actions>1&&bot.coins>=3)return'risk';if(bot.coins>=4)return'buy'}if(bot.profile==='intuitivo'){if(bot.coins>=3&&r<.55)return'risk';if(bot.coins>=4)return'buy'}return'observe'}
 function act(bot,elapsed){const kind=choose(bot);let label='observou até o fim';if(kind==='buy'){bot.coins-=4;bot.fragments++;label='comprou um fragmento'}else if(kind==='risk'){bot.coins-=3;bot.hypothesis=bot.actions>1?'revisando hipótese':'testando um campo';label='arriscou uma conclusão'}else if(kind==='capture'){bot.coins-=2;label='tentou uma captura'}bot.actions++;updateOpponent(bot);window.MosaicoSoloBots.log('bot-action',{slot:bot.slot,bot:bot.name,profile:bot.profile,action:label,elapsed,hand:startSeconds});}
 function beginTurn(turn,slot,bot){turnKey=turn;acted=false;startSeconds=seconds()||30;const [a,b]=bot.decision,ratio=a+Math.random()*(b-a);targetElapsed=Math.max(1,Math.round(startSeconds*ratio));const hud=document.getElementById('hudTurn');if(hud)hud.textContent=bot.name;window.MosaicoSoloBots.log('bot-thinking',{bot:bot.name,hand:startSeconds,targetElapsed});}
 function tick(){refreshNames();const canonical=document.getElementById('turnPlayer');if(!canonical)return;const turn=canonical.textContent.trim(),slot=slotFrom(turn),hud=document.getElementById('hudTurn');if(slot===1){turnKey=turn;acted=false;if(hud)hud.textContent='Você';return}const bot=botFor(slot);if(!bot)return;if(turn!==turnKey)beginTurn(turn,slot,bot);else if(hud)hud.textContent=bot.name;const left=seconds(),elapsed=Math.max(0,startSeconds-left);if(!acted&&elapsed>=targetElapsed&&left>0){acted=true;act(bot,elapsed)}}
 setInterval(tick,180);window.addEventListener('pagehide',()=>{window.MosaicoSoloBots.active=false});
})();
