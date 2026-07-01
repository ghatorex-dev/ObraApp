import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Ingresar — ObraApp",
};

// El redirect de usuarios ya autenticados lo maneja el middleware
// (única autoridad de auth). Acá NO usamos getServerSession para evitar
// el loop de redirecciones.
export default function LoginPage() {
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
