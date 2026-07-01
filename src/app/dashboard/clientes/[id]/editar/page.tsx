import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClienteForm } from "@/components/clientes/cliente-form";

export const metadata: Metadata = {
  title: "Editar cliente — ObraApp",
};

export const dynamic = "force-dynamic";

export default async function EditarClientePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  const cliente = await prisma.cliente.findFirst({
    where: { id: params.id, userId },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      email: true,
      direccion: true,
      notas: true,
    },
  });

  if (!cliente) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center gap-3 py-4">
          <Link
            href={`/dashboard/clientes/${cliente.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="text-lg font-bold text-foreground">
            Editar cliente
          </span>
        </div>
      </header>

      <main className="container py-6">
        <div className="mx-auto w-full max-w-lg">
          <ClienteForm inicial={cliente} />
        </div>
      </main>
    </div>
  );
}
