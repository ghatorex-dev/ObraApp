import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NuevoPresupuestoForm } from "@/components/presupuestos/nuevo-presupuesto-form";

export const metadata: Metadata = {
  title: "Nuevo presupuesto — ObraApp",
};

// Consulta el catálogo en la base en cada request: no se prerrenderiza.
export const dynamic = "force-dynamic";

// El acceso lo protege el middleware; el server action revalida la sesión
// al guardar. Acá NO redirigimos para no arriesgar loops de redirección.
export default async function NuevoPresupuestoPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Traemos solo las tareas activas del catálogo comunitario.
  const tareas = await prisma.tareaComunitaria.findMany({
    where: { activa: true },
    orderBy: [{ categoria: "asc" }, { descripcion: "asc" }],
    select: {
      id: true,
      descripcion: true,
      unidad: true,
      precioRef: true,
      categoria: true,
    },
  });

  // Clientes del usuario para el selector (opcional) del paso 1.
  const clientes = userId
    ? await prisma.cliente.findMany({
        where: { userId },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, telefono: true, email: true },
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
          <span className="text-lg font-bold text-foreground">
            Nuevo presupuesto
          </span>
        </div>
      </header>

      <main className="container py-6">
        <NuevoPresupuestoForm tareas={tareas} clientes={clientes} />
      </main>
    </div>
  );
}
