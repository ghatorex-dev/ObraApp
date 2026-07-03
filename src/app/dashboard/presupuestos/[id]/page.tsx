import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatearPesos } from "@/lib/format";
import { agruparPorCategoria } from "@/lib/categorias";
import { BannersAfiliados } from "@/components/banners/banners-afiliados";
import { estiloEstado } from "@/lib/estados";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PresupuestoAcciones } from "@/components/presupuestos/presupuesto-acciones";

export const metadata: Metadata = {
  title: "Presupuesto — ObraApp",
};

export const dynamic = "force-dynamic";

const formatoFechaHora = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function DetallePresupuestoPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Solo el dueño puede ver el presupuesto (control de acceso por userId).
  const presupuesto = userId
    ? await prisma.presupuesto.findFirst({
        where: { id: params.id, userId },
        include: {
          items: { include: { material: { select: { nombre: true, unidad: true } } } },
        },
      })
    : null;

  if (!presupuesto) notFound();

  const { grupos, unRubro } = agruparPorCategoria(presupuesto.items);
  const estado = estiloEstado(presupuesto.estado);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Encabezado */}
      <header className="border-b border-border">
        <div className="container flex items-center py-4">
          <Link
            href="/dashboard/presupuestos"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Presupuestos
          </Link>
        </div>
      </header>

      <main className="container flex flex-col gap-4 py-6">
        {/* Título + estado */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              #{presupuesto.numero} · {presupuesto.titulo}
            </h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}
            >
              {estado.etiqueta}
            </span>
            {presupuesto.esEjemplo && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Ejemplo
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <PresupuestoAcciones
          id={presupuesto.id}
          estado={presupuesto.estado}
          esEjemplo={presupuesto.esEjemplo}
          tokenFirma={presupuesto.tokenFirma}
        />

        {/* Agendar un turno con este presupuesto y su cliente precargados. */}
        {!presupuesto.esEjemplo && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-fit gap-1.5 bg-background text-foreground"
          >
            <Link
              href={`/dashboard/agenda/nuevo?presupuestoId=${presupuesto.id}`}
            >
              <CalendarDays className="h-4 w-4" />
              Agendar turno
            </Link>
          </Button>
        )}

        {/* Firma registrada */}
        {presupuesto.estado === "firmado" && presupuesto.firmadoAt && (
          <Card className="border-green-200 bg-green-50 text-green-900">
            <CardContent className="py-4 text-sm">
              <p className="font-medium">
                Firmado el {formatoFechaHora.format(presupuesto.firmadoAt)}
              </p>
              {presupuesto.clienteIp && (
                <p className="text-xs text-green-800">
                  IP del cliente: {presupuesto.clienteIp}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Datos del cliente */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5 text-sm text-foreground">
            <span>{presupuesto.clienteNombre}</span>
            {presupuesto.clienteEmail && (
              <span className="text-muted-foreground">
                {presupuesto.clienteEmail}
              </span>
            )}
            {presupuesto.clienteTel && (
              <span className="text-muted-foreground">
                {presupuesto.clienteTel}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Detalle: ítems agrupados por rubro */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Detalle
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {grupos.map((grupo) => (
              <div key={grupo.categoria} className="flex flex-col gap-2">
                {/* Subtítulo de rubro solo si hay más de un rubro. */}
                {!unRubro && (
                  <h3 className="text-sm font-semibold text-foreground">
                    {grupo.etiqueta}
                  </h3>
                )}
                <ul className="flex flex-col gap-2">
                  {grupo.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="text-foreground">
                          {item.descripcion}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.cantidad} x{" "}
                          {formatearPesos(item.precioUnitario)}
                        </span>
                        {item.material && item.cantidadUsada != null && (
                          <span className="text-xs text-muted-foreground">
                            Usa {item.cantidadUsada} {item.material.unidad} de{" "}
                            {item.material.nombre}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 font-medium text-foreground">
                        {formatearPesos(item.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>
                {!unRubro && (
                  <div className="flex justify-between border-t border-border pt-2 text-sm">
                    <span className="text-muted-foreground">
                      Subtotal {grupo.etiqueta}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatearPesos(grupo.subtotal)}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Total general */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-base font-semibold text-foreground">
                Total
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatearPesos(presupuesto.total)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        {presupuesto.notas && (
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-base text-card-foreground">
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {presupuesto.notas}
            </CardContent>
          </Card>
        )}

        {/* Banners de afiliados de los rubros de este presupuesto + genéricos
            (si no hay ninguno, no renderiza nada). */}
        <BannersAfiliados categorias={grupos.map((g) => g.categoria)} />
      </main>
    </div>
  );
}
