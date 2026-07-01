"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { auditar } from "@/lib/audit-log";

// Extrae la IP del cliente desde los headers de la request (server action).
function ipDelCliente(): string {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "desconocida";
}

// Firma un presupuesto desde la página pública. No requiere sesión.
// - Idempotente: si ya está firmado, devuelve yaFirmado=true (no re-firma).
// - Registra la IP del cliente y la fecha de firma.
export async function firmarPresupuesto(
  token: string,
): Promise<{ ok: boolean; error?: string; yaFirmado?: boolean }> {
  const ip = ipDelCliente();

  // Rate limit por IP: evita abuso de la ruta pública de firma.
  const limite = await rateLimit(`firmar:${ip}`, 15, 60);
  if (!limite.permitido) {
    auditar("ratelimit.bloqueo", { alcance: "firmar", ip });
    return {
      ok: false,
      error: "Demasiados intentos. Probá de nuevo en un momento.",
    };
  }

  const presupuesto = await prisma.presupuesto.findUnique({
    where: { tokenFirma: token },
    select: { id: true, estado: true },
  });
  if (!presupuesto) {
    return { ok: false, error: "No encontramos este presupuesto." };
  }

  // Ya firmado: mostramos la confirmación sin volver a firmar.
  if (presupuesto.estado === "firmado") {
    return { ok: true, yaFirmado: true };
  }

  // Solo se puede firmar un presupuesto que fue enviado.
  if (presupuesto.estado !== "enviado") {
    return {
      ok: false,
      error: "Este presupuesto no está disponible para firmar.",
    };
  }

  await prisma.presupuesto.update({
    where: { id: presupuesto.id },
    data: { estado: "firmado", firmadoAt: new Date(), clienteIp: ip },
  });

  auditar("presupuesto.firmar", { presupuestoId: presupuesto.id, ip });
  revalidatePath(`/presupuesto/${token}`);
  revalidatePath(`/seguimiento/${token}`);
  return { ok: true };
}
