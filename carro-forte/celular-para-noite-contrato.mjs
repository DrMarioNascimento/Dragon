/* Contrato da ponte Celular (Manhã) → Noite (Captura).
   Funções puras: URL, params, handoff rico e economia v1. Sem DOM e sem Firebase. */

export const PERGUNTAS_VALIDAS = Object.freeze([
  'peso',
  'janela',
  'roubo',
  'antes',
  'quem',
  'proteger',
]);

export const FROM_CELULAR = 'celular';
export const COLECAO_CELULAR = 'mosaico';
export const COLECAO_NOITE = 'noite';
export const HANDOFF_VERSION = 1;
export const HANDOFF_STORAGE_PREFIX = 'mosaico-carro-handoff:';

/** Economia experimental da Noite quando abre sozinha (sem Manhã). */
export const ECONOMIA_STANDALONE = Object.freeze({ coins: 12, handSize: 3 });

/** Semente justa quando veio da Manhã mas o fecho não trouxe números. */
export const ECONOMIA_PONTE_SEM_FECHO = Object.freeze({ coins: 10, handSize: 3 });

/** @param {string|null|undefined} raw */
export function normalizeSala(raw) {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase();
  return /^[A-Z2-9]{6}$/.test(s) ? s : '';
}

/** @param {string|null|undefined} raw */
export function normalizePergunta(raw) {
  const id = String(raw ?? '')
    .trim()
    .toLowerCase();
  return PERGUNTAS_VALIDAS.includes(id) ? id : '';
}

/**
 * @param {string|URLSearchParams} search
 * @returns {{ fromCelular: boolean, sala: string, pergunta: string }}
 */
export function parseHandoffSearch(search) {
  const p =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(String(search || '').replace(/^\?/, ''));
  return {
    fromCelular: p.get('from') === FROM_CELULAR,
    sala: normalizeSala(p.get('sala')),
    pergunta: normalizePergunta(p.get('pergunta')),
  };
}

/**
 * Monta a URL relativa da Noite para continuidade sequencial.
 * O payload rico NÃO vai na URL — mora em noite/{sala}.partida.handoff
 * e/ou sessionStorage (solo/refresh local).
 * @param {{ base?: string, sala?: string, pergunta?: string, fromCelular?: boolean }} opts
 */
export function buildNoiteHandoffUrl(opts = {}) {
  const base = String(opts.base || 'noite/').replace(/\?.*$/, '');
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  const q = new URLSearchParams();
  if (opts.fromCelular !== false) q.set('from', FROM_CELULAR);
  const sala = normalizeSala(opts.sala);
  const pergunta = normalizePergunta(opts.pergunta);
  if (sala) q.set('sala', sala);
  if (pergunta) q.set('pergunta', pergunta);
  const qs = q.toString();
  return qs ? `${withSlash}?${qs}` : withSlash;
}

/**
 * Chave de sessionStorage para o handoff (solo/offline e refresh).
 * @param {{ sala?: string, pergunta?: string }} opts
 */
export function handoffStorageKey({ sala, pergunta } = {}) {
  const code = normalizeSala(sala) || 'SOLO';
  const id = normalizePergunta(pergunta) || 'pauta';
  return `${HANDOFF_STORAGE_PREFIX}${code}:${id}`;
}

function clampInt(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}

function limparIds(lista, max = 24) {
  if (!Array.isArray(lista)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of lista) {
    const id = String(raw ?? '')
      .trim()
      .toUpperCase();
    if (!/^F\d{2}$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

function limparNomes(lista, max = 8) {
  if (!Array.isArray(lista)) return [];
  return lista
    .map((n) =>
      String(n ?? '')
        .trim()
        .slice(0, 40),
    )
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Normaliza o resumo de fecho da Manhã (eixos de pontuar(), 0–100).
 * @param {object|null|undefined} raw
 */
export function normalizeFecho(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const total = clampInt(raw.total, 0, 100, NaN);
  if (!Number.isFinite(total)) return null;
  return {
    total,
    campos: clampInt(raw.campos, 0, 45, 0),
    hipotese: clampInt(raw.hipotese, 0, 15, 0),
    relacoes: clampInt(raw.relacoes, 0, 20, 0),
    leitura: clampInt(raw.leitura, 0, 10, 0),
    sensorial: clampInt(raw.sensorial, 0, 10, 0),
    revisao: clampInt(raw.revisao, 0, 5, 0),
    acertos: clampInt(raw.acertos, 0, 12, 0),
  };
}

/**
 * Monta o payload de continuidade Manhã → Noite (schema v1).
 * Campos: versão, from, pergunta, sala, jogadores, nomes, fecho,
 * hipoteseFinal, hipoteseProv, fragmentosRevelados, emMs.
 * fragmentosRevelados são só para o banner/resumo — NÃO semeiam o baralho
 * do Captura (evita spoiler e mistura de bancos).
 *
 * @param {object} input
 */
export function buildHandoffPayload(input = {}) {
  const pergunta = normalizePergunta(input.pergunta);
  if (!pergunta) throw new Error('pergunta inválida para o handoff');
  const sala = normalizeSala(input.sala);
  const fecho = normalizeFecho(input.fecho);
  const jogadores = clampInt(input.jogadores, 0, 8, 0);
  const hipoteseFinal = String(input.hipoteseFinal ?? '')
    .trim()
    .toUpperCase();
  const hipoteseProv = String(input.hipoteseProv ?? '')
    .trim()
    .toUpperCase();
  return {
    v: HANDOFF_VERSION,
    from: FROM_CELULAR,
    pergunta,
    ...(sala ? { sala } : {}),
    ...(jogadores >= 2 ? { jogadores } : {}),
    nomes: limparNomes(input.nomes),
    fecho,
    hipoteseFinal: /^H([1-9]|10)$/.test(hipoteseFinal) ? hipoteseFinal : null,
    hipoteseProv: /^H([1-9]|10)$/.test(hipoteseProv) ? hipoteseProv : null,
    fragmentosRevelados: limparIds(input.fragmentosRevelados),
    emMs: Number(input.emMs) || Date.now(),
  };
}

/**
 * Aceita payload gravado (Firestore / sessionStorage) e devolve shape estável.
 * @param {unknown} raw
 */
export function normalizeHandoff(raw) {
  if (!raw || typeof raw !== 'object') return null;
  try {
    return buildHandoffPayload(raw);
  } catch {
    return null;
  }
}

/**
 * Regra v1 da economia Captura herdada da Manhã.
 *
 * Quando `from=celular` e há fecho.total:
 *   coins    = clamp(8 + floor(total / 25), 8, 12)
 *   handSize = total < 40 ? 2 : 3
 * Sem fecho (só deep link / seed antigo): coins 10, hand 3.
 * Entrada avulsa da Noite: coins 12, hand 3 (experimental legado).
 *
 * Custos de Arriscar/Capturar/Comprar NÃO mudam. A pontuação da Manhã
 * não é reescrita — só escala o orçamento inicial do fechamento.
 *
 * @param {object|null|undefined} handoff
 * @param {{ fromCelular?: boolean }} opts
 */
export function deriveNoiteEconomy(handoff, opts = {}) {
  const fromCelular =
    opts.fromCelular === true ||
    handoff?.from === FROM_CELULAR ||
    !!normalizeHandoff(handoff);
  if (!fromCelular) {
    return {
      ...ECONOMIA_STANDALONE,
      source: 'standalone',
      rule: 'standalone-experimental-12/3',
    };
  }
  const h = normalizeHandoff(handoff);
  const fecho = h?.fecho;
  if (!fecho) {
    return {
      ...ECONOMIA_PONTE_SEM_FECHO,
      source: 'celular-sem-fecho',
      rule: 'ponte-fair-seed-10/3',
    };
  }
  const coins = Math.max(8, Math.min(12, 8 + Math.floor(fecho.total / 25)));
  const handSize = fecho.total < 40 ? 2 : 3;
  return {
    coins,
    handSize,
    source: 'celular-fecho',
    rule: 'v1-8+floor(total/25)_hand-2se<40',
    fechoTotal: fecho.total,
  };
}

/** Campos de partida gravados em noite/{sala} na ponte. */
export function noiteSeedPartida({ pergunta, jogadores, handoff } = {}) {
  const id = normalizePergunta(pergunta);
  if (!id) throw new Error('pergunta inválida para a ponte');
  const payload = handoff ? normalizeHandoff({ ...handoff, pergunta: id }) : null;
  const out = {
    pergunta: id,
    origem: FROM_CELULAR,
    continuidade: {
      from: FROM_CELULAR,
      ...(payload
        ? {
            v: payload.v,
            hipoteseFinal: payload.hipoteseFinal,
            fechoTotal: payload.fecho?.total ?? null,
          }
        : {}),
    },
  };
  const n = Number(jogadores) || Number(payload?.jogadores) || 0;
  if (n >= 2 && n <= 8) out.jogadores = n;
  if (payload) out.handoff = payload;
  return out;
}

/** Marcador no doc da Manhã (mosaico/{sala}). */
export function celularPonteFields({ pergunta, handoff } = {}) {
  const id = normalizePergunta(pergunta);
  if (!id) throw new Error('pergunta inválida para a ponte');
  const payload = handoff ? normalizeHandoff({ ...handoff, pergunta: id }) : null;
  const out = { pergunta: id, alvo: COLECAO_NOITE };
  if (payload) {
    out.handoffV = payload.v;
    out.fechoTotal = payload.fecho?.total ?? null;
    out.emMs = payload.emMs;
  }
  return out;
}

/**
 * Texto curto para o banner "continuação da manhã".
 * @param {object|null|undefined} handoff
 * @param {{ sala?: string, pergunta?: string }} bits
 */
export function continuityBannerText(handoff, bits = {}) {
  const h = normalizeHandoff(handoff);
  const sala = normalizeSala(bits.sala || h?.sala);
  const pergunta = normalizePergunta(bits.pergunta || h?.pergunta);
  const parts = [];
  parts.push('Continuação da manhã');
  if (sala) parts.push(`sala ${sala}`);
  if (pergunta) parts.push(`pergunta «${pergunta}»`);
  if (h?.hipoteseFinal) parts.push(`hipótese ${h.hipoteseFinal}`);
  if (h?.fecho) parts.push(`fecho ${h.fecho.total}/100`);
  if (h?.fragmentosRevelados?.length)
    parts.push(`${h.fragmentosRevelados.length} fragmentos revelados`);
  const eco = deriveNoiteEconomy(h || { from: FROM_CELULAR, pergunta: pergunta || 'peso' }, {
    fromCelular: true,
  });
  parts.push(`Captura inicia com ${eco.coins} moedas e ${eco.handSize} fragmentos`);
  return parts.join(' · ') + '.';
}
