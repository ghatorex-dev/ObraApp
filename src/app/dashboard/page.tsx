import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = {
  title: "Panel — ObraApp",
};

// Panel principal (vacío por ahora). Protegido: requiere sesión.
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const nombre = session.user?.name ?? session.user?.email ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Encabezado del panel */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <span className="text-lg font-bold text-foreground">ObraApp</span>
          <LogoutButton />
        </div>
      </header>

      {/* Contenido */}
      <main className="container flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Hola{nombre ? `, ${nombre}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu panel está en construcción. Pronto vas a poder crear y gestionar
          tus presupuestos desde acá.
        </p>
      </main>
    </div>
  );
}
