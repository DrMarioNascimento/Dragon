/* A geometria das peças do Encaixe, fora do componente para poder ser
   exercitada. O encaixe entre peças vizinhas é a coisa que mais fácil
   quebra em silêncio: com a forma antiga, um calombo em cima do outro
   passava por desenho. */

export type Tab = -1 | 0 | 1;

export type Piece = {
  id: string;
  col: number;
  row: number;
  tabs: { t: Tab; r: Tab; b: Tab; l: Tab };
};

/* ==========================================================================
   A FORMA DA PEÇA

   Antes cada lado era um único arco quadrático — um calombo. Calombo não
   encaixa: duas peças com calombo se tocam e escorregam. O que trava é o
   perfil clássico, PESCOÇO ESTREITO que abre num BULBO redondo: o bulbo é
   mais largo que a garganta, então, uma vez dentro, não sai de lado.

   Aqui o pescoço tem 0,14 de largura e o bulbo 0,29 — o dobro. É essa razão
   que o olho lê como "peça de quebra-cabeça", não o tamanho do calombo.
   ========================================================================== */

/* Perfil de meia-aresta em coordenadas (t, n): t corre de 0 a 1 ao longo da
   aresta, n sobe na perpendicular. Uma reta, o pescoço, o bulbo, e volta. */
const PERFIL: [number, number][] = [
  [0.0, 0.0],
  [0.37, 0.0],
  [0.41, 0.01],
  [0.43, 0.03],
  [0.43, 0.06],
  [0.43, 0.105],
  [0.36, 0.1],
  [0.355, 0.15],
  [0.35, 0.205],
  [0.415, 0.25],
  [0.5, 0.25],
  [0.585, 0.25],
  [0.65, 0.205],
  [0.645, 0.15],
  [0.64, 0.1],
  [0.57, 0.105],
  [0.57, 0.06],
  [0.57, 0.03],
  [0.59, 0.01],
  [0.63, 0.0],
  [1.0, 0.0],
];

/* Hash estável: a MESMA aresta tem de sortear o mesmo número nas duas peças
   que a dividem, senão o pino de uma não cabe no buraco da outra. Por isso a
   semente vem da aresta (linha/coluna da grade), nunca da peça. */
function hashAresta(chave: string) {
  let h = 2166136261;
  for (let i = 0; i < chave.length; i += 1) {
    h ^= chave.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/** Sentido do pino da aresta horizontal em (col,row), medido no +y do mundo. */
export function pinoH(col: number, row: number, rows: number): Tab {
  if (row <= 0 || row >= rows) return 0;
  return hashAresta(`h:${col}:${row}`) < 0.5 ? 1 : -1;
}

/** Sentido do pino da aresta vertical em (col,row), medido no +x do mundo. */
export function pinoV(col: number, row: number, cols: number): Tab {
  if (col <= 0 || col >= cols) return 0;
  return hashAresta(`v:${col}:${row}`) < 0.5 ? 1 : -1;
}

/* Cada lado é percorrido com uma tangente e uma normal próprias, e a normal
   do topo aponta para fora (para cima) enquanto a da base aponta para fora
   (para baixo). Converter o sentido do MUNDO para o sentido de cada lado é o
   que faltava: antes "b" saía de "-t" da mesma peça, e como o t da primeira
   fileira é zerado na borda, a fileira inteira ficava com a base reta — e a
   fileira de baixo enfiava um pino nela. */
export function tabsFor(col: number, row: number, cols: number, rows: number) {
  return {
    t: (-pinoH(col, row, rows) || 0) as Tab,
    b: pinoH(col, row + 1, rows),
    l: (-pinoV(col, row, cols) || 0) as Tab,
    r: pinoV(col + 1, row, cols),
  };
}

/* Variação por aresta: sem ela as seis peças têm o pino no mesmo lugar e a
   coisa parece um azulejo. Com ela, cada encaixe é um pouco diferente — e,
   por vir do hash da aresta, o pino e o buraco variam JUNTOS. */
function variacao(chave: string) {
  const a = hashAresta(chave + ":dt");
  const b = hashAresta(chave + ":k");
  const c = hashAresta(chave + ":w");
  return {
    dt: (a - 0.5) * 0.09, // desliza ao longo da aresta
    k: 0.86 + b * 0.3, // altura do pino
    kw: 0.92 + c * 0.18, // largura do pino
  };
}

function ladoD(
  x: number,
  y: number,
  dx: number,
  dy: number,
  nx: number,
  ny: number,
  tab: Tab,
  chave: string,
) {
  if (tab === 0) return `L ${(x + dx).toFixed(4)} ${(y + dy).toFixed(4)}`;
  const { dt, k, kw } = variacao(chave);
  const ponto = ([t, n]: [number, number], reto: boolean) => {
    const tt = reto ? t : 0.5 + (t - 0.5) * kw + dt;
    const nn = n * k * tab;
    return `${(x + dx * tt + nx * nn).toFixed(4)} ${(y + dy * tt + ny * nn).toFixed(4)}`;
  };
  const P = PERFIL.map((pt, i) => ponto(pt, i === 0 || i === PERFIL.length - 1));
  const partes = [`L ${P[1]}`];
  for (let i = 2; i + 2 < PERFIL.length; i += 3) {
    partes.push(`C ${P[i]} ${P[i + 1]} ${P[i + 2]}`);
  }
  partes.push(`L ${P[PERFIL.length - 1]}`);
  return partes.join(" ");
}

export function piecePath(p: Piece) {
  const { col, row, tabs } = p;
  return [
    "M 0 0",
    ladoD(0, 0, 1, 0, 0, -1, tabs.t, `h:${col}:${row}`),
    ladoD(1, 0, 0, 1, 1, 0, tabs.r, `v:${col + 1}:${row}`),
    ladoD(1, 1, -1, 0, 0, 1, tabs.b, `h:${col}:${row + 1}`),
    ladoD(0, 1, 0, -1, -1, 0, tabs.l, `v:${col}:${row}`),
    "Z",
  ].join(" ");
}

