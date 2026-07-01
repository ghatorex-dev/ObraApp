"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Países ofrecidos en el onboarding (Argentina primero / por defecto).
const PAISES = [
  "Argentina",
  "Bolivia",
  "Chile",
  "Colombia",
  "Ecuador",
  "México",
  "Paraguay",
  "Perú",
  "Uruguay",
  "Venezuela",
  "Otro",
];

// Formulario de onboarding en 1 paso: nombre completo + país.
export function OnboardingForm({ nombreInicial }: { nombreInicial: string }) {
  const router = useRouter();

  const [nombre, setNombre] = useState(nombreInicial);
  const [pais, setPais] = useState("Argentina");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setCargando(true);

    const respuesta = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, pais }),
    });

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}));
      setError(datos.error ?? "No pudimos guardar tus datos. Probá de nuevo.");
      setCargando(false);
      return;
    }

    // Listo: vamos al panel.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre" className="text-foreground">
          Nombre completo
        </Label>
        <Input
          id="nombre"
          type="text"
          autoComplete="name"
          placeholder="Juan Pérez"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pais" className="text-foreground">
          País
        </Label>
        <select
          id="pais"
          value={pais}
          onChange={(e) => setPais(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {PAISES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={cargando}>
        {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
        {cargando ? "Guardando…" : "Empezar a usar ObraApp"}
      </Button>
    </form>
  );
}
