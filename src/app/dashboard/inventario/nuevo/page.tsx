import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MaterialForm } from "@/components/inventario/material-form";

export const metadata: Metadata = {
  title: "Nuevo material — ObraApp",
};

export default function NuevoMaterialPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center gap-3 py-4">
          <Link
            href="/dashboard/inventario"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="text-lg font-bold text-foreground">
            Nuevo material
          </span>
        </div>
      </header>

      <main className="container py-6">
        <div className="mx-auto w-full max-w-lg">
          <MaterialForm />
        </div>
      </main>
    </div>
  );
}
