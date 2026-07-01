"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";

// Formulario de registro con nombre, email y contraseña.
export function RegistroForm() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    // Validación rápida del lado del cliente (el servidor también valida).
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setCargando(true);

    // 1) Creamos la cuenta.
    const respuesta = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password }),
    });

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}));
      setError(datos.error ?? "No pudimos crear tu cuenta. Probá de nuevo.");
      setCargando(false);
      return;
    }

    // 2) Iniciamos sesión automáticamente con las credenciales recién creadas.
    const resultado = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setCargando(false);

    if (!resultado || resultado.error) {
      // La cuenta se creó, pero el login automático falló: lo mandamos al login.
      router.push("/login");
      return;
    }

    // Cuenta nueva: la mandamos al onboarding.
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombre" className="text-foreground">
            Nombre
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
          <Label htmlFor="email" className="text-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="vos@ejemplo.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-foreground">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <Button type="submit" className="w-full" disabled={cargando}>
          {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
          {cargando ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      {/* Separador */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton texto="Registrarse con Google" />

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Ingresá
        </Link>
      </p>
    </div>
  );
}
