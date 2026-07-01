import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { formatearPesos } from "@/lib/format";
import { agruparPorCategoria } from "@/lib/categorias";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FirmarBoton } from "@/app/presupuesto/[token]/firmar-boton";

export const metadata: Metadata = {
  title: "Presupuesto — ObraApp",
  // No indexar las páginas públicas de firma.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Página PÚBLICA de firma (sin login). El middleware no la protege.
export default async function FirmaPublicaPage({
  params,
}: {
  params: { token: string };
}) {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { tokenFirma: params.token },
    include: { items: true, user: { select: { name: true } } },
  });

  // Token inválido: mensaje amigable, sin filtrar detalles.
  if (!presupuesto) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 text-foreground">
        <Card className="w-full max-w-sm bg-card text-card-foreground">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No encontramos este presupuesto. Es posible que el enlace sea
            incorrecto o haya vencido.
          </CardContent>
        </Card>
      </main>
    );
  }

  const { grupos, unRubro } = agruparPorCategoria(presupuesto.items);
  const remitente = presupuesto.user.name ?? "Tu profesional";

  return (
    <main className="flex min-h-screen flex-col bg-muted text-foreground">
      {/* Marca */}
      <header className="border-b border-border bg-background">
        <div className="container flex items-center py-4">
          <span className="text-lg font-bold text-foreground">ObraApp</span>
        </div>
      </header>

      <div className="container flex flex-col gap-4 py-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {remitente} te envió un presupuesto
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            #{presupuesto.numero} · {presupuesto.titulo}
          </h1>
        </div>

        {/* Firma / confirmación */}
        <FirmarBoton
          token={params.token}
          yaFirmado={presupuesto.estado === "firmado"}
        />

        {/* Datos del cliente */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Para
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5 text-sm text-foreground">
            <span>{presupuesto.clienteNombre}</span>
            {presupuesto.clienteEmail && (
              <span className="text-muted-foreground">
                {presupuesto.clienteEmail}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Detalle */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Detalle
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {grupos.map((grupo) => (
              <div key={grupo.categoria} className="flex flex-col gap-2">
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
      </div>
    </main>
  );
}
