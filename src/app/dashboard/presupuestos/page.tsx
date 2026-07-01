import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft, FileText, Plus, ChevronRight } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatearPesos } from "@/lib/format";
import { estiloEstado } from "@/lib/estados";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Mis presupuestos — ObraApp",
};

// Se consulta la base en cada request.
export const dynamic = "force-dynamic";

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Listado de todos los presupuestos del usuario. El acceso lo protege el
// middleware, así que acá NO redirigimos por auth.
export default async function PresupuestosPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const presupuestos = userId
    ? await prisma.presupuesto.findMany({
        where: { userId },
        orderBy: { numero: "desc" },
        select: {
          id: true,
          numero: true,
          titulo: true,
          clienteNombre: true,
          estado: true,
          esEjemplo: true,
          total: true,
          creadoAt: true,
        },
      })
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Encabezado */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Panel
          </Link>
          <Button asChild size="sm" className="gap-2">
            <Link href="/dashboard/presupuestos/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo
            </Link>
          </Button>
        </div>
      </header>

      <main className="container flex flex-col gap-4 py-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Mis presupuestos
          </h1>
          <p className="text-sm text-muted-foreground">
            {presupuestos.length}{" "}
            {presupuestos.length === 1 ? "presupuesto" : "presupuestos"}
          </p>
        </div>

        {presupuestos.length === 0 ? (
          <Card className="bg-card text-card-foreground">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Todavía no creaste ningún presupuesto.
              </p>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/dashboard/presupuestos/nuevo">
                  <Plus className="h-4 w-4" />
                  Crear el primero
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {presupuestos.map((p) => {
              const estado = estiloEstado(p.estado);
              return (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/presupuestos/${p.id}`}
                    className="block rounded-lg transition-colors hover:bg-muted/50"
                  >
                    <Card className="bg-card text-card-foreground">
                      <CardContent className="flex items-center justify-between gap-3 py-4">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                            #{p.numero} · {p.titulo}
                            {p.esEjemplo && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-amber-800">
                                Ejemplo
                              </span>
                            )}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {p.clienteNombre} · {formatoFecha.format(p.creadoAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-semibold text-foreground">
                              {formatearPesos(p.total)}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}
                            >
                              {estado.etiqueta}
                            </span>
                          </div>
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
