import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NuevoPresupuestoForm } from "@/components/presupuestos/nuevo-presupuesto-form";

export const metadata: Metadata = {
  title: "Nuevo presupuesto — ObraApp",
};

export default async function NuevoPresupuestoPage() {
  // El middleware ya protege /dashboard/*, pero necesitamos la sesión igual.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

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
        <NuevoPresupuestoForm tareas={tareas} />
      </main>
    </div>
  );
}
