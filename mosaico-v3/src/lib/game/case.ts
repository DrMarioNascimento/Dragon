export type TileId =
  | "carta-costa"
  | "foto-agenda"
  | "foto-gaveta"
  | "foto-farol"
  | "foto-noite";

export type ClueKind = "pilar" | "conector" | "contexto" | "ambiguidade" | "boato";

export type PieceKey = "tl" | "tr" | "bl" | "br";

export const PIECE_KEYS: PieceKey[] = ["tl", "tr", "bl", "br"];

export type Tile = {
  id: TileId;
  title: string;
  kind: ClueKind;
  caption: string;
  text: string;
  slot: number;
  slotPrompt: string;
};

export const TILES: Tile[] = [
  {
    id: "carta-costa",
    title: "Carta da Costa",
    kind: "pilar",
    caption: "A marca na trava",
    text: "A carta lista seis horários da noite: 21:03, 21:07, 21:12, 21:14, 21:20, 21:29. Junto ao lacre: «A marca na trava».",
    slot: 0,
    slotPrompt: "A agenda da noite",
  },
  {
    id: "foto-agenda",
    title: "Polaroid",
    kind: "ambiguidade",
    caption: "ontem — 8",
    text: "Uma figura de costas, à beira da casa, na chuva. No verso, à mão: «ontem — 8». Parece ontem. Pode não ser.",
    slot: 1,
    slotPrompt: "O recorte de ontem",
  },
  {
    id: "foto-gaveta",
    title: "Gaveta",
    kind: "pilar",
    caption: "A chave e o retrato",
    text: "Na gaveta da alcova: um retrato da fachada e uma chave de ferro. A fechadura da sala do cofre foi reparada na semana passada.",
    slot: 2,
    slotPrompt: "O que estava guardado",
  },
  {
    id: "foto-noite",
    title: "Espelho da escada",
    kind: "conector",
    caption: "O corredor",
    text: "A moldura no patamar reflete a escada para o porão. Às 21:14 a luz oscilou. Alguém desceu enquanto a casa estava às escuras.",
    slot: 3,
    slotPrompt: "O percurso",
  },
  {
    id: "foto-farol",
    title: "Recorte AMES",
    kind: "pilar",
    caption: "A trava",
    text: "Recorte de 1872 colado por cima do cofre. A combinação não foi forçada: a trava tem uma marca recente, alinhada à carta.",
    slot: 4,
    slotPrompt: "A fechadura",
  },
];

export const TILE_BY_ID = Object.fromEntries(TILES.map((t) => [t.id, t])) as Record<
  TileId,
  Tile
>;

export const SUSPECTS = [
  { id: "helena", name: "Helena Vale", role: "Dona da casa" },
  { id: "tomas", name: "Tomás Vale", role: "Irmão" },
  { id: "iris", name: "Íris Vale", role: "Sobrinha" },
  { id: "nuno", name: "Nuno Pires", role: "Caseiro" },
  { id: "vera", name: "Vera do Farol", role: "Vizinha" },
  { id: "lemos", name: "Dr. Lemos", role: "Hóspede" },
] as const;

export type SuspectId = (typeof SUSPECTS)[number]["id"];

export const TRUTH = {
  suspect: "nuno" as SuspectId,
  motive: "O testamento na sala do cofre ia tirá-lo da casa.",
  action: "Usou a chave da gaveta às 21:14, desceu a escada e abriu a trava marcada.",
  proof: "Carta (21:14) + chave da gaveta + marca na trava do recorte.",
  gap: "Quem tinha a chave e conhecia a fechadura recém-reparada.",
  accomplice: null as string | null,
};

export const MOTIVES = [
  "O testamento na sala do cofre ia tirá-lo da casa.",
  "Ciúme de uma herança prometida à sobrinha.",
  "Dívida com o hóspede, cobrada naquela noite.",
  "Proteger a dona da casa de um escândalo.",
  "Nada foi tirado — só um erro na escuridão.",
];

export const ACTIONS = [
  "Usou a chave da gaveta às 21:14, desceu a escada e abriu a trava marcada.",
  "Entrou pelo jardim às 20:00, como na polaroid.",
  "Desligou o farol para esconder um barco.",
  "Trocou o retrato da gaveta para incriminar outra pessoa.",
  "Ninguém abriu o cofre; a marca é ferrugem antiga.",
];

export const PROOFS = [
  "Carta (21:14) + chave da gaveta + marca na trava do recorte.",
  "A polaroid «ontem — 8» prova quem estava no jardim.",
  "O recorte de jornal prova um crime de 1872.",
  "A moldura da escada mostra o rosto do autor.",
  "Não há prova — só coincidência de horários.",
];

export const GAPS = [
  "Quem tinha a chave e conhecia a fechadura recém-reparada.",
  "Por que o relógio da carta atrasa dois minutos.",
  "Quem posou na polaroid.",
  "De onde veio o recorte AMES.",
  "Se a chuva apagou pegadas no jardim.",
];

export const STORY = [
  {
    title: "21:03",
    body: "A tempestade chega à Costa. Helena tranca a sala do cofre e deixa a carta no aparador, ainda sem lacre.",
  },
  {
    title: "21:12",
    body: "A luz oscila. Tomás discute no salão. Íris procura um casaco. Nuno diz que vai ver o telhado. Vera observa o farol da janela da casa vizinha.",
  },
  {
    title: "21:14",
    body: "Escuro por vinte e poucos segundos. Um metal curto, no porão. Quando a luz volta, ninguém está exatamente onde estava.",
  },
];

export const RUMORS = [
  {
    id: "boato-iris",
    kind: "boato" as ClueKind,
    title: "Boato",
    text: "«A sobrinha foi vista no jardim ontem às oito, com uma máquina fotográfica.» Pode ser verdade. Pode ser só recorte.",
  },
];

export const KIND_LABEL: Record<ClueKind, string> = {
  pilar: "Pista-pilar",
  conector: "Conector",
  contexto: "Contexto",
  ambiguidade: "Ambiguidade",
  boato: "Boato",
};
