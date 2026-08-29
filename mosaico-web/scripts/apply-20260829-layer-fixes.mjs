import fs from 'node:fs';

function load(p) { return fs.readFileSync(p, 'utf8'); }
function save(p, s) { fs.writeFileSync(p, s, 'utf8'); }
function mustReplace(s, oldText, newText, label) {
  if (!s.includes(oldText)) throw new Error(`PADRAO NAO ENCONTRADO: ${label}`);
  return s.replace(oldText, newText);
}

// 1) PartyApp: hooks invariantes, chrome simetrico e sincronizacao com overlays internos.
{
  const p = 'src/components/game/party-app.tsx';
  const s = load(p);
  const novo = `export function PartyApp() {
  const mode = useParty((s) => s.mode);
  const fase = useParty((s) =>
    s.mode === "local" ? s.localFase : s.room?.fase || "sala",
  ) as V3Phase | "sala" | "comodo";
  const leave = useParty((s) => s.leave);
  const players = useParty((s) => s.players);
  const lanternDone = useParty((s) => s.lanternDone);
  const [moduleOverlay, setModuleOverlay] = useState(false);

  useEffect(() => {
    function onModuleUi(ev: MessageEvent) {
      if (ev.origin !== window.location.origin) return;
      const d = ev.data as { mosaico?: string; open?: boolean } | null;
      if (!d || d.mosaico !== "ui-overlay") return;
      setModuleOverlay(Boolean(d.open));
    }
    window.addEventListener("message", onModuleUi);
    return () => window.removeEventListener("message", onModuleUi);
  }, []);

  useEffect(() => {
    setModuleOverlay(false);
  }, [fase]);

  if (mode === "idle") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6">
        <MosaicMark className="size-8 text-primary" />
        <p className="text-lg text-fog">A mesa ainda não foi aberta.</p>
        <Link to="/" className="text-lg text-accent">
          Voltar
        </Link>
      </div>
    );
  }

  const hideChrome = fase === "cor" || LANTERN_FASES.includes(fase);
  const showHost =
    fase === "votacao" ||
    fase === "encaixe" ||
    fase === "deducao" ||
    (fase === "cor" && players.some((p) => p.fragmentoPronto)) ||
    (LANTERN_FASES.includes(fase) && lanternDone);

  return (
    <div className="relative min-h-dvh bg-background">
      {!hideChrome && (
        <header className="grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center px-4 pt-[max(0.8rem,env(safe-area-inset-top))]">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-start text-base text-muted-foreground"
            onClick={leave}
          >
            Sair
          </button>
          <p className="min-w-0 text-center text-base uppercase tracking-[0.16em] text-accent">
            {fase && fase in PHONE_LINE ? PHONE_LINE[fase as V3Phase] : "MOSAICO"}
          </p>
          <span aria-hidden="true" className="w-14" />
        </header>
      )}
      {!moduleOverlay && <FaseRelogio />}
      {hideChrome && !moduleOverlay && (
        <button
          type="button"
          className="absolute right-4 top-[max(0.8rem,env(safe-area-inset-top))] z-40 min-h-11 rounded-full border border-white/15 bg-background/70 px-3 text-base text-white/90 backdrop-blur-sm"
          onClick={leave}
        >
          Sair
        </button>
      )}
      {fase === "sala" && <SalaScreen />}
      {fase === "encenacao" && <EnceneScreen />}
      {fase === "votacao" && <VotoScreen />}
      {fase === "janela" && <LanternPhase slug="janela" />}
      {(fase === "vidro" || fase === "comodo") && <LanternPhase slug="vidro" />}
      {fase === "salaescura" && <LanternPhase slug="sala" />}
      {fase === "cor" && <CorScreen />}
      {fase === "palimpsesto" && <PalimpsestoPlay />}
      {fase === "espelho" && <EspelhoPlay />}
      {fase === "planta" && <PlantaPlay />}
      {fase === "encaixe" && <EncaixeScreen />}
      {fase === "deducao" && <DeducaoScreen />}
      {fase === "resultado" && <ResultadoScreen />}
      {showHost && !moduleOverlay && <HostBar />}
    </div>
  );
}
`;
  const out = s.replace(/export function PartyApp\(\) \{[\s\S]*?\n\}\s*$/, novo);
  if (out === s) throw new Error('PartyApp nao foi substituido');
  save(p, out);
}

// 2) Caderno: flex vertical em vez de altura magica.
{
  const p = 'src/components/game/shell.tsx';
  let s = load(p);
  s = mustReplace(s,
    'className="fixed inset-0 z-40 mx-auto max-w-lg bg-background/95 backdrop-blur-sm"',
    'className="fixed inset-0 z-40 mx-auto flex max-w-lg flex-col bg-background/95 backdrop-blur-sm"',
    'caderno container flex');
  s = mustReplace(s,
    'className="flex items-center justify-between border-b border-border px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]"',
    'className="shrink-0 flex items-center justify-between border-b border-border px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]"',
    'caderno header shrink');
  s = mustReplace(s,
    'className="h-[calc(100dvh-56px)] space-y-3 overflow-y-auto px-4 py-4"',
    'className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"',
    'caderno lista flex');
  save(p, s);
}

// 3) Quebra-cabeca: remover mensagem duplicada sobre a imagem.
{
  const p = 'src/components/game/carta-puzzle.tsx';
  const s = load(p);
  const out = s.replace(/\n\s*\{correct && done && \(\n\s*<div className="absolute inset-x-0 bottom-0 z-30[\s\S]*?\n\s*\)\}\n/, '\n');
  if (out === s) throw new Error('overlay duplicado do puzzle nao encontrado');
  save(p, out);
}

const helper = `
<script id="mosaico-embed-layer-sync">
(function(){
  var q=new URLSearchParams(location.search);
  if(q.get("embed")!=="1" || window.parent===window) return;
  document.documentElement.classList.add("mosaico-embed");
  var ids=["intro","pistas","cartao","carta","master","mestre","card"];
  var last=null;
  function vis(el){
    if(!el) return false;
    var cs=getComputedStyle(el);
    if(cs.display==="none" || cs.visibility==="hidden") return false;
    var op=parseFloat(cs.opacity||"1");
    if(op<=0.05) return false;
    if(el.classList.contains("gone")) return false;
    return true;
  }
  function emit(){
    var open=ids.some(function(id){ return vis(document.getElementById(id)); });
    if(open===last) return;
    last=open;
    window.parent.postMessage({mosaico:"ui-overlay",open:open},"*");
  }
  var mo=new MutationObserver(emit);
  ids.forEach(function(id){
    var el=document.getElementById(id);
    if(el) mo.observe(el,{attributes:true,attributeFilter:["class","style","hidden"]});
  });
  window.addEventListener("pageshow",emit);
  window.addEventListener("beforeunload",function(){
    window.parent.postMessage({mosaico:"ui-overlay",open:false},"*");
  });
  requestAnimationFrame(emit);
})();
</script>
`;
const reserve = '\n  html.mosaico-embed #hud{padding-top:calc(env(safe-area-inset-top,0px) + 80px)!important;}\n';

// 4) Sincronizar camadas dos tres iframes e reservar o topo do HUD para o cronometro.
for (const p of [
  'public/modulos/vidro-embacado.html',
  'public/modulos/janela-do-norte.html',
  'public/modulos/sala-as-escuras.html',
]) {
  let s = load(p);
  if (s.includes('mosaico-embed-layer-sync')) throw new Error(`helper ja existe em ${p}`);
  if (!s.includes('</style>') || !s.includes('</body>')) throw new Error(`HTML incompleto: ${p}`);
  s = s.replace('</style>', reserve + '</style>');
  s = s.replace('</body>', helper + '\n</body>');
  save(p, s);
}

// 5) Corrigir CSS malformado da introducao da Janela do Norte.
{
  const p = 'public/modulos/janela-do-norte.html';
  let s = load(p);
  s = mustReplace(s,
    '    background:#05070c;}\n    backdrop-filter:blur(2px);}\n  /* rede de seguranca',
    '    background:#05070c;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);}\n  /* rede de seguranca',
    'CSS intro Janela');
  save(p, s);
}

// 6) Verificacoes estaticas.
{
  const party = load('src/components/game/party-app.tsx');
  if (!party.includes('d.mosaico !== "ui-overlay"')) throw new Error('sync overlay ausente no PartyApp');
  if (!party.includes('{!moduleOverlay && <FaseRelogio />}')) throw new Error('cronometro nao condicionado ao overlay');
  if (!party.includes('absolute right-4 top-[max(0.8rem,env(safe-area-inset-top))]')) throw new Error('Sair de modulo nao foi deslocado');
  const shell = load('src/components/game/shell.tsx');
  if (shell.includes('h-[calc(100dvh-56px)]')) throw new Error('altura magica ainda existe no Caderno');
  for (const f of ['vidro-embacado.html','janela-do-norte.html','sala-as-escuras.html']) {
    const t = load('public/modulos/' + f);
    if (!t.includes('mosaico-embed-layer-sync') || !t.includes('html.mosaico-embed #hud')) throw new Error(`sync/reserva ausente em ${f}`);
  }
}

console.log('Correcoes de camadas aplicadas e verificadas.');
