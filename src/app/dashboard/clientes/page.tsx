import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft, Plus, Users } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientesBuscador } from "@/components/clientes/clientes-buscador";

export const metadata: Metadata = {
  title: "Clientes — ObraApp",
};

// Consulta la base en cada request: no se prerrenderiza.
export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const q = searchParams.q?.trim() ?? "";

  // Clientes del usuario, filtrados por nombre (insensible a mayúsculas).
  const clientes = userId
    ? await prisma.cliente.findMany({
        where: {
          userId,
          ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
        },
        orderBy: { nombre: "asc" },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          email: true,
          _count: { select: { presupuestos: true } },
        },
      })
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Encabezado */}
      <header className="border-b border-border">
        <div className="container flex items-center gap-3 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="text-lg font-bold text-foreground">Clientes</span>
        </div>
      </header>

      <main className="container flex flex-col gap-4 py-6">
        {/* Buscador + alta */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <ClientesBuscador />
          </div>
          <Button asChild className="gap-2">
            <Link href="/dashboard/clientes/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Link>
          </Button>
        </div>

        {/* Listado */}
        {clientes.length === 0 ? (
          <Card className="bg-card text-card-foreground">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                {q
                  ? `No encontramos clientes que coincidan con "${q}".`
                  : "Todavía no tenés clientes cargados."}
              </p>
              {!q && (
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/dashboard/clientes/nuevo">
                    <Plus className="h-4 w-4" />
                    Cargar el primero
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {clientes.map((c) => (
              <li key={c.id}>
                <Link href={`/dashboard/clientes/${c.id}`}>
                  <Card className="bg-card text-card-foreground transition-colors hover:bg-accent">
                    <CardContent className="flex items-center justify-between gap-3 py-4">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {c.nombre}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {c.telefono || c.email || "Sin datos de contacto"}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c._count.presupuestos}{" "}
                        {c._count.presupuestos === 1
                          ? "presupuesto"
                          : "presupuestos"}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
