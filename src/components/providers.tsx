"use client";

import { SessionProvider } from "next-auth/react";

// Proveedor de sesión de NextAuth para componentes del lado del cliente.
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
