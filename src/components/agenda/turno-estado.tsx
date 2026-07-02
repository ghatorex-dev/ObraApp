"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  TRANSICIONES_TURNO,
  ACCION_ESTADO_TURNO,
} from "@/lib/estados-turno";
import { cambiarEstadoTurno } from "@/app/dashboard/agenda/actions";

// Botones de cambio rápido de estado según las transiciones válidas del
// estado actual, sin abrir el formulario completo.
export function TurnoEstado({
  turnoId,
  estado,
}: {
  turnoId: string;
  estado: string;
}) {
  const router = useRouter();
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transiciones = TRANSICIONES_TURNO[estado] ?? [];
  if (transiciones.length === 0) return null;

  async function cambiar(nuevo: string) {
    setError(null);
    setCambiando(nuevo);
    const resultado = await cambiarEstadoTurno(turnoId, nuevo);
    setCambiando(null);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {transiciones.map((destino) => (
          <Button
            key={destino}
            type="button"
            size="sm"
            variant={destino === "cancelado" ? "outline" : "default"}
            disabled={cambiando !== null}
            onClick={() => cambiar(destino)}
            className={
              destino === "cancelado"
                ? "gap-1.5 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
                : "gap-1.5"
            }
          >
            {cambiando === destino && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            {ACCION_ESTADO_TURNO[destino] ?? destino}
          </Button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
