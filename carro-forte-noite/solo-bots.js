/* MOSAICO — Solo Lab bots. Isolado do núcleo multiplayer. */
(function(){
 if(new URLSearchParams(location.search).get('soloLab')!=='1')return;
 const NAMES=['Helena','Augusto','Lia','Rafael','Beatriz','Caio','Nina'];
 const PROFILES=['analítica','cauteloso','intuitiva','impulsivo','documental','explorador','revisionista'];
 const bots=NAMES.map((name,i)=>({name,profile:PROFILES[i],coins:12,fragments:3,actions:0,hypothesis:'em aberto'}));
 window.MosaicoSoloBots={active:true,bots,events:[],log(type,data={}){this.events.push({at:Date.now(),type,...data})}};
 const human='Arquivo 01';let lastTurn='';
 function botIndex(turn){const m=/Arquivo\s+(\d+)/i.exec(turn||'');if(!m)return-1;const n=+m[1];return n>=2&&n<=8?n-2:-1}
 function updateOpponent(bot,i){const cards=[...document.querySelectorAll('#opponents .opponent')];const card=cards[i];if(!card)return;const b=card.querySelector('b'),s=card.querySelector('span');if(b)b.textContent=`${bot.name} · ${bot.profile}`;if(s)s.textContent=`${bot.fragments} fragmentos · ${bot.hypothesis}`}
 function act(bot,i){if(!bot)return;const r=Math.random();let action='observando';if(r<.42&&bot.coins>=4){bot.coins-=4;bot.fragments++;action='comprou um fragmento'}else if(r<.72&&bot.coins>=3){bot.coins-=3;bot.hypothesis=bot.actions>1?'revisando hipótese':'testando um campo';action='arriscou uma conclusão'}else if(bot.coins>=2){bot.coins-=2;action='tentou uma captura'}bot.actions++;updateOpponent(bot,i);window.MosaicoSoloBots.log('bot-action',{bot:bot.name,action,turn:i+2});}
 function tick(){const el=document.getElementById('turnPlayer');if(!el)return;const turn=el.textContent.trim();if(turn===lastTurn)return;lastTurn=turn;const i=botIndex(turn);if(i>=0){const bot=bots[i];el.textContent=bot.name;const hud=document.getElementById('hudTurn');if(hud)hud.textContent=bot.name;setTimeout(()=>act(bot,i),450+Math.random()*650)}else if(turn===human){const hud=document.getElementById('hudTurn');if(hud)hud.textContent='Você'}}
 setInterval(tick,180);
 window.addEventListener('pagehide',()=>{window.MosaicoSoloBots.active=false});
})();
