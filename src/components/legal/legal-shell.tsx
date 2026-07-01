import Link from "next/link";

import { Footer } from "@/components/legal/footer";

// Marco visual de las páginas legales (públicas): header simple + contenido
// legible + footer. Mobile-first, texto Y fondo explícitos.
export function LegalShell({
  titulo,
  actualizado,
  children,
}: {
  titulo: string;
  actualizado: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="text-lg font-bold text-foreground">
            ObraApp
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="container flex max-w-2xl flex-1 flex-col gap-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {titulo}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Última actualización: {actualizado}
          </p>
        </div>
        <div className="flex flex-col gap-6 text-sm leading-relaxed text-foreground">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Sección de una página legal (título + contenido).
export function LegalSeccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
      <div className="flex flex-col gap-2 text-muted-foreground">{children}</div>
    </section>
  );
}
