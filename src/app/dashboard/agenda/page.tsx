import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft, Plus } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Agenda, type TurnoSerializado } from "@/components/agenda/agenda";

export const metadata: Metadata = {
  title: "Agenda — ObraApp",
};

// Consulta la base en cada request: no se prerrenderiza.
export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Todos los turnos del usuario. Las fechas se serializan a ISO para el
  // componente cliente, que las muestra en la hora local del navegador.
  const turnos = userId
    ? await prisma.turno.findMany({
        where: { userId },
        orderBy: { fecha: "asc" },
        include: {
          presupuesto: { select: { numero: true } },
        },
      })
    : [];

  const serializados: TurnoSerializado[] = turnos.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    estado: t.estado,
    fecha: t.fecha.toISOString(),
    fechaFin: t.fechaFin ? t.fechaFin.toISOString() : null,
    clienteNombre: t.clienteNombre,
    clienteTel: t.clienteTel,
    presupuestoId: t.presupuestoId,
    presupuestoNumero: t.presupuesto?.numero ?? null,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Encabezado */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            <span className="text-lg font-bold text-foreground">Agenda</span>
          </div>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/dashboard/agenda/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo turno
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <Agenda turnos={serializados} />
      </main>
    </div>
  );
}
