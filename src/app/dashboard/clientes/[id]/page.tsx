import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, Pencil, FileText, Mail, Phone, MapPin } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatearPesos } from "@/lib/format";
import { estiloEstado } from "@/lib/estados";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cliente — ObraApp",
};

export const dynamic = "force-dynamic";

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function ClienteDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  // Cliente del usuario con su historial de presupuestos (más recientes primero).
  const cliente = await prisma.cliente.findFirst({
    where: { id: params.id, userId },
    include: {
      presupuestos: {
        orderBy: { creadoAt: "desc" },
        select: {
          id: true,
          numero: true,
          titulo: true,
          estado: true,
          total: true,
          creadoAt: true,
        },
      },
    },
  });

  if (!cliente) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Encabezado */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/clientes"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            <span className="text-lg font-bold text-foreground">Cliente</span>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 bg-background text-foreground">
            <Link href={`/dashboard/clientes/${cliente.id}/editar`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container flex flex-col gap-6 py-6">
        {/* Datos del cliente */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-xl text-card-foreground">
              {cliente.nombre}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-foreground">
            {cliente.telefono && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" aria-hidden />
                {cliente.telefono}
              </p>
            )}
            {cliente.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
                {cliente.email}
              </p>
            )}
            {cliente.direccion && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
                {cliente.direccion}
              </p>
            )}
            {cliente.notas && (
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {cliente.notas}
              </p>
            )}
            {!cliente.telefono &&
              !cliente.email &&
              !cliente.direccion &&
              !cliente.notas && (
                <p className="text-muted-foreground">
                  Sin datos de contacto cargados.
                </p>
              )}
          </CardContent>
        </Card>

        {/* Historial de presupuestos */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">
            Historial de presupuestos
          </h2>

          {cliente.presupuestos.length === 0 ? (
            <Card className="bg-card text-card-foreground">
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <FileText
                  className="h-7 w-7 text-muted-foreground"
                  aria-hidden
                />
                <p className="text-sm text-muted-foreground">
                  Este cliente todavía no tiene presupuestos asociados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {cliente.presupuestos.map((p) => {
                const estado = estiloEstado(p.estado);
                return (
                  <li key={p.id}>
                    <Link href={`/dashboard/presupuestos/${p.id}`}>
                      <Card className="bg-card text-card-foreground transition-colors hover:bg-accent">
                        <CardContent className="flex items-center justify-between gap-3 py-4">
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-foreground">
                              #{p.numero} · {p.titulo}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatoFecha.format(p.creadoAt)}
                            </span>
                          </div>
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
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
