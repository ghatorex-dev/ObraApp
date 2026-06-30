import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Estructura visual compartida por las pantallas de login y registro.
// Mobile-first: la tarjeta ocupa el ancho disponible y se centra en pantallas
// grandes. Define texto Y fondo de forma explícita.
export function AuthShell({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-10 text-foreground">
      <div className="w-full max-w-sm">
        {/* Marca */}
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-2xl font-bold text-foreground"
          >
            ObraApp
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Presupuestos para tu oficio
          </p>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-card-foreground">
              {titulo}
            </CardTitle>
            <CardDescription>{descripcion}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
