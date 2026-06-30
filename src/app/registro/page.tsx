import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegistroForm } from "@/components/auth/registro-form";

export const metadata: Metadata = {
  title: "Crear cuenta — ObraApp",
};

export default async function RegistroPage() {
  // Si ya hay sesión activa, vamos directo al panel.
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      titulo="Creá tu cuenta"
      descripcion="Empezá a hacer presupuestos profesionales en minutos."
    >
      <RegistroForm />
    </AuthShell>
  );
}
