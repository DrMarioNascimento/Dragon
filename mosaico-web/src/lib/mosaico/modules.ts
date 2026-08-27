export interface NightModule {
  slug: string;
  title: string;
  kicker: string;
  blurb: string;
  file: string;
  kind: "sensor" | "mapa";
}

export const NIGHT_MODULES: NightModule[] = [
  {
    slug: "janela",
    title: "A Janela do Norte",
    kicker: "Jogador contra jogador",
    blurb: "Suba a encosta na névoa. O farol acende as marcas. Segure o rumo até a cortina se mexer.",
    file: "janela-do-norte.html",
    kind: "sensor",
  },
  {
    slug: "sala",
    title: "A Sala às Escuras",
    kicker: "Jogador contra jogador",
    blurb: "Oito coisas ao redor. A frase pede uma. O cofre só aparece quando o quadro desce ao chão.",
    file: "sala-as-escuras.html",
    kind: "sensor",
  },
  {
    slug: "vidro",
    title: "O Vidro Embaçado",
    kicker: "Jogador contra jogador",
    blurb: "Incline o aparelho. A água obedece. Segure o ângulo até o vidro abrir a frase de trás.",
    file: "vidro-embacado.html",
    kind: "sensor",
  },
  {
    slug: "escuro",
    title: "O Mapa do Escuro",
    kicker: "A casa no bolso",
    blurb: "O mapa da Costa. Gire o corpo. O que a lanterna não cobre, a casa esconde.",
    file: "mapa-do-escuro.html",
    kind: "mapa",
  },
];

export function moduleBySlug(slug: string) {
  return NIGHT_MODULES.find((m) => m.slug === slug) ?? null;
}
