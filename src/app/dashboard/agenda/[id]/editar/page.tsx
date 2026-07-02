import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TurnoForm } from "@/components/agenda/turno-form";

export const metadata: Metadata = {
  title: "Editar turno — ObraApp",
};

export const dynamic = "force-dynamic";

export default async function EditarTurnoPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  // Turno del usuario (pertenencia verificada en el where).
  const [turno, clientes, presupuestos] = await Promise.all([
    prisma.turno.findFirst({
      where: { id: params.id, userId },
    }),
    prisma.cliente.findMany({
      where: { userId },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, telefono: true, email: true },
    }),
    prisma.presupuesto.findMany({
      where: { userId, esEjemplo: false },
      orderBy: { creadoAt: "desc" },
      take: 50,
      select: {
        id: true,
        numero: true,
        titulo: true,
        clienteNombre: true,
        clienteEmail: true,
        clienteTel: true,
        clienteId: true,
      },
    }),
  ]);

  if (!turno) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center gap-3 py-4">
          <Link
            href="/dashboard/agenda"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="text-lg font-bold text-foreground">
            Editar turno
          </span>
        </div>
      </header>

      <main className="container py-6">
        <div className="mx-auto w-full max-w-lg">
          <TurnoForm
            clientes={clientes}
            presupuestos={presupuestos}
            inicial={{
              id: turno.id,
              titulo: turno.titulo,
              fecha: turno.fecha.toISOString(),
              fechaFin: turno.fechaFin ? turno.fechaFin.toISOString() : null,
              notas: turno.notas,
              clienteNombre: turno.clienteNombre,
              clienteEmail: turno.clienteEmail,
              clienteTel: turno.clienteTel,
              clienteId: turno.clienteId,
              presupuestoId: turno.presupuestoId,
            }}
          />
        </div>
      </main>
    </div>
  );
}
