"use client";

import { useState } from "react";
import { Check, Copy, Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Datos del programa de referidos que llegan desde el server component.
export type ReferidosCardProps = {
  codigo: string;
  cantidadReferidos: number;
  pendientes: number;
  listasParaPagar: number;
  pagadas: number;
  montoPorCobrar: number;
  montoCobrado: number;
  totalAcumulado: number;
};

// Formatea un monto en dólares (las comisiones son en USD, no en pesos).
function formatearUsd(monto: number): string {
  return `US$ ${monto.toFixed(2)}`;
}

export function ReferidosCard({
  codigo,
  cantidadReferidos,
  pendientes,
  listasParaPagar,
  pagadas,
  montoPorCobrar,
  montoCobrado,
  totalAcumulado,
}: ReferidosCardProps) {
  const [copiado, setCopiado] = useState(false);

  // Construimos el link en el cliente con el origin actual (sin depender de env).
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/registro?ref=${codigo}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* si el navegador bloquea el portapapeles, no hacemos nada */
    }
  }

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
          <Gift className="h-4 w-4" aria-hidden />
          Invitá y ganá
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Compartí tu link. Por cada persona que se registre, se haga Pro y se
          mantenga Pro 30 días, ganás {formatearUsd(0.49)} una sola vez.
        </p>

        {/* Link + botón de copiar */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={link}
            aria-label="Tu link de referido"
            onFocus={(e) => e.currentTarget.select()}
            className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <Button
            type="button"
            onClick={copiar}
            className="shrink-0 gap-1.5"
          >
            {copiado ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>

        {/* Estados de las comisiones */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex flex-col rounded-md border border-border bg-background p-3">
            <span className="text-xs text-muted-foreground">Referidos</span>
            <span className="text-lg font-bold text-foreground">
              {cantidadReferidos}
            </span>
          </div>
          <div className="flex flex-col rounded-md border border-border bg-background p-3">
            <span className="text-xs text-muted-foreground">Pendientes</span>
            <span className="text-lg font-bold text-foreground">
              {pendientes}
            </span>
          </div>
          <div className="flex flex-col rounded-md border border-border bg-background p-3">
            <span className="text-xs text-muted-foreground">Por cobrar</span>
            <span className="text-lg font-bold text-foreground">
              {listasParaPagar}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatearUsd(montoPorCobrar)}
            </span>
          </div>
          <div className="flex flex-col rounded-md border border-border bg-background p-3">
            <span className="text-xs text-muted-foreground">Cobradas</span>
            <span className="text-lg font-bold text-foreground">{pagadas}</span>
            <span className="text-xs text-muted-foreground">
              {formatearUsd(montoCobrado)}
            </span>
          </div>
          <div className="col-span-2 flex flex-col rounded-md border border-primary/30 bg-primary/5 p-3 sm:col-span-1">
            <span className="text-xs text-muted-foreground">
              Total acumulado
            </span>
            <span className="text-lg font-bold text-foreground">
              {formatearUsd(totalAcumulado)}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          El pago de las comisiones se coordina de forma manual. Cuando una
          comisión pasa a &quot;por cobrar&quot;, nos ponemos en contacto para
          transferirte el monto.
        </p>
      </CardContent>
    </Card>
  );
}
