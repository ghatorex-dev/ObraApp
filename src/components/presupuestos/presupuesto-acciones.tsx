"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Send, Trash2, Loader2, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  enviarPresupuesto,
  eliminarPresupuesto,
} from "@/app/dashboard/presupuestos/[id]/actions";

type Props = {
  id: string;
  estado: string;
  esEjemplo: boolean;
  tokenFirma: string | null;
};

// Acciones del detalle de un presupuesto: descargar PDF, enviar (genera token
// de firma), eliminar (solo borradores) y mostrar los links públicos.
export function PresupuestoAcciones({ id, estado, esEjemplo, tokenFirma }: Props) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<"enviar" | "eliminar" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);

  // El origen solo existe en el cliente (evita mismatch de hidratación).
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function manejarEnviar() {
    setOcupado("enviar");
    setError(null);
    const res = await enviarPresupuesto(id);
    setOcupado(null);
    if (!res.ok) {
      setError(res.error ?? "No se pudo enviar.");
      return;
    }
    // Refrescamos para ver el nuevo estado y los links.
    router.refresh();
  }

  async function manejarEliminar() {
    if (!window.confirm("¿Eliminar este presupuesto? No se puede deshacer.")) {
      return;
    }
    setOcupado("eliminar");
    setError(null);
    const res = await eliminarPresupuesto(id);
    if (!res.ok) {
      setOcupado(null);
      setError(res.error ?? "No se pudo eliminar.");
      return;
    }
    router.push("/dashboard/presupuestos");
    router.refresh();
  }

  async function copiar(texto: string, clave: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      window.prompt("Copiá el link:", texto);
    }
  }

  const esBorrador = estado === "borrador";
  const linkFirma = tokenFirma ? `${origin}/presupuesto/${tokenFirma}` : "";
  const linkSeguimiento = tokenFirma
    ? `${origin}/seguimiento/${tokenFirma}`
    : "";

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Descargar PDF: el presupuesto de ejemplo no es descargable. */}
        {!esEjemplo && (
          <Button asChild variant="outline" className="gap-2">
            <a href={`/api/presupuestos/${id}/pdf`} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" />
              Descargar PDF
            </a>
          </Button>
        )}

        {/* Enviar: solo borradores que no sean el ejemplo. */}
        {esBorrador && !esEjemplo && (
          <Button onClick={manejarEnviar} disabled={ocupado !== null} className="gap-2">
            {ocupado === "enviar" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Marcar como enviado
          </Button>
        )}

        {/* Eliminar: solo borradores (incluye el de ejemplo). */}
        {esBorrador && (
          <Button
            onClick={manejarEliminar}
            disabled={ocupado !== null}
            variant="destructive"
            className="gap-2"
          >
            {ocupado === "eliminar" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Eliminar
          </Button>
        )}
      </div>

      {esEjemplo && (
        <p className="text-xs text-muted-foreground">
          Este es un presupuesto de ejemplo: no se puede descargar ni enviar, y
          no cuenta para tu límite. Podés eliminarlo cuando quieras.
        </p>
      )}

      {/* Links públicos: aparecen una vez que el presupuesto fue enviado. */}
      {tokenFirma && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/50 p-3">
          <p className="text-sm font-medium text-foreground">
            Compartí con tu cliente
          </p>
          <LinkCopiable
            etiqueta="Link para firmar"
            valor={linkFirma}
            copiado={copiado === "firma"}
            onCopiar={() => copiar(linkFirma, "firma")}
          />
          <LinkCopiable
            etiqueta="Link de seguimiento (solo lectura)"
            valor={linkSeguimiento}
            copiado={copiado === "seguimiento"}
            onCopiar={() => copiar(linkSeguimiento, "seguimiento")}
          />
        </div>
      )}
    </div>
  );
}

function LinkCopiable({
  etiqueta,
  valor,
  copiado,
  onCopiar,
}: {
  etiqueta: string;
  valor: string;
  copiado: boolean;
  onCopiar: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{etiqueta}</span>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-xs text-foreground">
          {valor}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={onCopiar}
        >
          {copiado ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copiado ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
