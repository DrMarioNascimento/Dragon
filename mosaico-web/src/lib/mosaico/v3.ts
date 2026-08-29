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

export const PHONE_LINE: Record<V3Phase, string> = {
  sala: "A mesa está sentando você.",
  encenacao: "É a sua vez. Faça.",
  votacao: "Quem deu o clima?",
  janela: "Aponta.",
  vidro: "Aponta. Inclina.",
  salaescura: "Aponta. O quadro, depois o cofre.",
  cor: "Procura a sua cor.",
  palimpsesto: "Empilha os vidros.",
  espelho: "Mostra. Não leia.",
  planta: "A mesa é a casa.",
  encaixe: "Encosta.",
  deducao: "Quem foi?",
  resultado: "A casa fala.",
};

export const FRAGMENTOS = {
  1: { nome: "Fragmento da Névoa", cor: "Vermelha", cls: "fragmento-nevoa" },
  2: { nome: "Fragmento da Tempestade", cor: "Azul", cls: "fragmento-tempestade" },
  3: { nome: "Fragmento do Farol", cor: "Dourada", cls: "fragmento-farol" },
  4: { nome: "Fragmento da Noite", cor: "Roxa", cls: "fragmento-noite" },
  /* O quinto veio de uma mesa de dez pessoas, que forma cinco núcleos e
     pedia um Fragmento que não existia. É o da carta da casa — a linha do
     tempo da noite, que é a única imagem do jogo que já É uma pista. */
  5: { nome: "Fragmento da Casa", cor: "Verde", cls: "fragmento-casa" },
} as const;

/** Quantos Fragmentos a casa tem para repartir. */
export const MAX_NUCLEOS = Object.keys(FRAGMENTOS).length;

/** O Fragmento de um núcleo. Nunca devolve vazio: um núcleo sem Fragmento
 *  derrubava a tela da cor em branco, e quem ficava sem tela era sempre
 *  quem entrou por último. */
export function fragmentoDoNucleo(nucleo: number | undefined) {
  const n = Math.min(MAX_NUCLEOS, Math.max(1, Number(nucleo) || 1));
  return FRAGMENTOS[n as keyof typeof FRAGMENTOS];
}

export const ROTEIRO: Record<
  string,
  { resumo: string; acao: string; fala: string }
> = {
  tomas: {
    resumo:
      "Você será a primeira pessoa a entrar na casa: caminhará como se atravessasse um corredor escuro, examinará a parede e reagirá a um estalo.",
    acao:
      "Caminhe devagar, como se estivesse entrando por um corredor. Passe a mão pela parede. Ao perceber um estalo, pare, olhe para cima e procure a origem do som.",
    fala:
      "“Tem alguém aí? Eu ouvi esse estalo — e não foi a tempestade. Se existe alguém escondido nesta casa, apareça agora!”",
  },
  helena: {
    resumo:
      "Você entrará como alguém que conhece a casa, examinará a sala e se aproximará do cofre ao perceber que a trava foi mexida.",
    acao:
      "Entre com segurança. Examine os cantos da sala. Ao encontrar o cofre, fixe o olhar, aproxime-se e toque a trava com o indicador.",
    fala:
      "“Isso não estava assim. Eu conheço cada marca deste cofre, e alguém tocou nesta trava recentemente. Quem chegou antes de nós precisa explicar o que procurava aqui.”",
  },
  elias: {
    resumo:
      "Você entrará como alguém acostumado a circular sem ser percebido, observará o andar superior e avisará que viu um movimento.",
    acao:
      "Caminhe com passos leves. Olhe para a escada, o sótão e a janela. Encare um ponto acima das outras pessoas; então recue um passo e fale.",
    fala:
      "“Não olhem todos ao mesmo tempo. Há alguma coisa se movendo perto do sótão. Eu conheço os barulhos desta casa, e aquilo não foi madeira cedendo ao vento.”",
  },
  clara: {
    resumo:
      "Você chegará com pressa, protegerá uma bolsa e investigará sinais no corredor antes de questionar o grupo.",
    acao:
      "Caminhe como se estivesse atrasada. Segure a bolsa junto ao corpo. Examine o corredor, a cortina e a porta entreaberta; então aponte para a porta.",
    fala:
      "“Quem deixou essa porta aberta? A cortina está se movendo, mas não há vento. Alguém passou por esse corredor antes de nós. Quero saber quem foi.”",
  },
  nilo: {
    resumo:
      "Você tentará demonstrar controle, mas o nervosismo aparece ao examinar a janela e um reflexo metálico.",
    acao:
      "Caminhe tenso. Olhe para a janela, para as pessoas e de novo para a casa. Recue ao notar um reflexo metálico e chame a atenção do grupo.",
    fala:
      "“Vocês viram aquele reflexo na janela? Não se aproximem ainda. Parecia metal. Afastem-se do vidro e me digam: alguém trouxe alguma coisa que possa refletir a luz?”",
  },
  iris: {
    resumo:
      "Você entrará por último, observará cada detalhe e revelará que a casa parecia esperar por uma das pessoas presentes.",
    acao:
      "Entre devagar. Olhe para o teto, o sótão, a escada, o cofre e a porta. Encare cada pessoa; escolha uma, dê um passo e só então fale.",
    fala:
      "“A casa estava vazia quando chegamos, mas não parecia abandonada. Acho que esta casa não esperava por todos nós. Esperava por uma pessoa.”",
  },
};

export const NOITE_CARTAS = [
  { id: "c03", hora: "21:03", txt: "A luz da Casa da Costa oscilou. Não foi queda. Foi aviso." },
  { id: "c07", hora: "21:07", txt: "A porta da sala estava entreaberta. A cortina balançava. A janela estava trancada." },
  { id: "c12", hora: "21:12", txt: "O cofre estava fechado. A marca de dedo na trava era recente." },
  { id: "c14", hora: "21:14", txt: "Um som veio do andar de cima. Não era passo. Não era objeto." },
  { id: "c20", hora: "21:20", txt: "A névoa entrou pela fresta da porta como se tivesse sido convidada." },
  { id: "c29", hora: "21:29", txt: "A luz morreu de uma vez. Alguém baixou o disjuntor à mão." },
] as const;

export const ORDEM_NOITE = ["c03", "c07", "c12", "c14", "c20", "c29"];

export const ENVELOPES = [
  { id: "e1", comodo: "Escada", preco: 1 as const, txt: "Óleo fresco no quarto degrau. A alavanca do disjuntor ainda escorrega." },
  { id: "e2", comodo: "Cofre", preco: 3 as const, txt: "Duas marcas na trava: uma mais seca, da tarde; outra mais fundo, da noite." },
  { id: "e3", comodo: "Jardim", preco: 5 as const, txt: "Uma folha molhada onde a chuva não chega. A água subiu pela fundação." },
];

export const DEDUCAO = {
  suspeitos: [
    { id: "tomas", label: "Investigador" },
    { id: "helena", label: "Herdeiro" },
    { id: "elias", label: "Morador" },
    { id: "clara", label: "Jornalista" },
    { id: "nilo", label: "Policial" },
    { id: "iris", label: "Visitante" },
  ],
  motivos: [
    { id: "m-heranca", label: "Impedir a troca da casa ao amanhecer" },
    { id: "m-furo", label: "Fabricar um furo para o jornal" },
    { id: "m-medo", label: "Proteger o grupo de alguém lá fora" },
  ],
  acoes: [
    { id: "a-disjuntor", label: "Baixou o disjuntor à mão" },
    { id: "a-janela", label: "Abriu a janela na tempestade" },
    { id: "a-porta", label: "Forçou a porta da frente" },
  ],
  provas: [
    { id: "pr-marcas", label: "As duas marcas na trava" },
    { id: "pr-relogio", label: "O relógio parado" },
    { id: "pr-bolsa", label: "O peso da bolsa" },
  ],
  lacunas: [
    { id: "g-agua-porta", label: "A água no jardim e a porta emperrada" },
    { id: "g-sotao", label: "O som do sótão" },
    { id: "g-nevoa", label: "A névoa foi convidada" },
  ],
};

export const VERDADE = {
  suspectId: "elias",
  motiveId: "m-heranca",
  actionId: "a-disjuntor",
  proofId: "pr-marcas",
  gapId: "g-agua-porta",
};

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

export function formatarCronometro(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
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

/** Par é a base. Ímpar: um time de 3 (foto + tarja). A casa sorteia. */
export function groupSizes(n: number): number[] {
  if (n <= 0) return [];
  if (n <= 3) return [n];
  /* Antes isto formava pares sem teto: dez pessoas viravam cinco núcleos,
     doze viravam seis, e a casa só tem Fragmento para cinco. Quem caísse
     no núcleo sem Fragmento perdia a tela da cor. O número de times passa
     a nascer de quantos Fragmentos existem, e o resto se distribui — um
     time de três é o que o desenho já previa para mesa ímpar. */
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

export type PapelFoto = "full" | "esq" | "dir" | "tarja";

export function papeisNoGrupo(n: number): PapelFoto[] {
  if (n <= 1) return ["full"];
  if (n === 2) return ["esq", "dir"];
  return ["esq", "dir", "tarja"];
}

export function pecasDoPapel(papel: PapelFoto): string[] {
  if (papel === "full") return [...ORDEM_NOITE];
  if (papel === "tarja") return ["c03", "c07"];
  return ORDEM_NOITE.filter((_, i) =>
    papel === "esq" ? i % 2 === 0 : i % 2 === 1,
  );
}

/* Uma para cada Fragmento, na ordem deles. A carta da costa estava órfã no
   repositório desde que o Encaixe virou fotos ("carta da casa como
   quebra-cabeça de dente", 78bc800): o arquivo continuava lá, e nada o
   pedia. Ela é a única cujas seis peças são os seis horários da noite. */
export const FOTO_IDS = ["agenda", "gaveta", "farol", "noite", "costa"] as const;
export type FotoId = (typeof FOTO_IDS)[number];

/** Uma imagem por Fragmento — a carta da casa é a do quinto. */
export function fotoDoNucleo(nucleo: number): FotoId {
  const n = Math.min(MAX_NUCLEOS, Math.max(1, nucleo));
  return FOTO_IDS[(n - 1) % FOTO_IDS.length];
}

export function assignComodos(n: number): ("sala" | "vidro")[] {
  return Array.from({ length: n }, (_, i) => (i % 2 === 0 ? "vidro" : "sala"));
}

export function pecasDoTelefone(playerIndex: number, total: number): string[] {
  if (total <= 1) return [...ORDEM_NOITE];
  return ORDEM_NOITE.filter((_, i) => i % total === playerIndex);
}

export const CAMPOS_FICHA = ["suspectId", "actionId", "proofId"] as const;
export type CampoFicha = (typeof CAMPOS_FICHA)[number];

/** A casa reparte a ficha. Um time não preenche os três. */
export function camposDoNucleo(nucleo: number, nNucleos: number): CampoFicha[] {
  if (nNucleos <= 1) return [...CAMPOS_FICHA];
  const donos: CampoFicha[][] = Array.from({ length: nNucleos }, () => []);
  CAMPOS_FICHA.forEach((c, i) => {
    donos[i % nNucleos].push(c);
  });
  return donos[Math.max(0, nucleo - 1)] ?? [];
}

export function nucleoDoCampo(campo: CampoFicha, nNucleos: number): number {
  const i = CAMPOS_FICHA.indexOf(campo);
  return (i % Math.max(1, nNucleos)) + 1;
}

export const CHAR_IDS = ["tomas", "helena", "elias", "clara", "nilo", "iris"] as const;

/** No máximo um ator por personagem. O sétimo não encena. */
export const ENCENE_MAX = CHAR_IDS.length;

export function nAtores(nJogadores: number) {
  return Math.min(Math.max(nJogadores, 0), ENCENE_MAX);
}

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

/** As três tarefas com módulo em iframe — as únicas que têm cenário para a
 *  mesa fixar. Palimpsesto, espelho e planta são gestos entre telefones. */
export const FASES_SENSOR: readonly string[] = ["janela", "vidro", "salaescura"];

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
