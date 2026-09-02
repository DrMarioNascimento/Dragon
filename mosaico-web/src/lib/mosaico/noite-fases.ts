/* Motor de fases da sala do app React — o que sobrou de `v3.ts`.
 *
 * 02/09/2026: `v3.ts` guardava duas coisas no mesmo arquivo. Uma era o CASO
 * antigo da Casa da Costa — as cartas da noite, os envelopes, a dedução e
 * `VERDADE` (elias / m-heranca / a-disjuntor) —, que deixou de ser o caso
 * quando ele virou o da sétima pessoa. A outra era isto: contagem de fases,
 * relógio, formação de núcleos. O caso foi apagado junto com `case.ts`,
 * `routes/play.tsx` e `party-app.tsx`; o motor ficou, porque `party.ts`
 * depende dele e `party.ts` é o que a landing page usa.
 *
 * NADA AQUI DESCREVE O CASO. Se um dia voltar a haver conteúdo de caso no app
 * React, ele sai do banco em `v1/casos/casa-da-costa.json`, como A Noite já
 * faz — não de uma segunda lista escrita à mão, que foi exatamente o que
 * permitiu duas verdades conviverem sem ninguém perceber.
 */

export const V3_PHASES = [
  "sala",
  "encenacao",
  "votacao",
  "janela",
  "vidro",
  "salaescura",
  "cor",
  "palimpsesto",
  "espelho",
  "planta",
  "encaixe",
  "deducao",
  "resultado",
] as const;

export type V3Phase = (typeof V3_PHASES)[number];

export type NoiteFormato = "curta" | "cheia";

export const NOITE_TETO_S: Record<NoiteFormato, number> = {
  curta: 20 * 60,
  cheia: 40 * 60,
};

/** Segundos por fase. Sem número = sem relógio na cara. */
export const FASE_S: Partial<Record<V3Phase, number>> = {
  encenacao: 90,
  votacao: 45,
  janela: 150,
  vidro: 150,
  salaescura: 150,
  cor: 120,
  palimpsesto: 90,
  espelho: 90,
  planta: 90,
  encaixe: 180,
  deducao: 120,
};

export function fasesDaNoite(
  formato: NoiteFormato = "cheia",
  lanternaCurta: "janela" | "salaescura" = "janela",
): V3Phase[] {
  if (formato === "curta") {
    return [
      "sala",
      "encenacao",
      "votacao",
      lanternaCurta,
      "cor",
      "encaixe",
      "deducao",
      "resultado",
    ];
  }
  return [...V3_PHASES];
}

export function nextPhase(
  fase: string,
  formato: NoiteFormato = "cheia",
  lanternaCurta: "janela" | "salaescura" = "janela",
): V3Phase | null {
  if (fase === "comodo") return "cor";
  const list = fasesDaNoite(formato, lanternaCurta);
  const i = list.indexOf(fase as V3Phase);
  if (i < 0 || i >= list.length - 1) return null;
  return list[i + 1];
}

/** As fases em que a lanterna (um módulo sensorial) é a tarefa. */
export const FASES_SENSOR: readonly string[] = ["janela", "vidro", "salaescura"];

/* Quantos times a casa consegue montar. Era `Object.keys(FRAGMENTOS).length`,
   e os Fragmentos eram conteúdo do caso antigo; o número que importava para a
   formação de núcleos é este, e só ele sobreviveu. */
export const MAX_NUCLEOS = 5;

/** Par é a base. Ímpar: um time de 3. A casa sorteia. */
export function groupSizes(n: number): number[] {
  if (n <= 0) return [];
  if (n <= 3) return [n];
  /* Antes isto formava pares sem teto: dez pessoas viravam cinco núcleos,
     doze viravam seis, e a casa só tem Fragmento para cinco. Quem caísse
     no núcleo sem Fragmento perdia a tela da cor. O número de times nasce
     de quantos Fragmentos existem, e o resto se distribui. */
  const times = Math.min(MAX_NUCLEOS, Math.floor(n / 2));
  const base = Math.floor(n / times);
  const sobra = n % times;
  return Array.from({ length: times }, (_, i) => base + (i < sobra ? 1 : 0)).sort(
    (a, b) => b - a,
  );
}

export function assignNucleos(n: number): number[] {
  const sizes = groupSizes(n);
  const g = sizes.length;
  const left = [...sizes];
  const out: number[] = [];
  let i = 0;
  while (out.length < n) {
    const k = i % g;
    if (left[k] > 0) {
      out.push(k + 1);
      left[k]--;
    }
    i++;
  }
  return out;
}

export function assignComodos(n: number): ("sala" | "vidro")[] {
  return Array.from({ length: n }, (_, i) => (i % 2 === 0 ? "vidro" : "sala"));
}

/* Seis lugares à mesa. Os nomes saíram junto com o caso antigo — o que a
   formação de atores precisa é do TAMANHO, não de quem são. */
export const ENCENE_MAX = 6;

export function nAtores(nJogadores: number) {
  return Math.min(Math.max(nJogadores, 0), ENCENE_MAX);
}

/* O elenco. Os ids antigos eram tomas/helena/elias/clara/nilo/iris — nomes
   próprios do caso anterior, e `elias` era o culpado. Passam a ser os seis do
   banco (v1/casos/casa-da-costa.json), que são papéis e não pessoas: é o
   mesmo elenco que a Mesa e A Noite usam. */
export const CHAR_IDS = [
  "investigador",
  "herdeiro",
  "morador",
  "jornalista",
  "policial",
  "menina",
] as const;

/** Próximo índice de vez, ou null se a encenação acabou. */
export function proximoAtor(vez: number, nJogadores: number): number | null {
  const n = nAtores(nJogadores);
  const next = vez + 1;
  if (next >= n) return null;
  return next;
}

/** As fases em que a lanterna (um módulo ou um gesto) é a tarefa. */
export const FASES_LANTERNA = [
  "janela",
  "vidro",
  "salaescura",
  "palimpsesto",
  "espelho",
  "planta",
] as const;

export type SeguirCtx = {
  fase: string | undefined;
  isMaster: boolean;
  /** a tarefa desta fase foi concluída neste telefone */
  lanternDone: boolean;
  /** alguém na mesa já confirmou o Fragmento */
  algumFragmento: boolean;
  /** o relógio da fase já venceu (ou não existe relógio nesta fase) */
  faseVencida: boolean;
};

/** Quem vê o "Seguir", e por quê — uma verdade só.
 *
 *  Isto estava escrito duas vezes, com critérios diferentes: a moldura
 *  achava que "cor" mostrava o botão e a barra achava que não, então a fase
 *  onde cada um procura a sua cor não tinha botão nenhum e só passava pelo
 *  relógio. E o relógio mora na aba de quem abriu a mesa: bastava esse
 *  telefone dormir para a noite inteira parar sem saída.
 *
 *  Agora são dois direitos diferentes:
 *   · quem conduz a mesa segue assim que a tarefa da fase está feita, sem
 *     esperar o relógio — antes o botão só aparecia quando já não importava;
 *   · qualquer pessoa segue depois que o relógio venceu. É a rede de
 *     segurança, e é o que impede um telefone dormindo de parar a mesa. */
export function podeSeguir(c: SeguirCtx): boolean {
  if (!c.fase || c.fase === "sala" || c.fase === "resultado") return false;
  if (c.faseVencida) return true;
  if (!c.isMaster) return false;
  /* A encenação tem os próprios botões; uma barra por cima só confundiria. */
  if (c.fase === "encenacao") return false;
  if ((FASES_LANTERNA as readonly string[]).includes(c.fase)) return c.lanternDone;
  if (c.fase === "cor") return c.algumFragmento;
  return true;
}
