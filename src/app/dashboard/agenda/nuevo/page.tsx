import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  TurnoForm,
  type TurnoFormInicial,
} from "@/components/agenda/turno-form";

export const metadata: Metadata = {
  title: "Nuevo turno — ObraApp",
};

export const dynamic = "force-dynamic";

export default async function NuevoTurnoPage({
  searchParams,
}: {
  searchParams: { presupuestoId?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Clientes y presupuestos del usuario para los selectores opcionales.
  const [clientes, presupuestos] = userId
    ? await Promise.all([
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
      ])
    : [[], []];

  // Si viene ?presupuestoId= (desde el detalle de un presupuesto), precargamos
  // el presupuesto y su cliente. Solo si realmente es del usuario.
  let inicial: TurnoFormInicial | undefined;
  const preseleccionado = searchParams.presupuestoId
    ? presupuestos.find((p) => p.id === searchParams.presupuestoId)
    : undefined;
  if (preseleccionado) {
    inicial = {
      titulo: preseleccionado.titulo,
      presupuestoId: preseleccionado.id,
      clienteId: preseleccionado.clienteId,
      clienteNombre: preseleccionado.clienteNombre,
      clienteEmail: preseleccionado.clienteEmail,
      clienteTel: preseleccionado.clienteTel,
    };
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
            Nuevo turno
          </span>
        </div>
      </header>

      <main className="container py-6">
        <div className="mx-auto w-full max-w-lg">
          <TurnoForm
            clientes={clientes}
            presupuestos={presupuestos}
            inicial={inicial}
          />
        </div>
      </main>
    </div>
  );
}
