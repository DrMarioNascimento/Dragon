/**
 * As janelas d'A Casa medidas NA TELA — o teste que impede a volta.
 *
 * Para cada tela, em cada estado e em três tamanhos (390×844, 800×540 — a
 * moldura do percurso dentro da Mesa — e 1280×800), abre a página num Chrome
 * sem tela, pega o retângulo de cada superfície visível e reprova se:
 *   1. dois retângulos se cruzarem;
 *   2. um controle clicável não estiver no topo no seu próprio centro
 *      (`document.elementFromPoint`) ou tiver menos de 44 px de altura;
 *   3. qualquer retângulo sair da tela;
 *   4. a soma dos tetos das faixas passar da altura da tela.
 *
 * É a classe de defeito que leitura de código não pega: a faixa sobre a
 * anotação, o capítulo sobre o cartão, o cartão comendo metade da tela dentro
 * da moldura do percurso, o chevron coberto pela camada visual da sala.
 *
 * O auditor é o MESMO usado à mão nas voltas de auditoria:
 * `tests/ajuda-janelas-auditoria.js`.
 *
 * Sem Chrome na máquina (nem em CHROME_PATH), o teste é pulado com aviso —
 * no runner Ubuntu da CI o Google Chrome vem instalado.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "../ferramentas/ac-cooperacao.mjs";
import { CAPITULOS, FECHADURAS } from "../ferramentas/ac-maquete-state.mjs";

const AUDITOR = readFileSync(new URL("./ajuda-janelas-auditoria.js", import.meta.url), "utf8");
const TAMANHOS = [[390, 844], [800, 540], [1280, 800]];

function acharChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ].filter(Boolean);
  return candidatos.find((p) => existsSync(p)) || null;
}

/* ---------------- um cliente mínimo do protocolo de depuração ---------------- */
class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0; this.pendentes = new Map(); this.ouvintes = [];
    this.pronto = new Promise((ok, falha) => { this.ws.onopen = ok; this.ws.onerror = falha; });
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pendentes.has(m.id)) {
        const { ok, falha } = this.pendentes.get(m.id); this.pendentes.delete(m.id);
        if (m.error) falha(new Error(m.error.message)); else ok(m.result);
      } else if (m.method) this.ouvintes.forEach((f) => f(m));
    };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((ok, falha) => this.pendentes.set(id, { ok, falha }));
  }
  close() { try { this.ws.close(); } catch {} }
}

async function abrirChrome(caminho) {
  const perfil = mkdtempSync(join(tmpdir(), "ac-janelas-chrome-"));
  const proc = spawn(caminho, [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${perfil}`,
    "--no-first-run", "--no-default-browser-check", "--mute-audio",
    "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
    "--autoplay-policy=no-user-gesture-required", "about:blank"
  ], { stdio: ["ignore", "ignore", "pipe"] });
  const url = await new Promise((ok, falha) => {
    let buf = "";
    const t = setTimeout(() => falha(new Error("o Chrome não abriu a porta de depuração")), 20000);
    proc.stderr.on("data", (d) => {
      buf += d; const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf);
      if (m) { clearTimeout(t); ok(m[1]); }
    });
    proc.on("exit", () => falha(new Error("o Chrome saiu antes de abrir")));
  });
  const cdp = new Cdp(url); await cdp.pronto;
  return { cdp, fechar: () => { cdp.close(); proc.kill(); try { rmSync(perfil, { recursive: true, force: true }); } catch {} } };
}

async function novaAba(cdp) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const aba = {
    run: (method, params) => cdp.send(method, params, sessionId),
    async avaliar(expr) {
      const r = await cdp.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
      if (r.exceptionDetails) throw new Error("na página: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async tamanho(l, a) { await aba.run("Emulation.setDeviceMetricsOverride", { width: l, height: a, deviceScaleFactor: 1, mobile: l < 700 }); },
    async ir(url) { await aba.run("Page.navigate", { url }); },
    async esperar(expr, ms = 20000) {
      const fim = Date.now() + ms;
      for (;;) {
        try { if (await aba.avaliar(expr)) return; } catch {}
        if (Date.now() > fim) throw new Error("a página não chegou em: " + expr);
        await new Promise((r) => setTimeout(r, 150));
      }
    },
    fechar: () => cdp.send("Target.closeTarget", { targetId })
  };
  await aba.run("Page.enable"); await aba.run("Runtime.enable");
  return aba;
}

/* Mede nos três tamanhos e devolve os defeitos, nomeando estado e tamanho. */
async function medir(aba, estado, preparar) {
  const defeitos = [];
  for (const [l, a] of TAMANHOS) {
    await aba.tamanho(l, a);
    await new Promise((r) => setTimeout(r, 450));
    if (preparar) await aba.avaliar(preparar);
    await new Promise((r) => setTimeout(r, 250));
    const m = await aba.avaliar(AUDITOR + ";ACAuditoria.auditar()");
    const onde = `${estado} @ ${l}×${a}`;
    for (const c of m.cruzamentos) defeitos.push(`${onde}: cruzam ${c}`);
    for (const c of m.cobertos) defeitos.push(`${onde}: ${c}`);
    for (const c of m.fora) defeitos.push(`${onde}: sai da tela ${c}`);
    if (m.tetos && m.tetos.soma > m.tetos.altura) defeitos.push(`${onde}: os tetos somam ${m.tetos.soma} em ${m.tetos.altura}`);
  }
  return defeitos;
}

/* Nos papéis, o que o dedo precisa acertar não é janela: é o pedaço. Nenhum
   pedaço (nem o tabuleiro) pode ficar sob a pilha de painéis ABERTA, sob a
   barra, ou fora da tela — em nenhum dos três tamanhos. */
const PECAS = `(()=>{const r=e=>e.getBoundingClientRect(),W=innerWidth,H=innerHeight,erros=[];
  const cruza=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
  const pilha=document.querySelector('.ac-panel-stack'),barra=document.querySelector('.topbar');
  const tampas=[pilha&&getComputedStyle(pilha).visibility!=='hidden'?['a pilha de painéis',r(pilha)]:null,
    barra&&getComputedStyle(barra).display!=='none'?['a barra',r(barra)]:null].filter(Boolean);
  for(const el of [document.getElementById('tabuleiro'),...document.querySelectorAll('.peca:not([hidden])')]){
    const b=r(el),nome=el.id||('pedaço '+el.dataset.i);
    if(b.left<-1||b.top<-1||b.right>W+1||b.bottom>H+1)erros.push(nome+' sai da tela');
    for(const [t,c] of tampas)if(cruza(b,c))erros.push(nome+' fica sob '+t);
  }return erros;})()`;
async function medirPecas(aba, estado) {
  const defeitos = [];
  for (const [l, a] of TAMANHOS) {
    await aba.tamanho(l, a);
    await new Promise((r) => setTimeout(r, 450));
    await aba.avaliar(ABRIR);
    await new Promise((r) => setTimeout(r, 450));
    for (const e of await aba.avaliar(PECAS)) defeitos.push(`${estado} @ ${l}×${a}: ${e}`);
  }
  return defeitos;
}

/* O "outro jogador": um fluxo de eventos aberto pelo próprio teste. Sem ele
   o motor recusa os atos da maquete (a dupla precisa estar conectada). */
async function conectarComo(base, sala, papel, chave) {
  const ctl = new AbortController();
  const res = await fetch(`${base}/api/ac/events?${new URLSearchParams({ sala, papel, chave })}`, { signal: ctl.signal });
  res.body.getReader().read().catch(() => {});
  return () => ctl.abort();
}
async function agir(base, sala, papel, chave, evento) {
  const r = await fetch(`${base}/api/ac/action?${new URLSearchParams({ sala, papel, chave })}`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify(evento)
  });
  return r.status;
}

/* Recolher a pilha pelo relógio acontece em 15 s: a medida quer as janelas
   ABERTAS, que é o pior caso de ocupação. */
const ABRIR = "window.ACJanelas&&ACJanelas.abrir&&ACJanelas.abrir(),true";

const chrome = acharChrome();

test("janelas d'A Casa: nada se cruza, nada fica coberto, nada sai da tela", { skip: chrome ? false : "sem Chrome nesta máquina (defina CHROME_PATH)", timeout: 600000 }, async () => {
  const servidor = createServer(resolve("."));
  await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + servidor.address().port;
  const { cdp, fechar } = await abrirChrome(chrome);
  const desligar = [];
  const defeitos = [];
  try {
    const aba = await novaAba(cdp);

    /* ---------- maquete da Mesa ---------- */
    const sala = await (await fetch(base + "/api/ac/rooms?atividade=maquete", { method: "POST" })).json();
    const t = sala.tokens;
    const pagina = (papel) => `${base}/v1/AC-maquete.html?sala=${sala.id}&papel=${papel}&chave=${t[papel]}`;
    const prontaMaquete = "!!(window.__maquete&&window.__maquete.estado)";
    desligar.push(await conectarComo(base, sala.id, "conhecimento", t.conhecimento));

    await aba.tamanho(390, 844); await aba.ir(pagina("luz")); await aba.esperar(prontaMaquete);
    await aba.esperar("document.getElementById('portal').open");
    defeitos.push(...await medir(aba, "maquete · portal"));
    await aba.avaliar("document.getElementById('portal-mesa').click(),true");
    await aba.esperar("!document.getElementById('portal').open&&window.__maquete.estado()");
    defeitos.push(...await medir(aba, "maquete · procurando", ABRIR));

    const c0 = CAPITULOS[0];
    await agir(base, sala.id, c0.chaveiro, t[c0.chaveiro], { type: "maquete_examinar", object: c0.esconderijo });
    await agir(base, sala.id, "conhecimento", t.conhecimento, { type: "maquete_examinar", object: c0.fechadura });
    await aba.esperar("(window.__maquete.estado()||{}).lock===true");
    defeitos.push(...await medir(aba, "maquete · com a chave", ABRIR));

    await aba.ir(pagina("conhecimento")); await aba.esperar(prontaMaquete);
    await aba.esperar("document.getElementById('portal').open");
    await aba.avaliar("document.getElementById('portal-mesa').click(),true");
    desligar.push(await conectarComo(base, sala.id, "luz", t.luz));
    await aba.esperar("!document.getElementById('portal').open&&(window.__maquete.estado()||{}).papel==='fechadura'");
    defeitos.push(...await medir(aba, "maquete · guiando", ABRIR));

    for (const [nivel, cap] of CAPITULOS.entries()) {
      const dono = cap.chaveiro === "luz" ? "conhecimento" : "luz";
      if (nivel > 0) {
        await agir(base, sala.id, cap.chaveiro, t[cap.chaveiro], { type: "maquete_examinar", object: cap.esconderijo });
        await agir(base, sala.id, dono, t[dono], { type: "maquete_examinar", object: cap.fechadura });
      }
      await agir(base, sala.id, cap.chaveiro, t[cap.chaveiro], { type: "maquete_mover", tip: FECHADURAS[nivel] });
      await agir(base, sala.id, cap.chaveiro, t[cap.chaveiro], { type: "maquete_encaixar" });
    }
    await aba.esperar("document.getElementById('discovery').open");
    defeitos.push(...await medir(aba, "maquete · concluída"));

    /* O colega saiu: o aparelho diz isso, e nada se cruza. */
    desligar.splice(0).forEach((f) => f());
    const sozinha = await (await fetch(base + "/api/ac/rooms?atividade=maquete", { method: "POST" })).json();
    await aba.ir(`${base}/v1/AC-maquete.html?sala=${sozinha.id}&papel=luz&chave=${sozinha.tokens.luz}`);
    await aba.esperar(prontaMaquete); await aba.esperar("document.getElementById('portal').open");
    await aba.avaliar("document.getElementById('portal-mesa').click(),true");
    await aba.esperar("!document.getElementById('coop-status').hidden");
    defeitos.push(...await medir(aba, "maquete · aguardando o colega", ABRIR));

    /* A caixa ainda trancada: a escrivaninha não foi registrada. */
    const trancada = await (await fetch(base + "/api/ac/rooms", { method: "POST" })).json();
    await aba.ir(`${base}/v1/AC-maquete.html?sala=${trancada.id}&papel=luz&chave=${trancada.tokens.luz}`);
    await aba.esperar(prontaMaquete);
    await aba.esperar("document.getElementById('heading').textContent.includes('continua fechada')");
    defeitos.push(...await medir(aba, "maquete · trancada", ABRIR));

    /* ---------- escrivaninha ---------- */
    const mesa = await (await fetch(base + "/api/ac/rooms", { method: "POST" })).json();
    desligar.push(await conectarComo(base, mesa.id, "conhecimento", mesa.tokens.conhecimento));
    const prontaMesa = "!!window.__escrivaninha&&document.getElementById('loading').hidden";
    await aba.ir(`${base}/v1/AC-escrivaninha.html?sala=${mesa.id}&papel=luz&chave=${mesa.tokens.luz}`);
    await aba.esperar(prontaMesa);
    defeitos.push(...await medir(aba, "escrivaninha · a vela na mão", ABRIR));
    await aba.ir(`${base}/v1/AC-escrivaninha.html?sala=${mesa.id}&papel=conhecimento&chave=${mesa.tokens.conhecimento}`);
    await aba.esperar(prontaMesa);
    defeitos.push(...await medir(aba, "escrivaninha · no escuro", ABRIR));

    /* Vela apagada e dossiê: pelo Solo, que guarda o estado na sessão. */
    const solo = (estado) => "sessionStorage.setItem('ac:solo-integral:v1'," +
      JSON.stringify(JSON.stringify({ version: 1, started: 1, janelaConcluida: true, maquete: null, keyMotion: null, ...estado })) +
      "),location.reload(),true";
    await aba.ir(`${base}/v1/AC-escrivaninha.html?demo=solo`); await aba.esperar(prontaMesa);
    await aba.avaliar(solo({ stage: "iluminar", vela: { ate: 1 } }));
    await aba.esperar(prontaMesa + "&&!document.getElementById('fosforo').hidden");
    defeitos.push(...await medir(aba, "escrivaninha · a vela apagou", ABRIR));
    await aba.avaliar(solo({ stage: "encontrado", vela: { ate: 1 } }));
    await aba.esperar(prontaMesa + "&&document.getElementById('fragment').open");
    defeitos.push(...await medir(aba, "escrivaninha · dossiê"));

    /* ---------- percurso ---------- */
    await aba.ir(`${base}/v1/AC-percurso.html`);
    await aba.esperar("!!document.getElementById('create')");
    defeitos.push(...await medir(aba, "percurso · entrada"));
    await aba.avaliar("document.getElementById('create').click(),true");
    await aba.esperar("document.getElementById('partners').open");
    defeitos.push(...await medir(aba, "percurso · convite"));

    /* ---------- os papéis da passagem ---------- */
    const prontosPapeis = "!!window.__papeis&&document.getElementById('loading').hidden&&document.querySelectorAll('.peca').length>0";
    await aba.ir(`${base}/v1/AC-papeis.html`);
    await aba.esperar(prontosPapeis);
    defeitos.push(...await medir(aba, "papéis · a planta", ABRIR));
    defeitos.push(...await medirPecas(aba, "papéis · a planta"));
    await aba.avaliar("window.__papeis.abrirEtapa(1).then(()=>true)");
    await aba.esperar(prontosPapeis + "&&window.__papeis.etapa==='bilhete'");
    defeitos.push(...await medir(aba, "papéis · o bilhete", ABRIR));
    defeitos.push(...await medirPecas(aba, "papéis · o bilhete"));
    await aba.avaliar("window.__papeis.abrirEtapa(2).then(()=>true)");
    await aba.esperar(prontosPapeis + "&&window.__papeis.etapa==='relogio'");
    defeitos.push(...await medir(aba, "papéis · o relógio", ABRIR));
    defeitos.push(...await medirPecas(aba, "papéis · o relógio"));
    await aba.avaliar("document.getElementById('achado').showModal(),true");
    defeitos.push(...await medir(aba, "papéis · o achado"));

    /* ---------- sala às escuras ---------- */
    await aba.ir(`${base}/v1/MOSAICO-26-a-sala-as-escuras.html`);
    await aba.esperar("!!document.getElementById('b-entrar')");
    defeitos.push(...await medir(aba, "sala · abertura"));

    await aba.fechar();
  } finally {
    desligar.forEach((f) => f());
    fechar();
    servidor.closeAllConnections();
    await new Promise((r) => servidor.close(r));
  }
  assert.deepEqual(defeitos, [], "janelas se encontrando na tela:\n  " + defeitos.join("\n  "));
});
