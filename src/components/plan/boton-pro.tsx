"use client";

import { useState } from "react";
import { Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/plan/upgrade-modal";

// Botón "Hacerme Pro" para el dashboard. Abre el modal de upgrade.
export function BotonPro() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Button
        type="button"
        onClick={() => setAbierto(true)}
        className="gap-2 shrink-0"
      >
        <Crown className="h-4 w-4" />
        Hacerme Pro
      </Button>
      <UpgradeModal abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}
