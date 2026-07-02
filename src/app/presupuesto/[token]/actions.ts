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

// Deducción automática de stock de los materiales asociados a los ítems del
// presupuesto. Se llama UNA sola vez, cuando la firma gana la transición
// enviado→firmado (ver firmarPresupuesto). Operaciones secuenciales (sin
// $transaction interactivo) por compatibilidad con el pooler de Supabase.
//
// Stock insuficiente: se descuenta hasta 0 (nunca negativo) y se registra el
// déficit en audit-log. Nunca bloquea ni lanza: si algo falla, se loguea.
async function descontarStock(presupuestoId: string): Promise<void> {
  const items = await prisma.itemPresupuesto.findMany({
    where: {
      presupuestoId,
      materialId: { not: null },
      cantidadUsada: { not: null },
    },
    select: { materialId: true, cantidadUsada: true },
  });

  for (const item of items) {
    const materialId = item.materialId!;
    const usada = item.cantidadUsada ?? 0;
    if (usada <= 0) continue;

    // Leemos el stock actual y calculamos el nuevo con piso en 0 (mismo
    // patrón que ajustarStock). Cada iteración lee fresco, así varios ítems
    // que usan el mismo material se descuentan acumulativamente.
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { stockActual: true, userId: true },
    });
    if (!material) continue;

    const nuevoStock = Math.max(0, material.stockActual - usada);
    const descontado = material.stockActual - nuevoStock; // = min(usada, stock)
    const deficit = Math.max(0, usada - material.stockActual);

    await prisma.material.update({
      where: { id: materialId },
      data: { stockActual: nuevoStock },
    });

    auditar("material.deduccion_automatica", {
      presupuestoId,
      materialId,
      userId: material.userId,
      solicitado: usada,
      descontado,
      deficit,
    });
  }
}

// Firma un presupuesto desde la página pública. No requiere sesión.
// - Idempotente: si ya está firmado, devuelve yaFirmado=true (no re-firma).
// - Registra la IP del cliente y la fecha de firma.
// - Al ganar la transición enviado→firmado, descuenta stock UNA sola vez.
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

  // Ya firmado: mostramos la confirmación sin volver a firmar ni descontar.
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

  // Compare-and-swap ATÓMICO: solo transiciona si sigue "enviado". Esto es la
  // clave de la idempotencia de la deducción: la transición enviado→firmado
  // ocurre exactamente una vez (incluso con dos firmas concurrentes, un solo
  // UPDATE afecta la fila), así que la deducción corre una sola vez. No hace
  // falta una columna marcador.
  const cas = await prisma.presupuesto.updateMany({
    where: { id: presupuesto.id, estado: "enviado" },
    data: { estado: "firmado", firmadoAt: new Date(), clienteIp: ip },
  });

  // Otra request ganó la transición entre el read y el update: ya está firmado.
  if (cas.count === 0) {
    return { ok: true, yaFirmado: true };
  }

  auditar("presupuesto.firmar", { presupuestoId: presupuesto.id, ip });

  // Descontamos stock una única vez. Nunca bloquea la firma: si algo falla,
  // el presupuesto queda firmado igual y solo logueamos el error.
  try {
    await descontarStock(presupuesto.id);
  } catch (error) {
    console.error(
      "Error descontando stock tras firmar el presupuesto:",
      error,
    );
  }

  revalidatePath(`/presupuesto/${token}`);
  revalidatePath(`/seguimiento/${token}`);
  return { ok: true };
}
