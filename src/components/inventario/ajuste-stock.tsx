"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ajustarStock } from "@/app/dashboard/inventario/actions";

// Ajuste rápido de stock desde el listado: botones − / + con una cantidad
// editable (por defecto 1), sin entrar al formulario completo.
export function AjusteStock({ materialId }: { materialId: string }) {
  const router = useRouter();
  const [cantidad, setCantidad] = useState("1");
  const [ajustando, setAjustando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ajustar(signo: 1 | -1) {
    setError(null);
    const n = parseFloat(cantidad);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Cantidad inválida.");
      return;
    }

    setAjustando(true);
    const resultado = await ajustarStock(materialId, signo * n);
    setAjustando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    // Refrescamos el server component para ver el stock nuevo.
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background text-foreground"
          aria-label="Restar stock"
          disabled={ajustando}
          onClick={() => ajustar(-1)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          aria-label="Cantidad a ajustar"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="h-8 w-16 text-center"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background text-foreground"
          aria-label="Sumar stock"
          disabled={ajustando}
          onClick={() => ajustar(1)}
        >
          {ajustando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
