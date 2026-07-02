"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Categoria } from "@prisma/client";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIAS } from "@/lib/categorias";
import {
  crearMaterial,
  actualizarMaterial,
  eliminarMaterial,
} from "@/app/dashboard/inventario/actions";

// Valores iniciales del formulario (para edición).
export type MaterialInicial = {
  id: string;
  nombre: string;
  categoria: Categoria;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
};

// Convierte un texto a número, devolviendo NaN si no es válido (el server
// action valida de nuevo con Zod).
function aNumero(texto: string): number {
  return parseFloat(texto);
}

// Formulario reutilizable para alta, edición y baja de materiales.
export function MaterialForm({ inicial }: { inicial?: MaterialInicial }) {
  const router = useRouter();
  const esEdicion = Boolean(inicial);

  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [categoria, setCategoria] = useState<Categoria>(
    inicial?.categoria ?? "plomeria",
  );
  const [unidad, setUnidad] = useState(inicial?.unidad ?? "");
  const [stockActual, setStockActual] = useState(
    inicial != null ? String(inicial.stockActual) : "0",
  );
  const [stockMinimo, setStockMinimo] = useState(
    inicial != null ? String(inicial.stockMinimo) : "0",
  );

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  // Confirmación en dos pasos para la baja (sin modal, simple y mobile-first).
  const [confirmarBaja, setConfirmarBaja] = useState(false);

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("Ingresá el nombre del material.");
      return;
    }
    if (!unidad.trim()) {
      setError("Ingresá la unidad (ej: unidad, metro, litro, kg).");
      return;
    }

    const datos = {
      nombre,
      categoria,
      unidad,
      stockActual: aNumero(stockActual),
      stockMinimo: aNumero(stockMinimo),
    };

    setGuardando(true);
    const resultado = esEdicion
      ? await actualizarMaterial(inicial!.id, datos)
      : await crearMaterial(datos);
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.push("/dashboard/inventario");
    router.refresh();
  }

  async function eliminar() {
    if (!inicial) return;
    // Primer toque: pide confirmación. Segundo toque: elimina.
    if (!confirmarBaja) {
      setConfirmarBaja(true);
      return;
    }

    setError(null);
    setEliminando(true);
    const resultado = await eliminarMaterial(inicial.id);
    setEliminando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      setConfirmarBaja(false);
      return;
    }

    router.push("/dashboard/inventario");
    router.refresh();
  }

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-lg text-card-foreground">
          {esEdicion ? "Editar material" : "Nuevo material"}
        </CardTitle>
        <CardDescription>
          Cuando el stock actual queda en o por debajo del mínimo, lo vas a ver
          marcado en rojo en el listado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre" className="text-foreground">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Caño PVC 110mm"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="categoria" className="text-foreground">
              Rubro <span className="text-destructive">*</span>
            </Label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="unidad" className="text-foreground">
              Unidad <span className="text-destructive">*</span>
            </Label>
            <Input
              id="unidad"
              placeholder="Ej: unidad, metro, litro, kg"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="stockActual" className="text-foreground">
                Stock actual
              </Label>
              <Input
                id="stockActual"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stockMinimo" className="text-foreground">
                Stock mínimo
              </Label>
              <Input
                id="stockMinimo"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={guardando} className="gap-2">
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {guardando
                ? "Guardando…"
                : esEdicion
                  ? "Guardar cambios"
                  : "Crear material"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-background text-foreground"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            {esEdicion && (
              <Button
                type="button"
                variant="destructive"
                disabled={eliminando}
                onClick={eliminar}
                className="gap-2"
              >
                {eliminando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {confirmarBaja ? "¿Seguro? Tocá de nuevo" : "Eliminar"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
