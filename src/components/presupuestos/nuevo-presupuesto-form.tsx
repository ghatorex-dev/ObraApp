"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Categoria } from "@prisma/client";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIAS, etiquetaCategoria } from "@/lib/categorias";
import { formatearPesos } from "@/lib/format";
import { crearPresupuesto } from "@/app/dashboard/presupuestos/nuevo/actions";
import { UpgradeModal } from "@/components/plan/upgrade-modal";
import { AgregarTareaPropia } from "@/components/presupuestos/agregar-tarea-propia";

// Tarea del catálogo tal como llega desde el servidor.
type Tarea = {
  id: string;
  descripcion: string;
  unidad: string;
  precioRef: number | null;
  categoria: Categoria;
};

// Cliente del usuario para el selector opcional del paso 1.
type ClienteOpcion = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
};

// Material del inventario para el selector opcional por tarea.
type MaterialOpcion = {
  id: string;
  nombre: string;
  unidad: string;
  stockActual: number;
};

// Estado editable de una tarea seleccionada. Guardamos strings para que los
// inputs numéricos se comporten bien mientras el usuario escribe.
type SeleccionItem = {
  cantidad: string;
  precioUnitario: string;
  // Material del inventario asociado (opcional) y cuánto se usa.
  materialId: string;
  cantidadUsada: string;
};

// Convierte un texto a número, devolviendo 0 si no es válido.
function aNumero(texto: string): number {
  const n = parseFloat(texto);
  return Number.isFinite(n) ? n : 0;
}

export function NuevoPresupuestoForm({
  tareas,
  clientes,
  materiales,
}: {
  tareas: Tarea[];
  clientes: ClienteOpcion[];
  materiales: MaterialOpcion[];
}) {
  const router = useRouter();

  // Datos del cliente y del presupuesto.
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteTel, setClienteTel] = useState("");
  const [titulo, setTitulo] = useState("");

  // Cliente asociado (opcional). "" = cliente nuevo (datos sueltos).
  const [clienteId, setClienteId] = useState("");
  // Si es cliente nuevo, permite guardarlo en la agenda de clientes.
  const [guardarComoCliente, setGuardarComoCliente] = useState(false);

  // Cambia el cliente seleccionado. Si es uno existente, precarga sus datos.
  function seleccionarCliente(id: string) {
    setClienteId(id);
    if (id) {
      const c = clientes.find((x) => x.id === id);
      if (c) {
        setClienteNombre(c.nombre);
        setClienteEmail(c.email ?? "");
        setClienteTel(c.telefono ?? "");
      }
      setGuardarComoCliente(false);
    }
  }

  // Rubros elegidos y tareas seleccionadas (por id de tarea).
  const [rubros, setRubros] = useState<Categoria[]>([]);
  const [seleccion, setSeleccion] = useState<Record<string, SeleccionItem>>({});

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // Modal de upgrade: se abre al alcanzar el límite del plan Free.
  const [mostrarModalPro, setMostrarModalPro] = useState(false);

  // Tareas propias creadas durante esta sesión (se agregan al vuelo al form
  // y ya quedan persistidas para la próxima vez).
  const [tareasExtra, setTareasExtra] = useState<Tarea[]>([]);

  // Todas las tareas disponibles: las precargadas (comunitarias + propias que
  // ya existían) más las que el usuario cree ahora.
  const todasLasTareas = useMemo(
    () => [...tareas, ...tareasExtra],
    [tareas, tareasExtra],
  );

  // Agrupamos las tareas por rubro (nunca se mezclan entre rubros).
  const tareasPorRubro = useMemo(() => {
    const mapa: Record<string, Tarea[]> = {};
    for (const tarea of todasLasTareas) {
      (mapa[tarea.categoria] ??= []).push(tarea);
    }
    return mapa;
  }, [todasLasTareas]);

  // Total calculado automáticamente a partir de las tareas seleccionadas.
  const total = useMemo(() => {
    let acumulado = 0;
    for (const item of Object.values(seleccion)) {
      acumulado += aNumero(item.cantidad) * aNumero(item.precioUnitario);
    }
    return acumulado;
  }, [seleccion]);

  const cantidadSeleccionadas = Object.keys(seleccion).length;

  // Activa o desactiva un rubro. Al desactivarlo, se quitan también las
  // tareas de ese rubro que estuvieran seleccionadas.
  function alternarRubro(rubro: Categoria) {
    if (rubros.includes(rubro)) {
      setRubros(rubros.filter((r) => r !== rubro));
      setSeleccion((previa) => {
        const copia = { ...previa };
        for (const tarea of tareas) {
          if (tarea.categoria === rubro) {
            delete copia[tarea.id];
          }
        }
        return copia;
      });
    } else {
      setRubros([...rubros, rubro]);
    }
  }

  // Marca o desmarca una tarea. Al marcarla, precarga cantidad 1 y el precio
  // de referencia (si existe).
  function alternarTarea(tarea: Tarea) {
    setSeleccion((previa) => {
      const copia = { ...previa };
      if (copia[tarea.id]) {
        delete copia[tarea.id];
      } else {
        copia[tarea.id] = {
          cantidad: "1",
          precioUnitario: tarea.precioRef != null ? String(tarea.precioRef) : "",
          materialId: "",
          cantidadUsada: "",
        };
      }
      return copia;
    });
  }

  function actualizarItem(
    tareaId: string,
    campo: keyof SeleccionItem,
    valor: string,
  ) {
    setSeleccion((previa) => ({
      ...previa,
      [tareaId]: { ...previa[tareaId], [campo]: valor },
    }));
  }

  async function guardar() {
    setError(null);

    if (!clienteNombre.trim()) {
      setError("Ingresá el nombre del cliente.");
      return;
    }
    if (!titulo.trim()) {
      setError("Ingresá un título para el presupuesto.");
      return;
    }
    if (cantidadSeleccionadas === 0) {
      setError("Seleccioná al menos una tarea.");
      return;
    }

    // Armamos los ítems a partir de la selección.
    const items = Object.entries(seleccion).map(([tareaId, valores]) => {
      const tarea = todasLasTareas.find((t) => t.id === tareaId)!;
      // El material va solo si se eligió uno y se cargó cantidad usada.
      const usaMaterial =
        valores.materialId !== "" && aNumero(valores.cantidadUsada) > 0;
      return {
        descripcion: tarea.descripcion,
        cantidad: aNumero(valores.cantidad),
        precioUnitario: aNumero(valores.precioUnitario),
        categoria: tarea.categoria,
        materialId: usaMaterial ? valores.materialId : undefined,
        cantidadUsada: usaMaterial ? aNumero(valores.cantidadUsada) : undefined,
      };
    });

    if (items.some((i) => i.cantidad <= 0)) {
      setError("Las cantidades deben ser mayores a 0.");
      return;
    }

    setGuardando(true);
    const resultado = await crearPresupuesto({
      titulo,
      clienteNombre,
      clienteEmail: clienteEmail || undefined,
      clienteTel: clienteTel || undefined,
      clienteId: clienteId || undefined,
      // Solo aplica cuando es cliente nuevo (sin clienteId).
      guardarComoCliente: clienteId ? undefined : guardarComoCliente,
      items,
    });
    setGuardando(false);

    if (!resultado.ok) {
      // Si alcanzó el límite del plan Free, mostramos el modal de upgrade.
      if (resultado.limiteAlcanzado) {
        setMostrarModalPro(true);
      } else {
        setError(resultado.error);
      }
      return;
    }

    // Guardado con éxito: volvemos al panel.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-28">
      {/* 1) Datos del cliente */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground">
            Datos del cliente
          </CardTitle>
          <CardDescription>¿Para quién es el presupuesto?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Selector de cliente existente (opcional). Solo si hay clientes. */}
          {clientes.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="clienteExistente" className="text-foreground">
                Cliente
              </Label>
              <select
                id="clienteExistente"
                value={clienteId}
                onChange={(e) => seleccionarCliente(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">➕ Cliente nuevo</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="clienteNombre" className="text-foreground">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="clienteNombre"
              placeholder="Ej: María González"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              disabled={Boolean(clienteId)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="clienteEmail" className="text-foreground">
              Email <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="clienteEmail"
              type="email"
              inputMode="email"
              placeholder="cliente@ejemplo.com"
              value={clienteEmail}
              onChange={(e) => setClienteEmail(e.target.value)}
              disabled={Boolean(clienteId)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="clienteTel" className="text-foreground">
              Teléfono{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="clienteTel"
              type="tel"
              inputMode="tel"
              placeholder="Ej: 11 2345-6789"
              value={clienteTel}
              onChange={(e) => setClienteTel(e.target.value)}
              disabled={Boolean(clienteId)}
            />
          </div>

          {/* Guardar como cliente nuevo (solo si NO se eligió uno existente). */}
          {!clienteId && (
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={guardarComoCliente}
                onCheckedChange={(v) => setGuardarComoCliente(v === true)}
              />
              <span className="text-sm text-foreground">
                Guardar como cliente nuevo
              </span>
            </label>
          )}
        </CardContent>
      </Card>

      {/* 2) Título del presupuesto */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground">
            Título
          </CardTitle>
          <CardDescription>Un nombre para identificar el trabajo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo" className="text-foreground">
              Título del presupuesto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titulo"
              placeholder="Ej: Refacción de baño"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3) Selección de rubros */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground">Rubros</CardTitle>
          <CardDescription>
            Elegí uno o más rubros. Vas a ver solo las tareas de esos rubros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((categoria) => {
              const activo = rubros.includes(categoria.valor);
              return (
                <Button
                  key={categoria.valor}
                  type="button"
                  variant={activo ? "default" : "outline"}
                  size="sm"
                  className={
                    activo
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground"
                  }
                  onClick={() => alternarRubro(categoria.valor)}
                >
                  {categoria.etiqueta}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4) Tareas por rubro (separadas, nunca mezcladas) */}
      {CATEGORIAS.filter((c) => rubros.includes(c.valor)).map((categoria) => {
        const tareasDelRubro = tareasPorRubro[categoria.valor] ?? [];
        return (
          <Card
            key={categoria.valor}
            className="bg-card text-card-foreground"
          >
            <CardHeader>
              <CardTitle className="text-base text-card-foreground">
                {categoria.etiqueta}
              </CardTitle>
              <CardDescription>
                Seleccioná las tareas y ajustá cantidad y precio.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {tareasDelRubro.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay tareas precargadas para este rubro.
                </p>
              )}

              {tareasDelRubro.map((tarea) => {
                const item = seleccion[tarea.id];
                const seleccionada = Boolean(item);
                const subtotal = item
                  ? aNumero(item.cantidad) * aNumero(item.precioUnitario)
                  : 0;

                return (
                  <div
                    key={tarea.id}
                    className="rounded-md border border-border bg-background p-3"
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <Checkbox
                        checked={seleccionada}
                        onCheckedChange={() => alternarTarea(tarea)}
                        className="mt-0.5"
                      />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {tarea.descripcion}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Unidad: {tarea.unidad}
                          {tarea.precioRef != null &&
                            ` · Ref: ${formatearPesos(tarea.precioRef)}`}
                        </span>
                      </span>
                    </label>

                    {seleccionada && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <Label
                            htmlFor={`cantidad-${tarea.id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Cantidad ({tarea.unidad})
                          </Label>
                          <Input
                            id={`cantidad-${tarea.id}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            value={item.cantidad}
                            onChange={(e) =>
                              actualizarItem(
                                tarea.id,
                                "cantidad",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label
                            htmlFor={`precio-${tarea.id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Precio unitario
                          </Label>
                          <Input
                            id={`precio-${tarea.id}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            value={item.precioUnitario}
                            onChange={(e) =>
                              actualizarItem(
                                tarea.id,
                                "precioUnitario",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        {/* Material del inventario (opcional): descuenta stock
                            al firmar. Solo si el usuario tiene materiales. */}
                        {materiales.length > 0 && (
                          <div className="col-span-2 flex flex-col gap-1">
                            <Label
                              htmlFor={`material-${tarea.id}`}
                              className="text-xs text-muted-foreground"
                            >
                              Material del inventario (opcional)
                            </Label>
                            <select
                              id={`material-${tarea.id}`}
                              value={item.materialId}
                              onChange={(e) =>
                                actualizarItem(
                                  tarea.id,
                                  "materialId",
                                  e.target.value,
                                )
                              }
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">Sin material</option>
                              {materiales.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.nombre} (stock: {m.stockActual} {m.unidad})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {item.materialId !== "" && (
                          <div className="col-span-2 flex flex-col gap-1">
                            <Label
                              htmlFor={`usada-${tarea.id}`}
                              className="text-xs text-muted-foreground"
                            >
                              Cantidad de material a usar
                            </Label>
                            <Input
                              id={`usada-${tarea.id}`}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="any"
                              placeholder="Ej: 3"
                              value={item.cantidadUsada}
                              onChange={(e) =>
                                actualizarItem(
                                  tarea.id,
                                  "cantidadUsada",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        )}

                        <p className="col-span-2 text-right text-sm text-foreground">
                          Subtotal:{" "}
                          <span className="font-semibold">
                            {formatearPesos(subtotal)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Agregar una tarea propia a este rubro, sin salir del form.
                  Queda persistida (reutilizable) y auto-seleccionada. */}
              <AgregarTareaPropia
                categoria={categoria.valor}
                onCreada={(nueva) => {
                  setTareasExtra((previa) => [...previa, nueva]);
                  setSeleccion((previa) => ({
                    ...previa,
                    [nueva.id]: {
                      cantidad: "1",
                      precioUnitario:
                        nueva.precioRef != null ? String(nueva.precioRef) : "",
                      materialId: "",
                      cantidadUsada: "",
                    },
                  }));
                }}
              />
            </CardContent>
          </Card>
        );
      })}

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {/* 6) Total y 7) Guardar — barra fija abajo (accesible en mobile) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background">
        <div className="container mx-auto flex max-w-2xl items-center justify-between gap-3 py-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              Total ({cantidadSeleccionadas}{" "}
              {cantidadSeleccionadas === 1 ? "tarea" : "tareas"})
            </span>
            <span className="text-xl font-bold text-foreground">
              {formatearPesos(total)}
            </span>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={guardar}
            disabled={guardando}
            className="gap-2"
          >
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {guardando ? "Guardando…" : "Guardar presupuesto"}
          </Button>
        </div>
      </div>

      <UpgradeModal
        abierto={mostrarModalPro}
        onCerrar={() => setMostrarModalPro(false)}
      />
    </div>
  );
}
