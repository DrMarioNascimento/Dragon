export type Forma = "m" | "f" | "n";

const PAPEIS: Record<string, { m: string; f: string }> = {
  tomas: { m: "investigador", f: "investigadora" },
  helena: { m: "herdeiro", f: "herdeira" },
  elias: { m: "morador", f: "moradora" },
  clara: { m: "jornalista", f: "jornalista" },
  nilo: { m: "policial", f: "policial" },
  iris: { m: "visitante", f: "visitante" },
};

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function norma(forma?: string | null): Forma {
  if (forma === "f" || forma === "m" || forma === "n") return forma;
  return "n";
}

/** O Policial / A Policial / Policial — conforme menino, menina ou tanto faz. */
export function tituloPapel(id: string, forma?: string | null): string {
  const f = norma(forma);
  const papel = PAPEIS[id] ?? { m: id, f: id };
  const nome = f === "f" ? papel.f : papel.m;
  if (f === "n") return cap(nome);
  const art = f === "f" ? "A" : "O";
  return `${art} ${cap(nome)}`;
}

export function tituloPapelNaMesa(
  id: string,
  players: { personagem?: string; forma?: string }[],
): string {
  const dono = players.find((p) => p.personagem === id);
  return tituloPapel(id, dono?.forma);
}

export const FORMA_OPCOES: { id: Forma; label: string }[] = [
  { id: "m", label: "Menino" },
  { id: "f", label: "Menina" },
  { id: "n", label: "Tanto faz" },
];
