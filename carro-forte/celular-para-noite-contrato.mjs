/* Contrato da ponte Celular (Manhã) → Noite (Captura).
   Funções puras: URL, params e campos de sala. Sem DOM e sem Firebase. */

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

/** Campos de partida gravados em noite/{sala} na ponte. */
export function noiteSeedPartida({ pergunta, jogadores } = {}) {
  const id = normalizePergunta(pergunta);
  if (!id) throw new Error('pergunta inválida para a ponte');
  const out = {
    pergunta: id,
    origem: FROM_CELULAR,
    continuidade: { from: FROM_CELULAR },
  };
  const n = Number(jogadores) || 0;
  if (n >= 2 && n <= 8) out.jogadores = n;
  return out;
}

/** Marcador no doc da Manhã (mosaico/{sala}). */
export function celularPonteFields({ pergunta } = {}) {
  const id = normalizePergunta(pergunta);
  if (!id) throw new Error('pergunta inválida para a ponte');
  return { pergunta: id, alvo: COLECAO_NOITE };
}
