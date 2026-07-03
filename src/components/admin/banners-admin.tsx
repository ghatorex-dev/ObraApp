"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Categoria } from "@prisma/client";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIAS, etiquetaCategoria } from "@/lib/categorias";
import {
  crearBanner,
  actualizarBanner,
  alternarActivoBanner,
  eliminarBanner,
} from "@/app/admin/banners-actions";

// Banner tal como llega desde el server component.
export type BannerRow = {
  id: string;
  titulo: string;
  imagenUrl: string;
  linkDestino: string;
  categoria: Categoria | null;
  activo: boolean;
  orden: number;
};

type FormState = {
  titulo: string;
  imagenUrl: string;
  linkDestino: string;
  categoria: string; // "" = todas
  orden: string;
};

const FORM_VACIO: FormState = {
  titulo: "",
  imagenUrl: "",
  linkDestino: "",
  categoria: "",
  orden: "0",
};

export function BannersAdmin({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  // id del banner en edición, "nuevo" para alta, o null (form cerrado).
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  function abrirNuevo() {
    setForm(FORM_VACIO);
    setError(null);
    setEditando("nuevo");
  }

  function abrirEdicion(b: BannerRow) {
    setForm({
      titulo: b.titulo,
      imagenUrl: b.imagenUrl,
      linkDestino: b.linkDestino,
      categoria: b.categoria ?? "",
      orden: String(b.orden),
    });
    setError(null);
    setEditando(b.id);
  }

  function cerrar() {
    setEditando(null);
    setError(null);
  }

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const datos = {
      titulo: form.titulo,
      imagenUrl: form.imagenUrl,
      linkDestino: form.linkDestino,
      // El select solo tiene "" o un rubro válido.
      categoria: form.categoria as "" | Categoria,
      orden: form.orden.trim() === "" ? 0 : Number(form.orden),
    };

    setGuardando(true);
    const resultado =
      editando === "nuevo"
        ? await crearBanner(datos)
        : await actualizarBanner(editando!, datos);
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    cerrar();
    router.refresh();
  }

  async function alternar(id: string) {
    setOcupadoId(id);
    await alternarActivoBanner(id);
    setOcupadoId(null);
    router.refresh();
  }

  async function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este banner? No se puede deshacer.")) return;
    setOcupadoId(id);
    await eliminarBanner(id);
    setOcupadoId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Alta */}
      {editando === null && (
        <Button onClick={abrirNuevo} size="sm" className="w-fit gap-1.5">
          <Plus className="h-4 w-4" />
          Nuevo banner
        </Button>
      )}

      {/* Formulario de alta / edición */}
      {editando !== null && (
        <form
          onSubmit={guardar}
          className="flex flex-col gap-3 rounded-md border border-dashed border-border bg-background p-4"
        >
          <p className="text-sm font-medium text-foreground">
            {editando === "nuevo" ? "Nuevo banner" : "Editar banner"}
          </p>
          <div className="flex flex-col gap-1">
            <Label htmlFor="titulo" className="text-xs text-muted-foreground">
              Título
            </Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: 20% off en Ferretería XYZ"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="imagenUrl" className="text-xs text-muted-foreground">
              URL de la imagen
            </Label>
            <Input
              id="imagenUrl"
              type="url"
              inputMode="url"
              value={form.imagenUrl}
              onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
              placeholder="https://…/banner.jpg"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="linkDestino"
              className="text-xs text-muted-foreground"
            >
              URL de destino
            </Label>
            <Input
              id="linkDestino"
              type="url"
              inputMode="url"
              value={form.linkDestino}
              onChange={(e) =>
                setForm({ ...form, linkDestino: e.target.value })
              }
              placeholder="https://afiliado.com/…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="categoria"
                className="text-xs text-muted-foreground"
              >
                Rubro
              </Label>
              <select
                id="categoria"
                value={form.categoria}
                onChange={(e) =>
                  setForm({ ...form, categoria: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todas</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.etiqueta}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="orden" className="text-xs text-muted-foreground">
                Orden
              </Label>
              <Input
                id="orden"
                type="number"
                min="0"
                step="1"
                value={form.orden}
                onChange={(e) => setForm({ ...form, orden: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={guardando} className="gap-1.5">
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="bg-background text-foreground"
              onClick={cerrar}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Listado */}
      {banners.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay banners cargados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Título</th>
                <th className="py-2 pr-3 font-medium">Rubro</th>
                <th className="py-2 pr-3 font-medium">Orden</th>
                <th className="py-2 pr-3 font-medium">Estado</th>
                <th className="py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 text-foreground">{b.titulo}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {b.categoria ? etiquetaCategoria(b.categoria) : "Todas"}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{b.orden}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.activo
                          ? "bg-green-100 text-green-800"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {b.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-foreground"
                        disabled={ocupadoId === b.id}
                        onClick={() => alternar(b.id)}
                      >
                        {b.activo ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground"
                        aria-label={`Editar ${b.titulo}`}
                        onClick={() => abrirEdicion(b)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Eliminar ${b.titulo}`}
                        disabled={ocupadoId === b.id}
                        onClick={() => eliminar(b.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
