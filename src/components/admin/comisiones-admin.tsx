"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { marcarComisionPagada } from "@/app/admin/comisiones-actions";

// Comisión lista para pagar, tal como llega desde el server component.
export type ComisionRow = {
  id: string;
  referidorEmail: string;
  referidoEmail: string;
  monto: number;
  fechaComisionable: string; // ya formateada en el server
};

function formatearUsd(monto: number): string {
  return `US$ ${monto.toFixed(2)}`;
}

export function ComisionesAdmin({ comisiones }: { comisiones: ComisionRow[] }) {
  const router = useRouter();
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pagar(id: string) {
    setError(null);
    setOcupadoId(id);
    const resultado = await marcarComisionPagada(id);
    setOcupadoId(null);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  if (comisiones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay comisiones listas para pagar.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Referidor (cobra)</th>
              <th className="py-2 pr-3 font-medium">Referido</th>
              <th className="py-2 pr-3 font-medium">Monto</th>
              <th className="py-2 pr-3 font-medium">Comisionable desde</th>
              <th className="py-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {comisiones.map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <td className="py-2 pr-3 text-foreground">{c.referidorEmail}</td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {c.referidoEmail}
                </td>
                <td className="py-2 pr-3 font-medium text-foreground">
                  {formatearUsd(c.monto)}
                </td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {c.fechaComisionable}
                </td>
                <td className="py-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={ocupadoId === c.id}
                    className="gap-1.5"
                    onClick={() => pagar(c.id)}
                  >
                    {ocupadoId === c.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Marcar pagada
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
