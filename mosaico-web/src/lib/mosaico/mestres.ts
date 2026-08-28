/** Gmails que podem abrir mesa. Vazio = ninguém no menu público;
 *  o estúdio usa /v2/?abrir=1 */
export const MESTRES: string[] = [
  // "seu.gmail@gmail.com",
];

export function podeAbrirMesa(email: string | null | undefined) {
  if (!MESTRES.length) return false;
  return !!email && MESTRES.some((e) => e.toLowerCase() === email.toLowerCase());
}

export function studioPodeAbrir() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("abrir") === "1";
}