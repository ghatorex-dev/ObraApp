import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Ingresar — ObraApp",
};

export default async function LoginPage() {
  // Si ya hay sesión activa, vamos directo al panel.
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      titulo="Ingresá a tu cuenta"
      descripcion="Bienvenido de vuelta. Cargá tus datos para continuar."
    >
      {/* LoginForm usa useSearchParams, por eso va dentro de Suspense. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
