export function RotateHint() {
  return (
    <div className="rotate-hint fixed inset-0 z-[90] flex-col items-center justify-center bg-background px-8 text-center">
      <p className="font-serif text-3xl text-primary">MOSAICO</p>
      <p className="mt-4 font-serif text-xl italic text-fog">Vire o telefone em pé.</p>
      <p className="mt-2 text-sm text-muted-foreground">A casa cabe melhor em retrato.</p>
    </div>
  );
}
