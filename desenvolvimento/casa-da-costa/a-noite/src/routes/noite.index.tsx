import { MEDIA } from "@/lib/mosaico/assets";
import { MosaicMark } from "@/components/game/mark";
import { NIGHT_MODULES } from "@/lib/mosaico/modules";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Compass } from "lucide-react";

export const Route = createFileRoute("/noite/")({
  component: NoitePage,
});

function NoitePage() {
  return (
    <main className="relative min-h-dvh bg-background text-foreground">
      <img
        src={`${MEDIA}capa-vertical.jpg`}
        alt=""
        className="cover-photo absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div className="cover-tint absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/92 to-background" />
      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <Link
          to="/"
          className="inline-flex min-h-11 w-fit items-center gap-2 text-base uppercase tracking-[0.16em] text-fog"
        >
          <ArrowLeft className="size-4" />
          MOSAICO
        </Link>
        <header className="mt-8">
          <MosaicMark className="mb-4 size-8 text-primary" />
          <p className="text-base uppercase tracking-[0.24em] text-muted-foreground">
            A Casa da Costa
          </p>
          <h1 className="mt-2 font-serif text-4xl">A lanterna</h1>
          <p className="mt-3 max-w-prose font-serif text-lg italic text-fog">
            Aponta. O rumo devolve a pista.
          </p>
        </header>
        <ul className="mt-8 flex flex-col gap-3">
          {NIGHT_MODULES.map((m) => (
            <li key={m.slug}>
              <Link
                to="/noite/$slug"
                params={{ slug: m.slug }}
                className="box-depth block rounded-xl p-4"
              >
                <p className="text-base uppercase tracking-[0.16em] text-accent">{m.kicker}</p>
                <p className="mt-1 font-serif text-2xl">{m.title}</p>
                <p className="mt-2 text-lg leading-relaxed text-fog">{m.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-base leading-relaxed text-muted-foreground">
          iPhone e Android: a casa pede o giroscópio. Aceite o movimento quando o sistema perguntar. Se recusar, dá para arrastar com o dedo.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-md px-5 text-lg text-fog hover:bg-muted hover:text-foreground"
        >
          <Compass className="size-4" />
          Voltar ao caso
        </Link>
      </div>
    </main>
  );
}
