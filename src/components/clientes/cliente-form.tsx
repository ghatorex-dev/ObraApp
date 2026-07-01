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
import {
  crearCliente,
  actualizarCliente,
} from "@/app/dashboard/clientes/actions";

// Valores iniciales del formulario (para edición).
export type ClienteInicial = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
};

// Formulario reutilizable para alta y edición de clientes.
export function ClienteForm({ inicial }: { inicial?: ClienteInicial }) {
  const router = useRouter();
  const esEdicion = Boolean(inicial);

  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [telefono, setTelefono] = useState(inicial?.telefono ?? "");
  const [email, setEmail] = useState(inicial?.email ?? "");
  const [direccion, setDireccion] = useState(inicial?.direccion ?? "");
  const [notas, setNotas] = useState(inicial?.notas ?? "");

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("Ingresá el nombre del cliente.");
      return;
    }

    const datos = { nombre, telefono, email, direccion, notas };

    setGuardando(true);
    const resultado = esEdicion
      ? await actualizarCliente(inicial!.id, datos)
      : await crearCliente(datos);
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    // Vamos al detalle del cliente.
    router.push(`/dashboard/clientes/${resultado.id}`);
    router.refresh();
  }

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-lg text-card-foreground">
          {esEdicion ? "Editar cliente" : "Nuevo cliente"}
        </CardTitle>
        <CardDescription>
          Solo el nombre es obligatorio. El resto es opcional.
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
              placeholder="Ej: María González"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="telefono" className="text-foreground">
              Teléfono <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="telefono"
              type="tel"
              inputMode="tel"
              placeholder="Ej: 11 2345-6789"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-foreground">
              Email <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              placeholder="cliente@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="direccion" className="text-foreground">
              Dirección{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="direccion"
              placeholder="Ej: Av. Siempreviva 742"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas" className="text-foreground">
              Notas <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <textarea
              id="notas"
              rows={3}
              placeholder="Anotaciones internas sobre el cliente"
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
                  : "Crear cliente"}
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
