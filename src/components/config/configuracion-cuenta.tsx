"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoutButton } from "@/components/auth/logout-button";
import { actualizarNombre } from "@/app/dashboard/configuracion/actions";

// Email de contacto para solicitudes (eliminación de cuenta).
// TODO: reemplazar por tu email real de soporte/legal.
const EMAIL_CONTACTO = "hola@obraapp.app";

export function ConfiguracionCuenta({
  nombreInicial,
  email,
}: {
  nombreInicial: string;
  email: string;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setGuardado(false);
    setGuardando(true);
    const res = await actualizarNombre(nombre);
    setGuardando(false);
    if (!res.ok) {
      setError(res.error ?? "No se pudo guardar.");
      return;
    }
    setGuardado(true);
    router.refresh();
    setTimeout(() => setGuardado(false), 2500);
  }

  // Email pre-redactado para pedir la eliminación de la cuenta.
  const mailtoEliminar = `mailto:${EMAIL_CONTACTO}?subject=${encodeURIComponent(
    "Eliminar mi cuenta",
  )}&body=${encodeURIComponent(
    `Hola, solicito la eliminación de mi cuenta de ObraApp y de todos mis datos asociados.\n\nEmail registrado: ${email}\n\nGracias.`,
  )}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Nombre */}
      <form onSubmit={guardar} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombre" className="text-foreground">
            Nombre
          </Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Email</Label>
          <Input value={email} disabled readOnly className="text-muted-foreground" />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={guardando} className="w-fit gap-2">
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : guardado ? (
            <Check className="h-4 w-4" />
          ) : null}
          {guardando ? "Guardando…" : guardado ? "Guardado" : "Guardar cambios"}
        </Button>
      </form>

      {/* Sesión */}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">Sesión</p>
        <LogoutButton />
      </div>

      {/* Eliminación de cuenta */}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">Privacidad y datos</p>
        <p className="text-xs text-muted-foreground">
          Podés solicitar la eliminación de tu cuenta y de todos tus datos.
        </p>
        <Button asChild variant="destructive" className="w-fit gap-2">
          <a href={mailtoEliminar}>
            <Trash2 className="h-4 w-4" />
            Solicitar eliminación de cuenta
          </a>
        </Button>
      </div>
    </div>
  );
}
