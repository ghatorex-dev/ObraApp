"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

// Buscador simple por nombre. Actualiza el query param ?q con un pequeño
// retardo (debounce) para no navegar en cada tecla.
export function ClientesBuscador() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [valor, setValor] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams();
      if (valor.trim()) {
        params.set("q", valor.trim());
      }
      const query = params.toString();
      router.replace(`/dashboard/clientes${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    }, 300);
    return () => clearTimeout(id);
    // Solo reaccionamos a los cambios del texto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        placeholder="Buscar por nombre…"
        aria-label="Buscar clientes por nombre"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
