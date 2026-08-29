import { formatarCronometro } from "@/lib/mosaico/v3";
import { useParty } from "@/lib/mosaico/party";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/* `oculto` esconde os numeros, mas NAO desmonta o componente.
   Enquanto uma tela interna do modulo cobria a moldura, a moldura
   desmontava este relogio inteiro - e com ele o avanco automatico. Se
   todo mundo estivesse dentro do modulo quando o tempo acabasse, nao
   sobrava ninguem para empurrar a fase. */
export function FaseRelogio({ oculto = false }: { oculto?: boolean }) {
  const room = useParty((s) => s.room);
  const isMaster = useParty((s) => s.isMaster);
  const advance = useParty((s) => s.advance);
  const forcar = useParty((s) => s.forcarAcusacao);
  const fase = useParty((s) => (s.mode === "local" ? s.localFase : s.room?.fase));
  const [now, setNow] = useState(Date.now());
  const fired = useRef(0);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    fired.current = 0;
  }, [fase, room?.faseAteMs, room?.noiteAteMs]);

  const faseLeft = room?.faseAteMs ? room.faseAteMs - now : null;
  const noiteLeft = room?.noiteAteMs ? room.noiteAteMs - now : null;

  useEffect(() => {
    if (fired.current) return;
    if (fase === "sala" || fase === "resultado") return;
    /* O relogio da noite vivia so na aba de quem abriu a mesa: bastava
       esse telefone bloquear a tela, trocar de aba ou recarregar e a noite
       parava para todos, sem segundo caminho. Agora qualquer telefone
       empurra - so que 6 s depois, para que em condicoes normais quem
       conduz continue sendo o primeiro. A escrita e transacional, entao
       dois empurroes simultaneos nao pulam uma fase. */
    const espera = isMaster ? 0 : 6000;
    if (noiteLeft != null && noiteLeft <= -espera && fase !== "deducao") {
      fired.current = 1;
      void forcar();
      return;
    }
    if (faseLeft != null && faseLeft <= -espera) {
      fired.current = 1;
      void advance();
    }
  }, [faseLeft, noiteLeft, isMaster, fase, advance, forcar]);

  if (oculto) return null;
  if (fase === "sala" || fase === "resultado") return null;
  if (faseLeft == null && noiteLeft == null) return null;

  const show = faseLeft ?? noiteLeft ?? 0;
  const urgente = show <= 20_000;

  const overlay =
    fase === "janela" ||
    fase === "vidro" ||
    fase === "comodo" ||
    fase === "salaescura";

  return (
    <div
      className={
        overlay
          ? "pointer-events-none absolute inset-x-0 top-[max(0.35rem,env(safe-area-inset-top))] z-30 text-center"
          : "px-4 text-center"
      }
    >
      {noiteLeft != null && noiteLeft > 0 && faseLeft != null && (
        <span className="cronometro-legenda">
          noite {formatarCronometro(noiteLeft)}
        </span>
      )}
      {faseLeft != null && (
        <span className={cn("fragmento-cronometro", urgente && "is-urgente")}>
          {formatarCronometro(faseLeft)}
        </span>
      )}
    </div>
  );
}