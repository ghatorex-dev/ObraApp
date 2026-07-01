import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ClienteForm } from "@/components/clientes/cliente-form";

export const metadata: Metadata = {
  title: "Nuevo cliente — ObraApp",
};

export default function NuevoClientePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center gap-3 py-4">
          <Link
            href="/dashboard/clientes"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="text-lg font-bold text-foreground">
            Nuevo cliente
          </span>
        </div>
      </header>

      <main className="container py-6">
        <div className="mx-auto w-full max-w-lg">
          <ClienteForm />
        </div>
      </main>
    </div>
  );
}
