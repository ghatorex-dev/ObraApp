import Link from "next/link";

// Footer con links a las páginas legales. Se usa en la landing, el dashboard
// y las propias páginas legales.
export function Footer() {
  const anio = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-background">
      <div className="container flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <span>© {anio} ObraApp · Hecho en Argentina 🇦🇷</span>
        <nav className="flex items-center gap-4">
          <Link href="/terminos" className="hover:text-foreground">
            Términos
          </Link>
          <Link href="/privacidad" className="hover:text-foreground">
            Privacidad
          </Link>
        </nav>
      </div>
    </footer>
  );
}
