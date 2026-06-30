"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

// Botón para cerrar sesión. Vuelve a la página de inicio.
export function LogoutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 bg-background text-foreground"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </Button>
  );
}
