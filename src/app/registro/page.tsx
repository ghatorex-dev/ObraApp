import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegistroForm } from "@/components/auth/registro-form";

export const metadata: Metadata = {
  title: "Crear cuenta — ObraApp",
};

// El redirect de usuarios ya autenticados lo maneja el middleware
// (única autoridad de auth). Acá NO usamos getServerSession para evitar
// el loop de redirecciones.
export default function RegistroPage() {
  return (
    <AuthShell
      titulo="Creá tu cuenta"
      descripcion="Empezá a hacer presupuestos profesionales en minutos."
    >
      <RegistroForm />
    </AuthShell>
  );
}
