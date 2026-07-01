import type { Metadata } from "next";
import { CheckCircle2, Send, FileText, XCircle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatearPesos } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Seguimiento — ObraApp",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Configuración visual (texto Y fondo explícitos) por estado.
const VISTA_ESTADO: Record<
  string,
  { titulo: string; detalle: string; clase: string }
> = {
  borrador: {
    titulo: "En preparación",
    detalle: "El presupuesto todavía se está preparando.",
    clase: "bg-muted text-muted-foreground",
  },
  enviado: {
    titulo: "Enviado",
    detalle: "El presupuesto fue enviado y está a la espera de tu firma.",
    clase: "bg-primary/10 text-primary",
  },
  firmado: {
    titulo: "Firmado",
    detalle: "El presupuesto fue firmado y aceptado.",
    clase: "bg-green-100 text-green-800",
  },
  cancelado: {
    titulo: "Cancelado",
    detalle: "Este presupuesto fue cancelado.",
    clase: "bg-destructive/10 text-destructive",
  },
};

function IconoEstado({ estado }: { estado: string }) {
  const clase = "h-6 w-6 shrink-0";
  if (estado === "firmado")
    return <CheckCircle2 className={`${clase} text-green-700`} aria-hidden />;
  if (estado === "enviado")
    return <Send className={`${clase} text-primary`} aria-hidden />;
  if (estado === "cancelado")
    return <XCircle className={`${clase} text-destructive`} aria-hidden />;
  return <FileText className={`${clase} text-muted-foreground`} aria-hidden />;
}

// Página PÚBLICA de seguimiento (solo lectura). Muestra el estado actual.
export default async function SeguimientoPage({
  params,
}: {
  params: { token: string };
}) {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { tokenFirma: params.token },
    select: {
      numero: true,
      titulo: true,
      estado: true,
      total: true,
      clienteNombre: true,
    },
  });

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

  const vista = VISTA_ESTADO[presupuesto.estado] ?? VISTA_ESTADO.borrador;

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted px-4 py-10 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-lg font-bold text-foreground">ObraApp</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Seguimiento del presupuesto
          </p>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardContent className="flex flex-col gap-4 py-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Para {presupuesto.clienteNombre}
              </p>
              <h1 className="text-lg font-bold text-foreground">
                #{presupuesto.numero} · {presupuesto.titulo}
              </h1>
            </div>

            <div className="flex items-center gap-3 rounded-md border border-border p-3">
              <IconoEstado estado={presupuesto.estado} />
              <div className="flex flex-col">
                <span
                  className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${vista.clase}`}
                >
                  {vista.titulo}
                </span>
                <span className="mt-1 text-sm text-muted-foreground">
                  {vista.detalle}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-base font-bold text-foreground">
                {formatearPesos(presupuesto.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
