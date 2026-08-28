import { formatarCronometro } from "@/lib/mosaico/v3";
import { useParty } from "@/lib/mosaico/party";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function FaseRelogio() {
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
    if (!isMaster || fired.current) return;
    if (fase === "sala" || fase === "resultado") return;
    if (noiteLeft != null && noiteLeft <= 0 && fase !== "deducao") {
      fired.current = 1;
      void forcar();
      return;
    }
    if (faseLeft != null && faseLeft <= 0) {
      fired.current = 1;
      void advance();
    }
  }, [faseLeft, noiteLeft, isMaster, fase, advance, forcar]);

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