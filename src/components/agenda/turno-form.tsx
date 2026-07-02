"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
import { crearTurno, actualizarTurno } from "@/app/dashboard/agenda/actions";

// Cliente del usuario para el selector opcional.
export type ClienteOpcionTurno = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
};

// Presupuesto del usuario para el selector opcional (con su snapshot de
// cliente para precargar).
export type PresupuestoOpcionTurno = {
  id: string;
  numero: number;
  titulo: string;
  clienteNombre: string;
  clienteEmail: string | null;
  clienteTel: string | null;
  clienteId: string | null;
};

// Valores iniciales: edición (con id) o precarga desde un presupuesto.
export type TurnoFormInicial = {
  id?: string;
  titulo?: string;
  fecha?: string; // ISO
  fechaFin?: string | null; // ISO
  notas?: string | null;
  clienteNombre?: string | null;
  clienteEmail?: string | null;
  clienteTel?: string | null;
  clienteId?: string | null;
  presupuestoId?: string | null;
};

// Convierte un ISO a los valores de los inputs date/time en hora local.
function isoAFecha(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}
function isoAHora(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Formulario de alta / edición de turno. La cancelación va por el cambio de
// estado (no por este formulario).
export function TurnoForm({
  clientes,
  presupuestos,
  inicial,
}: {
  clientes: ClienteOpcionTurno[];
  presupuestos: PresupuestoOpcionTurno[];
  inicial?: TurnoFormInicial;
}) {
  const router = useRouter();
  const esEdicion = Boolean(inicial?.id);

  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [fecha, setFecha] = useState(
    inicial?.fecha ? isoAFecha(inicial.fecha) : "",
  );
  const [hora, setHora] = useState(
    inicial?.fecha ? isoAHora(inicial.fecha) : "",
  );
  const [horaFin, setHoraFin] = useState(
    inicial?.fechaFin ? isoAHora(inicial.fechaFin) : "",
  );
  const [notas, setNotas] = useState(inicial?.notas ?? "");

  const [clienteId, setClienteId] = useState(inicial?.clienteId ?? "");
  const [presupuestoId, setPresupuestoId] = useState(
    inicial?.presupuestoId ?? "",
  );
  const [clienteNombre, setClienteNombre] = useState(
    inicial?.clienteNombre ?? "",
  );
  const [clienteEmail, setClienteEmail] = useState(
    inicial?.clienteEmail ?? "",
  );
  const [clienteTel, setClienteTel] = useState(inicial?.clienteTel ?? "");

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Elegir un cliente existente precarga su snapshot (editable igual).
  function seleccionarCliente(id: string) {
    setClienteId(id);
    if (id) {
      const c = clientes.find((x) => x.id === id);
      if (c) {
        setClienteNombre(c.nombre);
        setClienteEmail(c.email ?? "");
        setClienteTel(c.telefono ?? "");
      }
    }
  }

  // Elegir un presupuesto precarga su cliente (snapshot y asociación),
  // igual de editable que en presupuestos.
  function seleccionarPresupuesto(id: string) {
    setPresupuestoId(id);
    if (id) {
      const p = presupuestos.find((x) => x.id === id);
      if (p) {
        setClienteNombre(p.clienteNombre);
        setClienteEmail(p.clienteEmail ?? "");
        setClienteTel(p.clienteTel ?? "");
        setClienteId(p.clienteId ?? "");
        if (!titulo) setTitulo(p.titulo);
      }
    }
  }

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    if (!titulo.trim()) {
      setError("Ingresá un título.");
      return;
    }
    if (!fecha || !hora) {
      setError("Ingresá la fecha y la hora del turno.");
      return;
    }

    // Fechas construidas en hora local del navegador → ISO (UTC) al server.
    const inicio = new Date(`${fecha}T${hora}`);
    if (Number.isNaN(inicio.getTime())) {
      setError("Fecha u hora inválidas.");
      return;
    }
    let fin: Date | null = null;
    if (horaFin) {
      fin = new Date(`${fecha}T${horaFin}`);
      if (Number.isNaN(fin.getTime())) {
        setError("Hora de fin inválida.");
        return;
      }
      if (fin <= inicio) {
        setError("La hora de fin debe ser posterior al inicio.");
        return;
      }
    }

    const datos = {
      titulo,
      fecha: inicio.toISOString(),
      fechaFin: fin ? fin.toISOString() : null,
      notas,
      clienteNombre,
      clienteEmail,
      clienteTel,
      clienteId: clienteId || undefined,
      presupuestoId: presupuestoId || undefined,
    };

    setGuardando(true);
    // El schema Zod convierte los ISO a Date con z.coerce.date.
    const resultado = esEdicion
      ? await actualizarTurno(inicial!.id!, datos as never)
      : await crearTurno(datos as never);
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.push("/dashboard/agenda");
    router.refresh();
  }

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-lg text-card-foreground">
          {esEdicion ? "Editar turno" : "Nuevo turno"}
        </CardTitle>
        <CardDescription>
          Cliente y presupuesto son opcionales: el turno puede ser suelto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo" className="text-foreground">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titulo"
              placeholder="Ej: Visita para presupuestar baño"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Fecha y horas */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fecha" className="text-foreground">
                Fecha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hora" className="text-foreground">
                Hora <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="horaFin" className="text-foreground">
                Hora fin{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="horaFin"
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>
          </div>

          {/* Asociaciones opcionales */}
          {presupuestos.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="presupuesto" className="text-foreground">
                Presupuesto{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <select
                id="presupuesto"
                value={presupuestoId}
                onChange={(e) => seleccionarPresupuesto(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Sin presupuesto</option>
                {presupuestos.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.numero} · {p.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {clientes.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="cliente" className="text-foreground">
                Cliente{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <select
                id="cliente"
                value={clienteId}
                onChange={(e) => seleccionarCliente(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Sin cliente / datos sueltos</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Datos sueltos del cliente (siempre editables). */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="clienteNombre" className="text-foreground">
              Nombre del cliente{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="clienteNombre"
              placeholder="Ej: María González"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="clienteEmail" className="text-foreground">
                Email{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="clienteEmail"
                type="email"
                inputMode="email"
                placeholder="cliente@ejemplo.com"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas" className="text-foreground">
              Notas <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <textarea
              id="notas"
              rows={3}
              placeholder="Detalles del trabajo, dirección, materiales a llevar…"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={guardando} className="gap-2">
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {guardando
                ? "Guardando…"
                : esEdicion
                  ? "Guardar cambios"
                  : "Crear turno"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-background text-foreground"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
