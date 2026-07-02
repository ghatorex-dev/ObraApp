"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import type { Categoria } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  crearTareaPropia,
  type TareaPropia,
} from "@/app/dashboard/presupuestos/nuevo/tareas-actions";

// Mini-form para crear una tarea propia dentro del rubro, sin salir del
// formulario de presupuesto. Al guardarla, avisa al padre con la tarea creada.
export function AgregarTareaPropia({
  categoria,
  onCreada,
}: {
  categoria: Categoria;
  onCreada: (tarea: TareaPropia) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [unidad, setUnidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function crear() {
    setError(null);
    if (!descripcion.trim()) {
      setError("Ingresá la descripción de la tarea.");
      return;
    }
    if (!unidad.trim()) {
      setError("Ingresá la unidad (ej: hora, m2, unidad).");
      return;
    }

    setGuardando(true);
    const resultado = await crearTareaPropia({
      descripcion,
      unidad,
      categoria,
      precioRef: precio.trim() === "" ? undefined : Number(precio),
    });
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    onCreada(resultado.tarea);
    setDescripcion("");
    setUnidad("");
    setPrecio("");
    setAbierto(false);
  }

  if (!abierto) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit gap-1.5 bg-background text-foreground"
        onClick={() => setAbierto(true)}
      >
        <Plus className="h-4 w-4" />
        Agregar tarea nueva
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-dashed border-border bg-background p-3">
      <p className="text-sm font-medium text-foreground">Nueva tarea propia</p>
      <div className="flex flex-col gap-1">
        <Label
          htmlFor={`nueva-desc-${categoria}`}
          className="text-xs text-muted-foreground"
        >
          Descripción
        </Label>
        <Input
          id={`nueva-desc-${categoria}`}
          placeholder="Ej: Cambio de rejilla de piso"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label
            htmlFor={`nueva-unidad-${categoria}`}
            className="text-xs text-muted-foreground"
          >
            Unidad
          </Label>
          <Input
            id={`nueva-unidad-${categoria}`}
            placeholder="Ej: unidad, m2, hora"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label
            htmlFor={`nueva-precio-${categoria}`}
            className="text-xs text-muted-foreground"
          >
            Precio ref. (opcional)
          </Label>
          <Input
            id={`nueva-precio-${categoria}`}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="Ej: 15000"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={guardando}
          onClick={crear}
          className="gap-1.5"
        >
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar tarea
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="bg-background text-foreground"
          onClick={() => {
            setAbierto(false);
            setError(null);
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
