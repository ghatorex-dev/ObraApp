import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MaterialForm } from "@/components/inventario/material-form";

export const metadata: Metadata = {
  title: "Editar material — ObraApp",
};

export const dynamic = "force-dynamic";

export default async function EditarMaterialPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  // Material del usuario (pertenencia verificada en el where).
  const material = await prisma.material.findFirst({
    where: { id: params.id, userId },
    select: {
      id: true,
      nombre: true,
      categoria: true,
      unidad: true,
      stockActual: true,
      stockMinimo: true,
    },
  });

  if (!material) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center gap-3 py-4">
          <Link
            href="/dashboard/inventario"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="text-lg font-bold text-foreground">
            Editar material
          </span>
        </div>
      </header>

      <main className="container py-6">
        <div className="mx-auto w-full max-w-lg">
          <MaterialForm inicial={material} />
        </div>
      </main>
    </div>
  );
}
