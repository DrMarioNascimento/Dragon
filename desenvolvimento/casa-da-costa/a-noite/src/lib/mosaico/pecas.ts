/* A geometria das peças do Encaixe, fora do componente para poder ser
   exercitada. O encaixe entre peças vizinhas é a coisa que mais fácil quebra
   em silêncio: com a forma antiga, um calombo em cima do outro passava por
   desenho. */

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

type Pt = [number, number];

/* Meia-aresta em coordenadas (t, n): t corre de 0 a 1 ao longo da aresta, n
   sobe na perpendicular. Reta, pescoço, bulbo, e volta. Escrito como uma
   sequência de cúbicas para poder ser invertida sem perder a forma. */
const P0: Pt = [0.0, 0.0];
const SEGMENTOS: [Pt, Pt, Pt][] = [
  [
    [0.12, 0.0],
    [0.25, 0.0],
    [0.37, 0.0],
  ], // a reta antes do pescoço
  [
    [0.41, 0.01],
    [0.43, 0.03],
    [0.43, 0.06],
  ], // sobe pelo pescoço
  [
    [0.43, 0.105],
    [0.36, 0.1],
    [0.355, 0.15],
  ], // abre para o bulbo
  [
    [0.35, 0.205],
    [0.415, 0.25],
    [0.5, 0.25],
  ], // meia-volta esquerda
  [
    [0.585, 0.25],
    [0.65, 0.205],
    [0.645, 0.15],
  ], // meia-volta direita
  [
    [0.64, 0.1],
    [0.57, 0.105],
    [0.57, 0.06],
  ], // fecha para o pescoço
  [
    [0.57, 0.03],
    [0.59, 0.01],
    [0.63, 0.0],
  ], // desce o pescoço
  [
    [0.75, 0.0],
    [0.88, 0.0],
    [1.0, 0.0],
  ], // a reta depois
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

/* Antes "b" saía de "-t" da mesma peça, e como o t da primeira fileira é
   zerado na borda, a fileira inteira ficava com a base reta — e a fileira de
   baixo enfiava um pino nela. Cada aresta decide sozinha, e as duas peças que
   a dividem leem a mesma decisão. */
export function tabsFor(col: number, row: number, cols: number, rows: number) {
  return {
    t: (-pinoH(col, row, rows) || 0) as Tab,
    b: pinoH(col, row + 1, rows),
    l: (-pinoV(col, row, cols) || 0) as Tab,
    r: pinoV(col + 1, row, cols),
  };
}

/* Variação por aresta: sem ela as seis peças têm o pino no mesmo lugar e a
   coisa parece azulejo. */
function variacao(chave: string) {
  return {
    dt: (hashAresta(chave + ":dt") - 0.5) * 0.09, // desliza ao longo da aresta
    k: 0.86 + hashAresta(chave + ":k") * 0.3, // altura do pino
    kw: 0.92 + hashAresta(chave + ":w") * 0.18, // largura do pino
  };
}

/* ==========================================================================
   O SENTIDO DA ARESTA

   Cada aresta interna é percorrida DUAS VEZES, uma por peça, e em sentidos
   opostos: o topo de uma vai da esquerda para a direita, a base da vizinha
   vai da direita para a esquerda. O perfil não é simétrico e `dt` desliza o
   pino ao longo de t — então o mesmo t caía em pontos diferentes do mundo
   nas duas peças, e o contorno saía DUPLICADO: dois traços quase juntos, com
   frestas pretas entre o pino e o buraco.

   A cura é a aresta ter um sentido canônico só. Ela é sempre construída da
   esquerda para a direita (horizontal) ou de cima para baixo (vertical); a
   peça que a percorre ao contrário recebe a MESMA curva invertida. Inverter
   uma cúbica é trocar os dois pontos de controle de lugar — a forma é
   idêntica ao milímetro, que é o ponto.
   ========================================================================== */

/** Pontos da aresta em (t,n) canônico, já com a variação aplicada. */
function perfilDaAresta(chave: string, s: Tab) {
  const { dt, k, kw } = variacao(chave);
  const ajusta = ([t, n]: Pt, extremo: boolean): Pt => [
    extremo ? t : 0.5 + (t - 0.5) * kw + dt,
    n * k * s,
  ];
  const inicio = ajusta(P0, true);
  const segs = SEGMENTOS.map(([c1, c2, p], i) => {
    const ultimo = i === SEGMENTOS.length - 1;
    return [ajusta(c1, false), ajusta(c2, false), ajusta(p, ultimo)] as [Pt, Pt, Pt];
  });
  return { inicio, segs };
}

/** A mesma cadeia de cúbicas, percorrida do fim para o começo. */
function inverte(inicio: Pt, segs: [Pt, Pt, Pt][]) {
  const pontos: Pt[] = [inicio, ...segs.map(([, , p]) => p)];
  const novos: [Pt, Pt, Pt][] = [];
  for (let i = segs.length - 1; i >= 0; i -= 1) {
    const [c1, c2] = segs[i];
    novos.push([c2, c1, pontos[i]]);
  }
  return { inicio: pontos[pontos.length - 1], segs: novos };
}

type Lado = {
  chave: string;
  tab: Tab;
  /** a peça percorre a aresta contra o sentido canônico */
  invertido: boolean;
  /** leva (t,n) canônico para a coordenada local da peça */
  mapa: (t: number, n: number) => Pt;
};

function ladoD(lado: Lado, destino: Pt) {
  if (lado.tab === 0) return `L ${destino[0].toFixed(4)} ${destino[1].toFixed(4)}`;
  const cru = perfilDaAresta(lado.chave, lado.tab);
  const { segs } = lado.invertido ? inverte(cru.inicio, cru.segs) : cru;
  const f = ([t, n]: Pt) => {
    const [x, y] = lado.mapa(t, n);
    return `${x.toFixed(4)} ${y.toFixed(4)}`;
  };
  return segs.map(([c1, c2, p]) => `C ${f(c1)} ${f(c2)} ${f(p)}`).join(" ");
}

/* n canônico: para cima (−y) nas horizontais, para a direita (+x) nas
   verticais. O `tab` de cada lado já traz o sinal certo para o mundo, então
   os mapas abaixo só posicionam a aresta na célula. */
export function piecePath(p: Piece) {
  const { col, row, tabs } = p;
  const lados: [Lado, Pt][] = [
    [
      {
        chave: `h:${col}:${row}`,
        tab: tabs.t,
        invertido: false,
        mapa: (t, n) => [t, -n],
      },
      [1, 0],
    ],
    [
      {
        chave: `v:${col + 1}:${row}`,
        tab: tabs.r,
        invertido: false,
        mapa: (t, n) => [1 + n, t],
      },
      [1, 1],
    ],
    [
      {
        chave: `h:${col}:${row + 1}`,
        tab: tabs.b,
        invertido: true,
        mapa: (t, n) => [t, 1 + n],
      },
      [0, 1],
    ],
    [
      {
        chave: `v:${col}:${row}`,
        tab: tabs.l,
        invertido: true,
        mapa: (t, n) => [-n, t],
      },
      [0, 0],
    ],
  ];
  return ["M 0 0", ...lados.map(([l, destino]) => ladoD(l, destino)), "Z"].join(" ");
}
