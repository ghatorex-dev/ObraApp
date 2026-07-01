"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PenLine, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { firmarPresupuesto } from "@/app/presupuesto/[token]/actions";

// Botón de firma para la página pública. Si ya está firmado, muestra la
// confirmación en vez del botón.
export function FirmarBoton({
  token,
  yaFirmado,
}: {
  token: string;
  yaFirmado: boolean;
}) {
  const router = useRouter();
  const [firmado, setFirmado] = useState(yaFirmado);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarFirma() {
    setCargando(true);
    setError(null);
    const res = await firmarPresupuesto(token);
    setCargando(false);
    if (!res.ok) {
      setError(res.error ?? "No se pudo firmar. Probá de nuevo.");
      return;
    }
    setFirmado(true);
    // Refrescamos para reflejar el estado firmado en el servidor.
    router.refresh();
  }

  if (firmado) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
        <span className="font-medium">
          Presupuesto firmado y aceptado. ¡Gracias!
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button
        onClick={manejarFirma}
        disabled={cargando}
        size="lg"
        className="w-full gap-2"
      >
        {cargando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PenLine className="h-4 w-4" />
        )}
        Firmar y aceptar
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Al firmar aceptás este presupuesto. Se registrará la fecha y tu IP.
      </p>
    </div>
  );
}
