/* Auditor das janelas d'A Casa — roda DENTRO da página.

   Injetado pelo teste `ac-janelas-sobreposicao.test.mjs` (Chrome sem tela) e
   à mão no painel do navegador durante as voltas de auditoria. Mede o que só
   a tela mostra — é a classe de defeito que a leitura do código não pega:
   uma faixa sobre a anotação, o capítulo sobre o cartão, um controle coberto,
   um diálogo que sai da tela.

   Devolve { superficies, cruzamentos, cobertos, fora, tetos }. */
(function (global) {
  'use strict';

  function visivel(el) {
    if (!el || !el.isConnected) return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.hidden) return false;
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
      if (n.tagName === 'DIALOG' && !n.open) return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  /* A caixa VISÍVEL: recortada por todo ancestral que rola ou corta. Um
     painel maior que a pilha que rola não cruza o rodapé — a pilha o corta. */
  function caixa(el) {
    const r = el.getBoundingClientRect();
    let x = r.left, y = r.top, d = r.right, b = r.bottom;
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (!/(auto|scroll|hidden|clip)/.test(cs.overflow + cs.overflowY + cs.overflowX)) continue;
      const c = n.getBoundingClientRect();
      x = Math.max(x, c.left); y = Math.max(y, c.top); d = Math.min(d, c.right); b = Math.min(b, c.bottom);
    }
    return { x, y, w: Math.max(0, d - x), h: Math.max(0, b - y), b, d };
  }
  function nome(el) {
    if (el.id) return '#' + el.id;
    return el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
  }
  function cruzam(a, b) {
    const dx = Math.min(a.d, b.d) - Math.max(a.x, b.x), dy = Math.min(a.b, b.b) - Math.max(a.y, b.y);
    return dx > 0.5 && dy > 0.5 ? Math.round(dx * dy) : 0;
  }

  /* As superfícies: o que é JANELA ou barra. Pegas e retículas não são
     superfícies — são controles sobre a cena, conferidos pela regra 2. */
  function superficies() {
    const lista = [];
    const add = (el, faixa) => { if (visivel(el)) lista.push({ nome: nome(el), faixa, caixa: caixa(el), el }); };
    document.querySelectorAll('.topbar, body > header').forEach(el => add(el, 'barra'));
    const modal = sobreposto();
    document.querySelectorAll('dialog[open]').forEach(el => add(el, 'tela'));
    if (modal && modal.tagName !== 'DIALOG') add(modal, 'tela');
    /* Com um diálogo modal aberto, o resto está sob o fundo e inerte: só
       contam o diálogo e a barra. */
    if (!modal) {
      document.querySelectorAll('.ac-panel-stack > *').forEach(el => add(el, 'baixo'));
      document.querySelectorAll('[data-ac-painel]').forEach(el => add(el, 'baixo'));
      document.querySelectorAll('#notice, #sync-status, #loading').forEach(el => add(el, 'alto'));
      document.querySelectorAll('.tools').forEach(el => {
        if (Array.from(el.children).some(visivel)) add(el, 'rodape');
      });
      document.querySelectorAll('.chapter').forEach(el => add(el, 'capitulo'));
    }
    return lista;
  }

  /* O que cobre a tela inteira e manda no toque: o <dialog> aberto ou os
     sobrepostos de tela cheia dos módulos (a intro da sala é nível 10 como
     um diálogo, só que é <div>). Debaixo dele, nada conta. */
  function sobreposto() {
    const d = document.querySelector('dialog[open]');
    if (d) return d;
    for (const sel of ['#intro:not(.gone):not(.out)', '#oito.on', '#falha.on', '#carta.on']) {
      const el = document.querySelector(sel);
      if (el && visivel(el)) return el;
    }
    return null;
  }
  function controles() {
    const modal = sobreposto();
    const raiz = modal || document;
    return Array.from(raiz.querySelectorAll('button, a[href], [role="button"], input, select'))
      .filter(el => visivel(el) && !el.closest('[inert]') && !el.disabled);
  }

  function auditar() {
    const W = innerWidth, H = innerHeight;
    const sup = superficies();
    const cruzamentos = [];
    for (let i = 0; i < sup.length; i++) for (let j = i + 1; j < sup.length; j++) {
      const a = sup[i], b = sup[j];
      /* Painéis da MESMA pilha não se cruzam por construção (flex); um dentro
         do outro também não conta. */
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const area = cruzam(a.caixa, b.caixa);
      if (area) cruzamentos.push(a.nome + ' × ' + b.nome + ' (' + area + ' px²)');
    }
    const cobertos = [];
    for (const el of controles()) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > W || cy > H) { cobertos.push(nome(el) + ' fora da tela'); continue; }
      const topo = document.elementFromPoint(cx, cy);
      if (!topo || !(topo === el || el.contains(topo) || topo.contains(el))) cobertos.push(nome(el) + ' coberto por ' + (topo ? nome(topo) : 'nada'));
      else if (r.height < 43.5 && !el.closest('.brand') && el.tagName !== 'A' && el.tagName !== 'INPUT') cobertos.push(nome(el) + ' com ' + Math.round(r.height) + ' px de altura (piso 44)');
    }
    const fora = sup.filter(s => s.caixa.x < -0.5 || s.caixa.y < -0.5 || s.caixa.d > W + 0.5 || s.caixa.b > H + 0.5)
      .map(s => s.nome + ' ' + JSON.stringify([Math.round(s.caixa.x), Math.round(s.caixa.y), Math.round(s.caixa.d), Math.round(s.caixa.b)]));
    /* A conta que garante que as faixas não se encontram: barra + margem +
       teto alto + margem + teto baixo + rodapé + margem ≤ altura. */
    const raiz = getComputedStyle(document.documentElement);
    const px = v => { const t = document.createElement('div'); t.style.cssText = 'position:absolute;visibility:hidden;height:' + v; document.body.appendChild(t); const h = t.getBoundingClientRect().height; t.remove(); return h; };
    let tetos = null;
    if (raiz.getPropertyValue('--ac-barra').trim()) {
      const barra = px('var(--ac-barra)'), margem = px('var(--ac-margem)'), alto = px('var(--ac-alto)'), baixo = px('var(--ac-baixo)');
      const rodape = parseFloat(raiz.getPropertyValue('--ac-rodape')) || 0;
      const soma = barra + margem + alto + margem + baixo + rodape + margem;
      tetos = { soma: Math.round(soma), altura: H, paisagem: matchMedia('(max-height:560px)').matches };
    }
    return {
      tamanho: W + '×' + H,
      superficies: sup.map(s => s.faixa + ' ' + s.nome + ' ' + JSON.stringify([Math.round(s.caixa.x), Math.round(s.caixa.y), Math.round(s.caixa.w), Math.round(s.caixa.h)])),
      cruzamentos, cobertos, fora, tetos
    };
  }
  global.ACAuditoria = { auditar };
})(typeof window !== 'undefined' ? window : globalThis);
