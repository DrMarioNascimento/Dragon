import { MosaicMark } from "@/components/game/mark";
import { ModuleFrame } from "@/components/game/module-frame";
import { moduleBySlug } from "@/lib/mosaico/modules";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/noite/$slug")({
  component: ModulePage,
  ssr: false,
});

function ModulePage() {
  const { slug } = Route.useParams();
  const mod = moduleBySlug(slug);
  if (!mod) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <MosaicMark className="size-8 text-primary" />
        <p className="brand-wordmark text-3xl text-primary">MOSAICO</p>
        <p className="text-lg text-fog">Essa tarefa não existe nesta noite.</p>
        <Link to="/noite" className="text-accent underline-offset-4 hover:underline">
          Ver as tarefas
        </Link>
      </div>
    );
  }
  return <ModuleFrame mod={mod} />;
}
