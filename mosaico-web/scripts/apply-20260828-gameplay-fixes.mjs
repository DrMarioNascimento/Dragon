import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "..");
const WEB = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}
function write(rel, text) {
  fs.writeFileSync(path.join(ROOT, rel), text, "utf8");
}
function mustReplace(text, before, after, label) {
  if (!text.includes(before)) throw new Error(`Trecho não encontrado: ${label}`);
  return text.replace(before, after);
}
function mustRegex(text, rx, after, label) {
  if (!rx.test(text)) throw new Error(`Trecho não encontrado: ${label}`);
  return text.replace(rx, after);
}

// ---------------------------------------------------------------------------
// 1) MENU PRINCIPAL: só ações do jogador. Demos continuam no código, mas não
//    ficam expostas no menu público.
// ---------------------------------------------------------------------------
{
  const rel = "mosaico-web/src/routes/index.tsx";
  let s = read(rel);
  s = s.replace('import { NovidadesDemo } from "@/components/game/novidades-demo";\n', "");
  s = s.replace(
    'import { Compass, DoorOpen, Play, Puzzle, QrCode, Volume2, VolumeX } from "lucide-react";',
    'import { DoorOpen, Play, QrCode, Volume2, VolumeX } from "lucide-react";',
  );
  s = s.replace(
    'type Screen = "open" | "menu" | "criar" | "entrar" | "ensaiar" | "como" | "carta" | "novo";',
    'type Screen = "open" | "menu" | "criar" | "entrar" | "ensaiar" | "como" | "carta";',
  );
  s = s.replace('{screen !== "carta" && screen !== "novo" && (', '{screen !== "carta" && (');
  s = mustRegex(
    s,
    /\s*<Button variant="soft" size="lg" onClick=\{\(\) => setScreen\("novo"\)\}>[\s\S]*?Três gestos novos[\s\S]*?<\/Button>/,
    "",
    "botão Três gestos novos",
  );
  s = mustRegex(
    s,
    /\s*<Button\s+variant="ghost"\s+size="lg"\s+onClick=\{\(\) => void nav\(\{ to: "\/noite" \}\)\}[\s\S]*?A lanterna[\s\S]*?<\/Button>/,
    "",
    "botão A lanterna",
  );
  s = mustRegex(
    s,
    /\n\s*\{screen === "novo" && \([\s\S]*?<NovidadesDemo onBack=\{\(\) => setScreen\("menu"\)\} \/>[\s\S]*?\)\}\n/,
    "\n",
    "tela NovidadesDemo",
  );
  write(rel, s);
}

// ---------------------------------------------------------------------------
// 2) VIDRO EMBAÇADO: uma única estrela é o feedback de DIREÇÃO CORRETA.
//    - acerto sobe somente enquanto a água está no alvo;
//    - errou a direção: acerto e brilho drenam;
//    - texto só nasce junto com o brilho, nunca por simples proximidade;
//    - ao máximo: pista completa e a estrela se apaga;
//    - cada pista sorteia outra posição da estrela no céu.
// ---------------------------------------------------------------------------
{
  const rel = "mosaico-web/public/modulos/vidro-embacado.html";
  let s = read(rel);
  s = mustReplace(
    s,
    'var alvo={b:90,g:0}, heat=0, holdStart=null, travado=false;\nvar fila=[], atual=null, feitos=0, revelacao=0;',
    'var alvo={b:90,g:0}, heat=0, holdStart=null, travado=false;\n/* progresso visual: uma única estrela confirma que a água corre na direção certa */\nvar acerto=0, estrelaX=0, estrelaY=0;\nvar fila=[], atual=null, feitos=0, revelacao=0;',
    "estado da estrela",
  );

  s = mustReplace(
    s,
    'function tempestade(tempo,luz){',
    `function desenhaEstrela(){\n  /* Uma única estrela. Não é pista nem alvo fixo: é apenas um feedback\n     progressivo de que a água está correndo na direção correta. */\n  var a=travado ? Math.max(0,1-revelacao*5.5) : Math.pow(acerto,1.15);\n  if(a<0.012) return;\n  var x=estrelaX||W*0.68, y=estrelaY||H*0.23;\n  var r=3+25*a;\n  ctx.save();\n  ctx.globalCompositeOperation="lighter";\n  var g=ctx.createRadialGradient(x,y,0,x,y,r*2.2);\n  g.addColorStop(0,"rgba(255,255,255,"+(0.96*a)+")");\n  g.addColorStop(0.12,"rgba(215,230,255,"+(0.78*a)+")");\n  g.addColorStop(0.42,"rgba(116,128,255,"+(0.30*a)+")");\n  g.addColorStop(1,"rgba(70,80,255,0)");\n  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*2.2,0,6.2832); ctx.fill();\n  ctx.strokeStyle="rgba(235,242,255,"+(0.88*a)+")";\n  ctx.lineWidth=0.7+1.1*a;\n  ctx.shadowColor="rgba(110,125,255,"+(0.9*a)+")";\n  ctx.shadowBlur=8+22*a;\n  var h=5+18*a;\n  ctx.beginPath(); ctx.moveTo(x-h,y); ctx.lineTo(x+h,y); ctx.moveTo(x,y-h); ctx.lineTo(x,y+h); ctx.stroke();\n  ctx.restore();\n}\n\nfunction tempestade(tempo,luz){`,
    "desenho da estrela",
  );

  s = mustReplace(
    s,
    '  var dentro = dB<=TOL_B && dG<=TOL_G && (agora-graca>1400);\n\n  /* gravidade da agua */',
    `  var dentro = dB<=TOL_B && dG<=TOL_G && (agora-graca>1400);\n\n  /* O progresso não nasce da proximidade. Só cresce quando a água está\n     efetivamente correndo na direção correta e drena quando sai dela.\n     Isso impede a pista de aparecer cedo demais. */\n  if(!travado){\n    if(dentro) acerto=Math.min(1,acerto+dt/(IPHONE?2.2:2.5));\n    else acerto=Math.max(0,acerto-dt/1.15);\n    if(acerto>=1) revela();\n  }\n\n  /* gravidade da agua */`,
    "progresso correto/errado",
  );

  s = mustReplace(
    s,
    '  tempestade(tempo,luz);\n\n  /* texto atras do vidro */\n  var vis=travado?1:Math.pow(heat,1.4);',
    `  tempestade(tempo,luz);\n  desenhaEstrela();\n\n  /* O texto acompanha a estrela, não a mera proximidade angular.\n     Começa quase invisível e só fica inteiro quando acerto chega ao máximo. */\n  var pv=Math.max(0,Math.min(1,(acerto-0.14)/0.86));\n  var vis=travado?1:(pv*pv*(3-2*pv));`,
    "visibilidade progressiva da pista",
  );

  s = mustRegex(
    s,
    /  \/\* hold \*\/\n  var dica=document\.getElementById\("dica"\);\n  if\(!travado\)\{[\s\S]*?\n  \}\n\}\n\nfunction anel\(pct\)\{/,
    `  /* feedback verbal mínimo; o indicador principal é a estrela */\n  var dica=document.getElementById("dica");\n  if(!travado){\n    if(dentro){\n      dica.textContent = acerto>0.72 ? "Continue. A direção está certa." : "A água encontrou a direção.";\n    } else {\n      dica.textContent = acerto>0.18 ? "A estrela está se apagando. Corrija a inclinação."\n                       : heat>0.25 ? "A água escorre, mas ainda não é a direção certa."\n                       : "Incline o aparelho. A água obedece.";\n    }\n  }\n}\n\nfunction anel(pct){`,
    "feedback antigo de hold",
  );

  s = mustReplace(
    s,
    '  travado=false; revelacao=0; holdStart=null;\n  graca=performance.now();',
    `  travado=false; revelacao=0; holdStart=null; acerto=0;\n  /* Posição nova em cada pista para não ensinar um ponto fixo da tela.\n     Com semente fixa, permanece determinística para a mesma execução. */\n  var _r1=(typeof sorteio==="function"?sorteio():Math.random());\n  var _r2=(typeof sorteio==="function"?sorteio():Math.random());\n  estrelaX=W*(0.18+_r1*0.64);\n  estrelaY=H*(0.11+_r2*0.23);\n  graca=performance.now();`,
    "nova posição por pista",
  );

  write(rel, s);
}

// ---------------------------------------------------------------------------
// 3) JANELA DO NORTE: fusão de orientação no iPhone com histerese baixa/alta
//    e tolerância mais equilibrada.
// ---------------------------------------------------------------------------
{
  const rel = "mosaico-web/public/modulos/janela-do-norte.html";
  let s = read(rel);

  s = mustReplace(
    s,
    'function folgaMao(){ return CFG.FOLGA*(IPHONE?(iOSInstavel?1.9:1.5):1); }',
    'function folgaMao(){ return CFG.FOLGA*(IPHONE?(iOSInstavel?1.50:1.25):1); }',
    "multiplicador iPhone",
  );

  s = mustRegex(
    s,
    /var temAbsoluto=false;\nfunction onOrient\(e\)\{[\s\S]*?\n  if\(!started\)\{ started=true; \}\n\}/,
    `var temAbsoluto=false;\n/* iPhone: modo baixo usa a bússola compensada; modo alto usa a atitude\n   estabilizada e a bússola apenas como referência lenta de norte.\n   Histerese 12°/8° impede ficar alternando de estratégia com tremor da mão. */\nvar bussOff=null, tOrient=0, rumoSuave=null, modoAlto=false;\nfunction onOrient(e){\n  if(e.alpha===null||e.beta===null||e.gamma===null) return;\n  var iOS=(typeof e.webkitCompassHeading==="number" && !isNaN(e.webkitCompassHeading));\n  var abs=iOS || e.absolute===true || e.type==="deviceorientationabsolute";\n  if(abs) temAbsoluto=true; else if(temAbsoluto) return;\n\n  var v=eulerParaVista(e.alpha,e.beta,e.gamma);\n  raw.elev=v.elev; raw.roll=v.roll;\n\n  if(iOS){\n    iOSInstavel=typeof e.webkitCompassAccuracy==="number" &&\n      (e.webkitCompassAccuracy<0 || e.webkitCompassAccuracy>25);\n    src=iOSInstavel?"bússola instável":"bússola (iOS)";\n\n    var agora=performance.now();\n    var dt=tOrient?Math.min(0.25,(agora-tOrient)/1000):0.016;\n    tOrient=agora;\n\n    /* caminho absoluto conhecido: serve como norte e é alisado antes de\n       alimentar a fusão, para não ensinar ao offset o tremor da agulha */\n    var mundoCru=eulerParaVista(360-e.webkitCompassHeading,e.beta,e.gamma).bearing;\n    if(iosHead==null) iosHead=mundoCru;\n    else iosHead=wrap360(iosHead+wrap180(mundoCru-iosHead)*(iOSInstavel?0.12:0.22));\n    var mundo=iosHead;\n\n    var eraAlto=modoAlto;\n    if(!modoAlto && v.elev>=12) modoAlto=true;\n    else if(modoAlto && v.elev<=8) modoAlto=false;\n\n    if(modoAlto){\n      /* Na entrada do modo alto o offset nasce exatamente sobre o rumo atual:\n         a troca é contínua, sem salto. Depois corrige devagar. */\n      if(!eraAlto || bussOff===null) bussOff=wrap180(mundo-v.bearing);\n      var alvoOff=wrap180(mundo-v.bearing);\n      var erro=wrap180(alvoOff-bussOff);\n      var qualidade=iOSInstavel?0.22:1;\n      if(Math.abs(erro)>35) qualidade*=0.12;\n      bussOff=wrap180(bussOff+erro*(1-Math.pow(0.88,dt*qualidade)));\n    }\n\n    var fundido=modoAlto ? wrap360(v.bearing+bussOff) : mundo;\n    if(rumoSuave===null) rumoSuave=fundido;\n    else {\n      var ganho=modoAlto?0.24:0.30;\n      rumoSuave=wrap360(rumoSuave+wrap180(fundido-rumoSuave)*ganho);\n    }\n    raw.bearing=wrap360(rumoSuave+northOffset);\n  } else {\n    if(abs) src="bússola (absoluta)";\n    else if(src==="nenhuma"||src==="sem sensor") src="relativa — calibre o norte";\n    raw.bearing=wrap360(v.bearing+northOffset);\n  }\n  if(!started){ started=true; }\n}`,
    "fusão/histerese de orientação",
  );

  s = mustReplace(
    s,
    '  return { az: clamp(g.hw/PPD*0.60+8.0, 9.0, 14.0)*folgaMao(),\n           el: clamp(g.hh/PPD*0.30+2.2, 2.8,  4.2)*folgaMao() };',
    `  /* Compensação geométrica suavizada: preserva a geometria ao apontar\n     alto, mas aplica só 70% da abertura teórica e limita o ganho a 1,22.\n     Com os novos fatores do iPhone, o último alvo não fica excessivamente\n     permissivo. */\n  var c=Math.max(0.70,Math.cos(Math.abs(clamp(view.elev,-50,50))*D2R));\n  var geo=Math.min(1.22,1+0.70*(1/c-1));\n  return { az: clamp(g.hw/PPD*0.60+8.0, 9.0, 14.0)*folgaMao()*geo,\n           el: clamp(g.hh/PPD*0.30+2.2, 2.8,  4.2)*folgaMao() };`,
    "tolerância por elevação",
  );

  s = s.replace(
    '  var dist=Math.hypot(dAz,dEl);',
    '  var dist=Math.hypot(dAz*Math.cos(clamp(view.elev,-60,60)*D2R),dEl);',
  );
  write(rel, s);
}

// ---------------------------------------------------------------------------
// 4) SALA ÀS ESCURAS: rodada congela no instante em que o jogador começa.
// ---------------------------------------------------------------------------
{
  const rel = "mosaico-web/public/modulos/sala-as-escuras.html";
  let s = read(rel);
  s = mustReplace(
    s,
    '  if(!sementeManual && roundCode()!==rodadaVista){',
    '  /* Depois que a execução começou, a sala não pode se rearranjar. */\n  if(!sementeManual && !jogando && roundCode()!==rodadaVista){',
    "congelamento imediato da sala",
  );
  write(rel, s);
}

// Validações estáticas antes do build.
const menu = read("mosaico-web/src/routes/index.tsx");
if (menu.includes("Três gestos novos") || menu.includes("A lanterna")) {
  throw new Error("Menu público ainda contém itens de demonstração");
}
const vidro = read("mosaico-web/public/modulos/vidro-embacado.html");
for (const marker of ["desenhaEstrela", "acerto=0", "estrelaX", "estrelaY", "A estrela está se apagando"]) {
  if (!vidro.includes(marker)) throw new Error(`Vidro sem marcador: ${marker}`);
}
const janela = read("mosaico-web/public/modulos/janela-do-norte.html");
for (const marker of ["modoAlto", "v.elev>=12", "v.elev<=8", "iOSInstavel?1.50:1.25", "Math.min(1.22"]) {
  if (!janela.includes(marker)) throw new Error(`Janela sem marcador: ${marker}`);
}
const sala = read("mosaico-web/public/modulos/sala-as-escuras.html");
if (!sala.includes("!sementeManual && !jogando && roundCode()!==rodadaVista")) {
  throw new Error("Sala ainda pode rearranjar durante a execução");
}

// Medição determinística das seis alturas: registra o ganho geométrico usado.
const alturas=[4,9,14,20,28,39];
console.log("Janela do Norte — compensação revisada por altura:");
for (const e of alturas) {
  const c=Math.max(0.70,Math.cos(Math.abs(e)*Math.PI/180));
  const geo=Math.min(1.22,1+0.70*(1/c-1));
  console.log(`${String(e).padStart(2)}°  geo=${geo.toFixed(3)}  iPhone=${(1.25*geo).toFixed(3)}  instável=${(1.50*geo).toFixed(3)}`);
}

console.log("Patches aplicados com sucesso.");
