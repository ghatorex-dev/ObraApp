"use client";

import { useEffect } from "react";
import { Crown, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PRECIO_PRO_USD } from "@/lib/plan";

// Email de contacto para activar Pro.
// TODO: reemplazar por tu email real o conectar un proveedor de pago (sin
// Stripe). Por ahora el CTA abre un email pre-redactado.
const EMAIL_CONTACTO_PRO = "hola@obraapp.app";

const BENEFICIOS = [
  "Presupuestos ilimitados",
  "PDF sin límites",
  "Firma digital de tus clientes",
  "Seguimiento de cada presupuesto",
];

// Modal de upgrade a Pro. Controlado por `abierto` / `onCerrar`.
// Se muestra al alcanzar el límite del plan Free o desde el botón "Hacerme Pro".
export function UpgradeModal({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  // Cerrar con Escape.
  useEffect(() => {
    if (!abierto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const mailto = `mailto:${EMAIL_CONTACTO_PRO}?subject=${encodeURIComponent(
    "Quiero pasarme a Pro",
  )}&body=${encodeURIComponent(
    "Hola, quiero activar el plan Pro de ObraApp.",
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-pro"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl bg-card p-6 text-card-foreground shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary p-1.5 text-primary-foreground">
              <Crown className="h-4 w-4" aria-hidden />
            </span>
            <h2 id="titulo-pro" className="text-lg font-bold text-foreground">
              Pasate a Pro
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Con Pro creás presupuestos sin límite y aprovechás todo ObraApp.
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {BENEFICIOS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-lg bg-muted px-4 py-3 text-center">
          <span className="text-2xl font-bold text-foreground">
            USD {PRECIO_PRO_USD.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground"> / mes</span>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <a href={mailto}>Quiero pasarme a Pro</a>
          </Button>
          <Button variant="ghost" onClick={onCerrar} className="w-full">
            Ahora no
          </Button>
        </div>
      </div>
    </div>
  );
}
